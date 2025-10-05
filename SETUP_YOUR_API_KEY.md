# 🔑 Setup Your OpenAI API Key (One Time)

Your app is now **100% secure**! The OpenAI API key is stored on Firebase servers, not in the browser.

## Quick Setup (3 minutes)

### 1. Get Your OpenAI API Key

If you don't have one yet:
1. Go to https://platform.openai.com/api-keys
2. Sign up / log in
3. Click **"Create new secret key"**
4. Give it a name: "Receipt Sprint"
5. Copy the key (starts with `sk-...`)

### 2. Add Billing (Required for API to work)

1. Go to https://platform.openai.com/account/billing
2. Add payment method
3. Add $5-10 credits (will last for ~500-1000 receipts)

### 3. Store API Key Securely in Firebase

**Option A: Using Firebase CLI (Recommended)**

```bash
firebase functions:secrets:set OPENAI_API_KEY
```

When prompted, paste your API key and press Enter.

**Option B: Using Firebase Console**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Functions** → **Configuration** → **Secrets**
4. Add secret: `OPENAI_API_KEY`
5. Paste your OpenAI API key

### 4. Deploy Functions

```bash
firebase deploy --only functions
```

This uploads your Cloud Function that will process receipts securely.

### 5. Test It!

1. Go to your live app
2. Create a competition and join a team
3. Upload a receipt image
4. Watch it automatically extract the total! ✨

---

## ✅ What This Does

- ✅ Your OpenAI API key is stored securely on Firebase servers
- ✅ Users **NEVER** see or have access to your API key
- ✅ All OCR processing happens server-side
- ✅ Users can't abuse your API key
- ✅ You control all costs

## 💰 Cost Tracking

Monitor your usage:
- [OpenAI Usage Dashboard](https://platform.openai.com/usage)
- Set up billing alerts if needed

Average cost: ~$0.01 per receipt using gpt-4o-mini

## 🔐 Security Benefits

**Before (INSECURE):**
- ❌ API key in browser localStorage
- ❌ Users could steal your key
- ❌ API calls from client-side
- ❌ No rate limiting

**After (SECURE):**
- ✅ API key in Firebase Secrets
- ✅ Only server has access
- ✅ API calls from Cloud Function
- ✅ Firebase handles security

## 🔄 Update API Key Later

If you need to change your key:

```bash
# Set new key
firebase functions:secrets:set OPENAI_API_KEY

# Redeploy
firebase deploy --only functions
```

## 🐛 Troubleshooting

**Receipt processing fails:**
```bash
# Check if secret is set
firebase functions:secrets:access OPENAI_API_KEY

# View function logs
firebase functions:log
```

**"Failed precondition" error:**
- API key not set or functions not deployed
- Run the setup commands above

---

## 🎉 You're All Set!

Your app now has enterprise-grade security for receipt processing!

Users can upload receipts without ever touching your OpenAI API key. 🔒

