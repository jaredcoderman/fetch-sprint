# Receipt OCR Setup Guide 🔍

This app now includes automatic receipt verification using OpenAI's GPT-4 Vision API to prevent users from entering fake amounts.

## How It Works

1. **User uploads receipt** → Image is sent to GPT-4 Vision
2. **AI extracts total** → Amount, store name, date are automatically detected
3. **Verification** → Only AI-verified receipts get points automatically
4. **Manual entries** → Require admin approval

## Setting Up OpenAI API

### Step 1: Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to [API Keys](https://platform.openai.com/api-keys)
4. Click **"Create new secret key"**
5. Give it a name like "Receipt Sprint"
6. **Copy the key** (starts with `sk-...`)
7. **Save it somewhere safe** - you won't be able to see it again!

### Step 2: Add Credits to Your OpenAI Account

1. Go to [Billing](https://platform.openai.com/account/billing)
2. Click **"Add payment method"**
3. Add a credit card
4. Add initial credits (recommend $5-10 to start)

### Step 3: Configure in the App

1. Run the app and log in
2. Click **⚙️ Settings** in the top navigation
3. Paste your OpenAI API key
4. Click **"Save Settings"**

### Step 4: Test Receipt Upload

1. Go to any team dashboard
2. Click **"Upload Receipt"**
3. Select a receipt image
4. The AI will automatically:
   - Extract the total amount
   - Identify the store name
   - Verify the receipt is readable
5. If successful, points are added automatically!

## Cost Breakdown

Using **GPT-4o-mini** (recommended):
- Cost: ~$0.01 per receipt
- 100 receipts = $1
- Very affordable for most use cases

Using **GPT-4o** (more accurate):
- Cost: ~$0.05 per receipt  
- 20 receipts = $1
- Use if you need highest accuracy

You can change the model in `src/utils/receiptOCR.js` line 26:
```javascript
model: "gpt-4o-mini", // or "gpt-4o" for better accuracy
```

## Security & Production Considerations

### ⚠️ Current Implementation (Development Only)

The current setup stores the API key in localStorage and calls OpenAI directly from the browser. This is:
- ✅ Easy to set up and test
- ✅ No backend needed
- ❌ API key exposed in browser
- ❌ Not secure for production

### ✅ Production Recommendation

For production, you should:

1. **Use Firebase Cloud Functions** or a backend server
2. **Store API key securely** in environment variables
3. **Process receipts server-side**

Example Cloud Function:
```javascript
// functions/processReceipt.js
const functions = require('firebase-functions');
const OpenAI = require('openai');

exports.processReceipt = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const openai = new OpenAI({
    apiKey: functions.config().openai.key
  });
  
  // Process receipt...
  const result = await openai.chat.completions.create({...});
  
  return result;
});
```

## Alternative OCR Solutions

If you don't want to use OpenAI, here are alternatives:

### 1. Google Cloud Vision API
- **Pros:** Excellent OCR, integrates with Firebase
- **Cons:** More setup, less intelligent than GPT-4
- **Cost:** ~$1.50 per 1000 images
- **Setup:** Enable in Google Cloud Console

### 2. AWS Textract
- **Pros:** Good accuracy, receipt-specific features
- **Cons:** AWS setup needed
- **Cost:** ~$1.50 per 1000 pages

### 3. Tesseract.js (Free)
- **Pros:** Free, runs in browser
- **Cons:** Lower accuracy, harder to extract totals
- **Cost:** Free!

### 4. Veryfi / Mindee (Receipt APIs)
- **Pros:** Built specifically for receipts
- **Cons:** More expensive
- **Cost:** Varies by plan

## Troubleshooting

### "OpenAI not initialized" Error
- Go to Settings and add your OpenAI API key

### "Could not extract total amount"
- Receipt image may be too blurry
- Try taking a clearer photo
- Make sure the total is visible

### "Rate limit exceeded"
- You've hit OpenAI's rate limit
- Wait a minute and try again
- Or upgrade your OpenAI plan

### "Insufficient credits"
- Add more credits to your OpenAI account
- Go to OpenAI Platform → Billing

### High API costs
- Switch from `gpt-4o` to `gpt-4o-mini`
- Implement caching for duplicate receipts
- Add client-side image compression

## Features

✅ **Automatic amount extraction**
✅ **Store name detection**
✅ **Date extraction**
✅ **Confidence scoring**
✅ **Manual fallback option**
✅ **Image preview**
✅ **Real-time processing**

## Future Enhancements

Potential improvements:
- [ ] Receipt caching to prevent duplicates
- [ ] Image compression before sending to API
- [ ] Support for multiple currencies
- [ ] Item-level extraction
- [ ] Category detection (groceries, gas, etc.)
- [ ] Receipt fraud detection
- [ ] Batch processing for multiple receipts
- [ ] Admin dashboard for manual review

## Support

If you run into issues:
1. Check the browser console for errors
2. Verify your OpenAI API key is correct
3. Make sure you have credits in your OpenAI account
4. Try with a clear, well-lit receipt image

---

Built with ❤️ using OpenAI GPT-4 Vision

