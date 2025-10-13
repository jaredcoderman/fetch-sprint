const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const OpenAI = require('openai');

// Initialize Firebase Admin
admin.initializeApp();

// Set global options
setGlobalOptions({ maxInstances: 10 });

// Initialize OpenAI with secret (lazy initialization)
// The API key should be stored in Firebase Secrets
let openai = null;

function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
}

/**
 * Cloud Function to process receipt images
 * Called from client with base64 image
 */
exports.processReceipt = onCall(
  { secrets: ['OPENAI_API_KEY'] },
  async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in to process receipts');
  }

  const { imageBase64 } = request.data;

  if (!imageBase64) {
    throw new HttpsError('invalid-argument', 'Image data is required');
  }

  try {
    console.log('Processing receipt for user:', request.auth.uid);

    // Check if OpenAI API key is configured
    const openaiClient = getOpenAI();
    if (!openaiClient) {
      throw new HttpsError(
        'failed-precondition',
        'OpenAI API key not configured yet. Administrator needs to add the OPENAI_API_KEY secret in Firebase Console.'
      );
    }

    // Call GPT-4 Vision API
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini", // Use gpt-4o for better accuracy (costs more)
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this receipt image and extract the following information:
1. Total amount (the final total paid, not subtotal)
2. Store name
3. Date (if visible)
4. Currency (default to USD if not visible)

Return ONLY a JSON object in this exact format:
{
  "total": 25.50,
  "storeName": "Store Name",
  "date": "2024-01-15",
  "currency": "USD",
  "confidence": "high"
}

If you cannot clearly read the total, set confidence to "low" or "none".
Make sure the total is a number without currency symbols.`
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    console.log('OpenAI Response:', content);

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse receipt data from response');
    }

    const data = JSON.parse(jsonMatch[0]);

    // Validate the response
    if (!data.total || typeof data.total !== 'number') {
      throw new Error('Could not extract total amount from receipt');
    }

    if (data.confidence === 'none' || data.confidence === 'low') {
      throw new Error('Receipt image is too unclear to read accurately');
    }

    // Return the processed data
    return {
      amount: data.total,
      storeName: data.storeName || 'Unknown Store',
      date: data.date || new Date().toISOString().split('T')[0],
      currency: data.currency || 'USD',
      confidence: data.confidence,
      processedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error processing receipt:', error);
    throw new HttpsError(
      'internal',
      `Failed to process receipt: ${error.message}`
    );
  }
});

/**
 * Optional: Verify receipt after upload
 * This can be called after the receipt is stored to double-check
 */
exports.verifyReceipt = onCall(
  { secrets: ['OPENAI_API_KEY'] },
  async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  const { receiptId } = request.data;

  if (!receiptId) {
    throw new HttpsError('invalid-argument', 'Receipt ID is required');
  }

  try {
    // Get receipt from Firestore
    const receiptDoc = await admin.firestore()
      .collection('receipts')
      .doc(receiptId)
      .get();

    if (!receiptDoc.exists) {
      throw new HttpsError('not-found', 'Receipt not found');
    }

    const receipt = receiptDoc.data();

    // Only allow verification of own receipts or admin
    if (receipt.userId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'Not authorized');
    }

    return {
      verified: receipt.ocrVerified || false,
      confidence: receipt.ocrConfidence || 'unknown',
      amount: receipt.amount,
      status: receipt.status
    };

  } catch (error) {
    console.error('Error verifying receipt:', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Reserve a unique receipt hash per competition to prevent duplicates
 * Creates a doc with ID `${competitionId}_${imageHash}`; fails if it exists
 */
exports.reserveReceiptHash = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  const { competitionId, imageHash } = request.data || {};
  if (!competitionId || typeof competitionId !== 'string') {
    throw new HttpsError('invalid-argument', 'competitionId is required');
  }
  if (!imageHash || typeof imageHash !== 'string' || imageHash.length < 32) {
    throw new HttpsError('invalid-argument', 'imageHash is required');
  }

  const docId = `${competitionId}_${imageHash}`;
  const ref = admin.firestore().collection('receiptHashes').doc(docId);

  try {
    await ref.create({
      competitionId,
      imageHash,
      userId: request.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { reserved: true };
  } catch (error) {
    // Firestore create() throws if already exists
    if (error && (error.code === 6 || error.code === 'already-exists')) {
      throw new HttpsError('already-exists', 'Duplicate receipt for this competition');
    }
    console.error('Error reserving receipt hash:', error);
    throw new HttpsError('internal', 'Failed to reserve receipt hash');
  }
});

/**
 * Release a reserved receipt hash if the upload fails
 */
exports.releaseReceiptHash = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  const { competitionId, imageHash } = request.data || {};
  if (!competitionId || typeof competitionId !== 'string') {
    throw new HttpsError('invalid-argument', 'competitionId is required');
  }
  if (!imageHash || typeof imageHash !== 'string' || imageHash.length < 32) {
    throw new HttpsError('invalid-argument', 'imageHash is required');
  }

  const docId = `${competitionId}_${imageHash}`;
  const ref = admin.firestore().collection('receiptHashes').doc(docId);

  try {
    const snap = await ref.get();
    if (!snap.exists) {
      return { released: true, existed: false };
    }
    const data = snap.data();
    if (data.userId && data.userId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'Not owner of reservation');
    }
    await ref.delete();
    return { released: true, existed: true };
  } catch (error) {
    console.error('Error releasing receipt hash:', error);
    throw new HttpsError('internal', 'Failed to release receipt hash');
  }
});

