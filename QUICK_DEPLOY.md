# ⚡ Quick Deploy - 5 Minutes

The fastest way to get your Receipt Sprint app live!

## 🚀 Deploy to Firebase Hosting

### 1️⃣ Build the App
```bash
npm run build
```
✅ Creates production files in `dist/` folder

### 2️⃣ Login to Firebase
```bash
firebase login
```
✅ Opens browser → Sign in with Google

### 3️⃣ Deploy!
```bash
firebase deploy --only hosting
```
✅ Wait 30-60 seconds...

### 🎉 Done! Your app is live!

Your URL: **https://receipt-sprint.web.app**

---

## ⚠️ One More Thing!

Add your live domain to Firebase Auth:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click your project → **Authentication** → **Settings**
3. Scroll to **"Authorized domains"**
4. Click **"Add domain"**
5. Enter: `receipt-sprint.web.app`
6. Click **"Add"**

Now login will work on your live site! ✅

---

## 🔄 Update Your Site (Future)

Whenever you make changes:

```bash
npm run build
firebase deploy --only hosting
```

That's it! 30 seconds and your changes are live.

---

## 🐛 Troubleshooting

**"firebase: command not found"**
```bash
npm install -g firebase-tools
```

**"No project found"**
```bash
firebase use receipt-sprint
```

**Login issues (Google auth)**
- Make sure you added your domain to Firebase Auth (see above)

---

## 🎯 What's Next?

- ✅ Test your live app
- 📱 Share the URL with friends
- 🎨 Add a custom domain (optional)
- 📊 Check analytics in Firebase Console

Your app is live at: **https://receipt-sprint.web.app** 🚀

