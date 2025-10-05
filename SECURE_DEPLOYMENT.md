# 🔒 Secure Deployment with Cloud Functions

Your app now uses **Firebase Cloud Functions** to process receipts securely on the server-side. Users never see your OpenAI API key!

## ✅ What Changed

- ❌ **REMOVED:** Settings page where users enter API keys (insecure!)
- ❌ **REMOVED:** Client-side OpenAI API calls
- ✅ **ADDED:** Cloud Function that processes receipts server-side
- ✅ **ADDED:** Secure API key storage using Firebase Secrets

## 🚀 Deployment Steps

### 1. Install Cloud Functions Dependencies

```bash
cd functions
npm install
cd ..
```

### 2. Set Your OpenAI API Key as a Secret

You need to provide YOUR OpenAI API key once, and it will be stored securely:

```bash
firebase functions:secrets:set OPENAI_API_KEY
```

When prompted, paste your OpenAI API key (starts with `sk-...`)

### 3. Deploy Everything

```bash
# Build the frontend
npm run build

# Deploy both hosting and functions
firebase deploy
```

This deploys:
- ✅ Your React app (hosting)
- ✅ Cloud Functions (backend)
- ✅ Secure API key (secret)

## 🎯 How It Works Now

```
User uploads receipt
      ↓
React app sends image to Cloud Function
      ↓
Cloud Function uses YOUR OpenAI API key (secure!)
      ↓
GPT-4 Vision processes receipt
      ↓
Result sent back to user
      ↓
Points added automatically
```

**Key Point:** The OpenAI API key NEVER leaves the server. Users can't see it!

## 💰 Cost Structure

Now YOU pay for all OCR processing (not users):

- **Your OpenAI API:** ~$0.01 per receipt
- **Firebase Functions:** Free tier = 2M invocations/month
- **Total:** Very affordable unless you have thousands of users

## 🔐 Security Benefits

✅ **API key is secure** - Stored in Firebase Secrets, never in code  
✅ **Authentication required** - Only logged-in users can process receipts  
✅ **Rate limiting** - Firebase automatically protects against abuse  
✅ **Audit trail** - All function calls are logged  
✅ **No client-side exposure** - Users can't steal your API key

## 📝 Managing Your API Key

### View Current Secret
```bash
firebase functions:secrets:access OPENAI_API_KEY
```

### Update API Key
```bash
firebase functions:secrets:set OPENAI_API_KEY
firebase deploy --only functions
```

### Remove API Key
```bash
firebase functions:secrets:destroy OPENAI_API_KEY
```

## 🧪 Testing Locally

### 1. Set up local environment
```bash
cd functions
echo "OPENAI_API_KEY=sk-your-key-here" > .env
```

### 2. Start Firebase Emulators
```bash
firebase emulators:start
```

### 3. Test in browser
Your app will connect to local functions automatically during development.

## 📊 Monitoring

### View Function Logs
```bash
firebase functions:log
```

### Check Invocations
```bash
firebase functions:list
```

### Monitor in Console
- Go to [Firebase Console](https://console.firebase.google.com/)
- Select your project → Functions
- View invocations, errors, and execution time

## 🐛 Troubleshooting

### "Failed to process receipt"
- Check Cloud Function logs: `firebase functions:log`
- Verify API key is set: `firebase functions:secrets:access OPENAI_API_KEY`
- Ensure functions are deployed: `firebase deploy --only functions`

### "Unauthenticated" error
- User must be logged in
- Check Firebase Auth is working

### "Failed precondition" error
- OpenAI API key not set
- Run: `firebase functions:secrets:set OPENAI_API_KEY`

### Functions not deploying
- Check you're logged in: `firebase login`
- Verify project: `firebase use receipt-sprint`
- Check functions/package.json exists

## 💡 Pro Tips

1. **Monitor costs:** Set up billing alerts in OpenAI Platform
2. **Rate limiting:** Add rate limits if needed (Firestore rules)
3. **Image optimization:** Compress images before sending to reduce API costs
4. **Caching:** Cache results to avoid reprocessing same receipts
5. **Fallback:** Keep manual entry option if OCR fails

## 📈 Scaling

As your app grows:

- **Free tier** handles ~200,000 receipts/month
- **Blaze plan** auto-scales, pay as you go
- **Cold starts** ~1-2 seconds (acceptable for OCR)
- **Concurrent limit** 10 (configurable in functions/index.js)

## 🎓 Next Steps

After deployment:
1. ✅ Test receipt upload end-to-end
2. 📊 Monitor function invocations
3. 💰 Set up billing alerts
4. 🔒 Review Firestore security rules
5. 📧 (Optional) Add email notifications for failed receipts

---

**Your API key is now secure!** 🔒

Users can upload receipts, and everything is processed server-side safely.

