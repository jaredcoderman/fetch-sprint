# 🚀 Deployment Guide - Receipt Sprint

Complete guide to deploy your Receipt Sprint app to Firebase Hosting (or alternative platforms).

## Option 1: Firebase Hosting (Recommended) ⭐

Firebase Hosting is **free**, fast, and integrates perfectly with your Firebase backend.

### Step 1: Build Your App

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

### Step 2: Login to Firebase

```bash
firebase login
```

This will open a browser window - sign in with your Google account (the same one you used for Firebase Console).

### Step 3: Initialize Firebase Hosting (First Time Only)

```bash
firebase init hosting
```

When prompted:
- **Use an existing project** → Select `receipt-sprint`
- **What do you want to use as your public directory?** → Type `dist`
- **Configure as a single-page app?** → `Yes`
- **Set up automatic builds with GitHub?** → `No` (unless you want CI/CD)
- **Overwrite index.html?** → `No`

### Step 4: Deploy!

```bash
firebase deploy --only hosting
```

Wait for it to finish... and you're live! 🎉

Your app will be available at:
- **https://receipt-sprint.web.app**
- **https://receipt-sprint.firebaseapp.com**

### Step 5: Update Firebase Config (Important!)

After deployment, you need to add your hosting domain to Firebase Auth:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → Authentication → Settings
3. Scroll to "Authorized domains"
4. Add your hosting domain (e.g., `receipt-sprint.web.app`)
5. Click "Add domain"

Now authentication will work on your live site!

### Future Deployments

Whenever you make changes:

```bash
npm run build
firebase deploy --only hosting
```

That's it! Your updates are live in seconds.

---

## Option 2: Vercel (Alternative)

Vercel is also great for React apps and has excellent performance.

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Deploy

```bash
vercel
```

Follow the prompts:
- Set up and deploy? → `Yes`
- Scope? → Select your account
- Link to existing project? → `No`
- Project name? → `receipt-sprint`
- Directory? → `./`
- Override settings? → `No`

Done! Vercel will give you a live URL.

### Production Deployment

```bash
vercel --prod
```

### Important: Update Firebase Auth

Add your Vercel domain to Firebase authorized domains (same as Step 5 above).

---

## Option 3: Netlify (Alternative)

Another excellent free hosting option.

### Step 1: Build Your App

```bash
npm run build
```

### Step 2: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 3: Deploy

```bash
netlify deploy
```

Follow the prompts:
- Create & configure a new site? → `Yes`
- Team? → Select your team
- Site name? → `receipt-sprint`
- Publish directory? → `dist`

### Production Deployment

```bash
netlify deploy --prod
```

### Important: Update Firebase Auth

Add your Netlify domain to Firebase authorized domains.

---

## Post-Deployment Checklist ✅

After deploying to any platform:

### 1. Update Firebase Auth Domains
- Firebase Console → Authentication → Settings
- Add your live domain to "Authorized domains"

### 2. Test the App
- [ ] Sign up with email/password
- [ ] Sign in with Google
- [ ] Create a competition
- [ ] Join a team
- [ ] Upload a receipt (with OCR if configured)
- [ ] Check leaderboard

### 3. Update CORS Settings (if needed)

If you have issues with Firebase Storage, update CORS:

Create `cors.json`:
```json
[
  {
    "origin": ["https://your-domain.web.app"],
    "method": ["GET", "POST", "PUT"],
    "maxAgeSeconds": 3600
  }
]
```

Apply it:
```bash
gsutil cors set cors.json gs://receipt-sprint.appspot.com
```

### 4. Set Up Custom Domain (Optional)

**Firebase Hosting:**
```bash
firebase hosting:channel:deploy custom-domain
```

Follow instructions in Firebase Console → Hosting → Add custom domain

**Vercel/Netlify:**
- Go to project settings
- Add custom domain
- Update DNS records

---

## Environment Variables 🔐

For production, you should use environment variables instead of hardcoding values.

### Create `.env.production`

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=receipt-sprint.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=receipt-sprint
VITE_FIREBASE_STORAGE_BUCKET=receipt-sprint.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=358446206895
VITE_FIREBASE_APP_ID=your_app_id
```

### Update `src/firebase.js`

```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

---

## Continuous Deployment (Advanced) 🔄

### GitHub Actions + Firebase

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: receipt-sprint
```

Now every push to main automatically deploys!

---

## Monitoring & Analytics 📊

### Enable Firebase Analytics

Already set up in your code! View analytics in Firebase Console → Analytics.

### Performance Monitoring

Add to `src/firebase.js`:
```javascript
import { getPerformance } from 'firebase/performance';
const perf = getPerformance(app);
```

---

## Troubleshooting 🔧

### "Module not found" errors
```bash
npm install
npm run build
```

### Authentication fails on live site
- Check Firebase Console → Authorized domains
- Make sure your domain is added

### Storage upload fails
- Check Storage CORS settings
- Verify Storage rules are set correctly

### OCR not working
- OpenAI API key should be configured by users in Settings
- Check browser console for errors

### Build is too large
- Images are optimized automatically by Vite
- Consider lazy loading routes if needed

---

## Performance Tips 🚀

1. **Enable compression** (Firebase Hosting does this automatically)
2. **Use a CDN** (Firebase Hosting uses Google's CDN)
3. **Lazy load routes**:
   ```javascript
   const TeamDashboard = lazy(() => import('./pages/TeamDashboard'));
   ```
4. **Optimize images** before uploading receipts
5. **Enable caching** (already configured in firebase.json)

---

## Cost Estimates 💰

### Firebase Hosting (Free Tier)
- 10 GB storage
- 360 MB/day bandwidth
- Enough for ~1000-5000 users/month

### Firebase Firestore (Free Tier)
- 50K reads/day
- 20K writes/day
- 1 GB storage

### Firebase Storage (Free Tier)
- 5 GB storage
- 1 GB/day downloads

### OpenAI API (Pay as you go)
- ~$0.01 per receipt processed
- $10 = ~1000 receipts

Most apps stay within free tier limits!

---

## Next Steps 🎯

After deployment:

1. ✅ Share your live URL with users
2. 📱 Test on mobile devices
3. 🔒 Review security rules
4. 📊 Monitor usage in Firebase Console
5. 🎨 Consider adding a custom domain
6. 📧 Set up email verification (optional)
7. 🔔 Add push notifications (optional)

---

## Support Resources 📚

- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Firebase Console](https://console.firebase.google.com/)

---

**Your app is ready for the world!** 🎉

Questions? Check the console logs or Firebase documentation.

