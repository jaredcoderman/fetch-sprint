# Utils

This folder contains utility functions for the Receipt Sprint app.

## receiptOCR.js

Handles automatic receipt processing using OpenAI's GPT-4 Vision API.

### Functions:

- `initializeOpenAI(apiKey)` - Initialize OpenAI client with API key
- `processReceiptImage(imageFile)` - Extract receipt data from image
- `validateReceiptImage(file)` - Validate image file before processing

### Usage:

```javascript
import { initializeOpenAI, processReceiptImage } from './utils/receiptOCR';

// Initialize once with API key
initializeOpenAI('sk-...');

// Process a receipt
const result = await processReceiptImage(imageFile);
console.log(result.amount); // 25.50
console.log(result.storeName); // "Walmart"
console.log(result.confidence); // "high"
```

### Security Note:

⚠️ The current implementation uses `dangerouslyAllowBrowser: true` for development convenience. In production, you should:

1. Move OCR processing to a backend/Cloud Function
2. Store API keys securely in environment variables
3. Never expose API keys in client-side code

See `RECEIPT_OCR_SETUP.md` for production recommendations.

