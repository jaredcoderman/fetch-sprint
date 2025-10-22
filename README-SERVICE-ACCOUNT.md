# Firebase Service Account Setup

## 🔑 Get Your Service Account Key

### Method 1: Firebase Console (Recommended)

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: "receipt sprint" (receipt-sprint)
3. **Go to Project Settings**: Click the gear icon ⚙️ → Project Settings
4. **Service Accounts tab**: Click on "Service accounts" tab
5. **Generate new private key**: Click "Generate new private key"
6. **Download the JSON file**: Save it as `serviceAccountKey.json` in this folder

### Method 2: Google Cloud Console

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select project**: "receipt-sprint"
3. **Go to IAM & Admin**: IAM & Admin → Service Accounts
4. **Find Firebase service account**: Look for `firebase-adminsdk-xxxxx@receipt-sprint.iam.gserviceaccount.com`
5. **Create key**: Click on the service account → Keys tab → Add Key → Create new key → JSON
6. **Download**: Save as `serviceAccountKey.json`

## 🚀 Run the Upload Script

Once you have `serviceAccountKey.json`:

```bash
node upload-universities.cjs
```

## 🧪 Test Connection First

```bash
node test-firebase-admin.cjs
```

## 📋 What the Script Does

- Reads `Most-Recent-Cohorts-Institution_05192025.csv`
- Extracts: `UNITID`, `INSTNM`, `CITY`, `STABBR`, `INSTURL`
- Uploads to Firestore `universities` collection
- Uses Firebase Admin SDK (bypasses security rules)
- Processes in batches of 500 documents

## 🔧 Troubleshooting

### Permission Denied
- Ensure service account has "Cloud Datastore User" role
- Check that the JSON file is valid
- Verify project ID matches

### File Not Found
- Make sure `serviceAccountKey.json` is in the project root
- Check that `Most-Recent-Cohorts-Institution_05192025.csv` exists

### CSV Issues
- Ensure CSV has proper headers: UNITID, INSTNM, CITY, STABBR, INSTURL
- Check for BOM characters in the first column
