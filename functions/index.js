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
5. Full text content of the receipt (all visible text)

Return ONLY a JSON object in this exact format:
{
  "total": 25.50,
  "storeName": "Store Name",
  "date": "2024-01-15",
  "currency": "USD",
  "confidence": "high",
  "fullText": "All the text content from the receipt..."
}

If you cannot clearly read the total, set confidence to "low" or "none".
Make sure the total is a number without currency symbols.
Include all readable text from the receipt in the fullText field.`
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
      fullText: data.fullText || '',
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
 * Cloud Function to validate university names using Admin SDK
 * This bypasses client-side Firestore rules and queries the complete database
 */
exports.validateUniversity = onCall(
  async (request) => {
    const { schoolName } = request.data;

    if (!schoolName || typeof schoolName !== 'string') {
      throw new HttpsError('invalid-argument', 'School name is required');
    }

    try {
      console.log('Validating university:', schoolName);
      
      const db = admin.firestore();
      const searchTerm = schoolName.trim();
      const searchTermLower = searchTerm.toLowerCase();
      
      // First try exact match
      console.log('Trying exact match for:', searchTerm);
      const exactQuery = db.collection('universities')
        .where('name', '==', searchTerm)
        .limit(1);
      
      const exactSnapshot = await exactQuery.get();
      console.log('Exact match results:', exactSnapshot.size);
      
      if (!exactSnapshot.empty) {
        const schoolData = exactSnapshot.docs[0].data();
        console.log('Found exact match:', schoolData);
        return { 
          isValid: true, 
          school: schoolData,
          matchType: 'exact'
        };
      }
      
      // Try partial match (case-insensitive)
      console.log('Trying partial match for:', searchTermLower);
      const allQuery = db.collection('universities').limit(7000);
      const allSnapshot = await allQuery.get();
      console.log('Total universities in database:', allSnapshot.size);
      
      for (const doc of allSnapshot.docs) {
        const university = doc.data();
        if (university.name && university.name.toLowerCase().includes(searchTermLower)) {
          console.log('Found partial match:', university);
          return { 
            isValid: true, 
            school: university,
            matchType: 'partial'
          };
        }
      }
      
      console.log('No matches found for:', searchTerm);
      return { 
        isValid: false, 
        message: `School "${searchTerm}" not found in our database. Please check the spelling or try a different name.`,
        searchedCount: allSnapshot.size
      };
      
    } catch (error) {
      console.error('Error validating university:', error);
      throw new HttpsError('internal', `Failed to validate university: ${error.message}`);
    }
  }
);

/**
 * Cloud Function to verify Fetch app profile screenshots using AI
 * Checks for profile picture icon and "Fetch" text to validate authenticity
 */
exports.verifyFetchProfile = onCall(
  { secrets: ['OPENAI_API_KEY'] },
  async (request) => {
    const { imageUrl } = request.data;

    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new HttpsError('invalid-argument', 'Image URL is required');
    }

    try {
      console.log('Verifying Fetch profile screenshot:', imageUrl);
      
      // Check if OpenAI API key is configured
      const openaiClient = getOpenAI();
      if (!openaiClient) {
        throw new HttpsError(
          'failed-precondition',
          'OpenAI API key not configured. Administrator needs to add the OPENAI_API_KEY secret in Firebase Console.'
        );
      }

      // Call GPT-4 Vision API to analyze the screenshot
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this screenshot to determine if it shows a legitimate Fetch app profile. Look for these specific elements:

1. A person's full name displayed near the top of the screen (first name and last name)
2. The word "Fetch" visible on screen (in app name, branding, or text)
3. Profile-related UI elements (points, settings, profile information, etc.)
4. Overall app interface that looks like a mobile app profile screen

Return ONLY a JSON object in this exact format:
{
  "isValid": true/false,
  "confidence": "high/medium/low",
  "details": "Brief explanation of what you found",
  "reasons": ["list", "of", "specific", "reasons"]
}

If you cannot clearly see a person's full name (first and last name) near the top of the screen AND the word "Fetch" on screen, set isValid to false.
Be strict - only approve screenshots that clearly show a Fetch app profile with a visible full name.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 300
      });

      const content = response.choices[0].message.content;
      console.log('OpenAI Response:', content);

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse verification data from response');
      }

      const verificationData = JSON.parse(jsonMatch[0]);

      // Validate the response structure
      if (typeof verificationData.isValid !== 'boolean') {
        throw new Error('Invalid verification response format');
      }

      console.log('Verification result:', verificationData);

      return {
        isValid: verificationData.isValid,
        confidence: verificationData.confidence || 'unknown',
        details: verificationData.details || 'No details provided',
        reasons: verificationData.reasons || [],
        verifiedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error verifying Fetch profile:', error);
      throw new HttpsError(
        'internal',
        `Failed to verify Fetch profile: ${error.message}`
      );
    }
  }
);

