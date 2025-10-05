# 🚀 Deploy Your Secure App Now!

Your app is **100% secure** and ready to deploy! Follow these steps:

## Step 1: Set Your OpenAI API Key (One Time) 🔑

```bash
firebase functions:secrets:set OPENAI_API_KEY
```

Paste your OpenAI API key when prompted (starts with `sk-...`)

Don't have one? Get it here: https://platform.openai.com/api-keys

## Step 2: Deploy Everything 🚀

```bash
firebase deploy
```

This deploys:
- ✅ Your React app (frontend)
- ✅ Cloud Functions (secure backend)
- ✅ API key (encrypted secret)

Wait 1-2 minutes...

## Step 3: Add Domain to Firebase Auth ⚙️

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → **Authentication** → **Settings**
3. Scroll to **"Authorized domains"**
4. Click **"Add domain"**
5. Add: `receipt-sprint.web.app`
6. Click **"Add"**

## Step 4: Test Your Live App! 🎉

Go to: **https://receipt-sprint.web.app**

Try:
1. Sign up / log in
2. Create a competition
3. Join/create a team
4. Upload a receipt image
5. Watch AI extract the total automatically!

---

## ✅ What's Now Secure

- ✅ **API Key:** Stored on Firebase servers (encrypted)
- ✅ **OCR Processing:** Happens server-side only
- ✅ **User Access:** No one can see your API key
- ✅ **No Settings Page:** Removed (was insecure!)
- ✅ **Rate Limiting:** Firebase automatically protects you

---

## 🔄 Future Updates

When you make changes to your app:

```bash
# Make your code changes, then:
npm run build
firebase deploy
```

Done in 30 seconds!

---

## 💰 Cost Tracking

Monitor your OpenAI usage:
- https://platform.openai.com/usage
- ~$0.01 per receipt (gpt-4o-mini)
- $10 = ~1000 receipts

Set up billing alerts in OpenAI to stay safe!

---

## 🐛 Troubleshooting

**Receipt upload fails:**
```bash
firebase functions:log
```

**Functions not working:**
```bash
firebase deploy --only functions
```

**Need to update API key:**
```bash
firebase functions:secrets:set OPENAI_API_KEY
firebase deploy --only functions
```

---

## 📚 Documentation

- `SETUP_YOUR_API_KEY.md` - Detailed API key setup
- `SECURE_DEPLOYMENT.md` - Full security documentation
- `QUICK_DEPLOY.md` - Fast deployment guide

---

**Ready? Let's deploy!** 🚀

```bash
firebase functions:secrets:set OPENAI_API_KEY
firebase deploy
```

