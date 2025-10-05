# Firebase Setup Guide 🔥

Follow these steps to set up Firebase for the Receipt Sprint app.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Enter project name (e.g., "receipt-sprint")
4. (Optional) Enable Google Analytics
5. Click "Create project"

## Step 2: Register Your Web App

1. In Firebase Console, click the **Web icon** (`</>`) to add a web app
2. Enter app nickname: "Receipt Sprint Web"
3. Check "Also set up Firebase Hosting" (optional)
4. Click "Register app"
5. **Copy the Firebase configuration** - you'll need this!

## Step 3: Enable Authentication

1. In Firebase Console, go to **Authentication** → **Get started**
2. Click on **Sign-in method** tab
3. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle "Enable"
   - Click "Save"
4. Enable **Google**:
   - Click on "Google"
   - Toggle "Enable"
   - Select a support email
   - Click "Save"

## Step 4: Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database** → **Create database**
2. Select **Start in production mode**
3. Choose a location (select one closest to your users)
4. Click "Enable"
5. Go to **Rules** tab and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Competitions
    match /competitions/{competition} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Teams
    match /teams/{team} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    
    // Receipts
    match /receipts/{receipt} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

6. Click "Publish"

## Step 5: Set Up Cloud Storage

1. In Firebase Console, go to **Storage** → **Get started**
2. Click **Start in production mode**
3. Choose same location as Firestore
4. Click "Done"
5. Go to **Rules** tab and replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /receipts/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.resource.size < 5 * 1024 * 1024  // Max 5MB
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

6. Click "Publish"

## Step 6: Update Firebase Config in Code

1. Open `src/firebase.js` in your code editor
2. Replace the placeholder config with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

You can find these values in:
- Firebase Console → Project Settings → General → Your apps → SDK setup and configuration

## Step 7: Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:5173

3. Try to:
   - Sign up with email/password
   - Sign in with Google
   - Create a competition
   - Create a team
   - Upload a receipt (use a test image)

## Troubleshooting

### Authentication Issues
- **Error: "auth/operation-not-allowed"**
  - Make sure Email/Password and Google are enabled in Authentication → Sign-in method

### Firestore Issues
- **Error: "Missing or insufficient permissions"**
  - Check Firestore Rules are published
  - Verify user is authenticated

### Storage Issues
- **Error: "storage/unauthorized"**
  - Check Storage Rules are published
  - Ensure file is an image and under 5MB

### Config Issues
- **Error: "Firebase app not initialized"**
  - Verify firebase config in `src/firebase.js` is correct
  - Check all fields are filled in (no "YOUR_" placeholders)

## Optional: Set Up Firestore Indexes

If you experience slow queries, you may need to create indexes:

1. Go to Firestore → **Indexes**
2. Firebase will usually show you a link in the console error when an index is needed
3. Click the link to automatically create the required index

## Sample Data

To test the app, you can manually add a sample competition in Firestore:

1. Go to Firestore Database
2. Click "Start collection"
3. Collection ID: `competitions`
4. Add document with fields:
   ```
   name: "Test Competition"
   description: "A test competition for trying out the app"
   emoji: "🏆"
   endDate: "2025-12-31"
   teamCount: 0
   participantCount: 0
   status: "active"
   createdAt: [current timestamp]
   createdBy: "test"
   ```

## Production Checklist

Before deploying to production:

- [ ] Update Firestore Rules for production security
- [ ] Update Storage Rules for production security
- [ ] Set up proper user roles/permissions
- [ ] Enable Firebase App Check for bot protection
- [ ] Set up Firebase Analytics
- [ ] Configure Firebase Hosting
- [ ] Set up environment variables properly
- [ ] Enable Firebase Performance Monitoring

## Need Help?

- Firebase Docs: https://firebase.google.com/docs
- Firebase Support: https://firebase.google.com/support
- Stack Overflow: Tag your questions with `firebase`

---

🎉 Once setup is complete, you're ready to start using Receipt Sprint!

