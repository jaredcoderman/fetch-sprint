import OpenAI from 'openai';

// Initialize OpenAI client
// Note: In production, this should be done via a backend/Cloud Function to keep API key secure
let openai = null;

export function initializeOpenAI(apiKey) {
  openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Only for development! Use backend in production
  });
}

/**
 * Process receipt image and extract total amount using GPT-4 Vision
 * @param {File} imageFile - The receipt image file
 * @returns {Promise<Object>} - Object containing amount and extracted data
 */
export async function processReceiptImage(imageFile) {
  if (!openai) {
    throw new Error('OpenAI not initialized. Please set your API key first.');
  }

  try {
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    
    // Call GPT-4 Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using mini for cost efficiency, use "gpt-4o" for better accuracy
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
                url: base64Image
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    // Parse the response
    const content = response.choices[0].message.content;
    console.log('OpenAI Response:', content);
    
    // Extract JSON from response (sometimes it includes markdown formatting)
    let jsonMatch = content.match(/\{[\s\S]*\}/);
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
    
    return {
      amount: data.total,
      storeName: data.storeName || 'Unknown Store',
      date: data.date || new Date().toISOString().split('T')[0],
      currency: data.currency || 'USD',
      confidence: data.confidence,
      rawResponse: content
    };
    
  } catch (error) {
    console.error('Error processing receipt:', error);
    throw new Error(`Failed to process receipt: ${error.message}`);
  }
}

/**
 * Convert File to base64 data URL
 * @param {File} file - Image file
 * @returns {Promise<string>} - Base64 data URL
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Validate if an image looks like a receipt (basic check)
 * @param {File} file - Image file
 * @returns {boolean} - True if file appears valid
 */
export function validateReceiptImage(file) {
  // Check file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }
  
  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image file too large. Maximum size is 10MB');
  }
  
  return true;
}

