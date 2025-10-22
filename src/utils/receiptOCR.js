import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebase';

// Initialize Cloud Functions
const functions = getFunctions(app);

/**
 * Process receipt image using Cloud Function (server-side)
 * This keeps the OpenAI API key secure on the backend
 * @param {File} imageFile - The receipt image file
 * @returns {Promise<Object>} - Object containing amount and extracted data
 */
export async function processReceiptImage(imageFile) {
  try {
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    
    // Call Cloud Function
    const processReceipt = httpsCallable(functions, 'processReceipt');
    const result = await processReceipt({ imageBase64: base64Image });
    
    // Return the processed data
    return {
      amount: result.data.amount,
      storeName: result.data.storeName || 'Unknown Store',
      date: result.data.date || new Date().toISOString().split('T')[0],
      currency: result.data.currency || 'USD',
      confidence: result.data.confidence,
      processedAt: result.data.processedAt,
      isCVS: result.data.isCVS || false,
      isCVSEligible: result.data.isCVSEligible || false,
      basePoints: result.data.basePoints || 0,
      finalPoints: result.data.finalPoints || 0,
      pointsMultiplier: result.data.pointsMultiplier || 1
    };
    
  } catch (error) {
    console.error('Error processing receipt:', error);
    
    // Provide user-friendly error messages
    if (error.code === 'unauthenticated') {
      throw new Error('Please log in to process receipts');
    } else if (error.code === 'failed-precondition') {
      throw new Error('Receipt processing is not configured. Contact administrator.');
    } else {
      throw new Error(`Failed to process receipt: ${error.message}`);
    }
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

/**
 * Verify a receipt that was already uploaded
 * @param {string} receiptId - Firestore receipt document ID
 * @returns {Promise<Object>} - Verification result
 */
export async function verifyReceipt(receiptId) {
  try {
    const verifyReceiptFn = httpsCallable(functions, 'verifyReceipt');
    const result = await verifyReceiptFn({ receiptId });
    return result.data;
  } catch (error) {
    console.error('Error verifying receipt:', error);
    throw new Error(`Failed to verify receipt: ${error.message}`);
  }
}
