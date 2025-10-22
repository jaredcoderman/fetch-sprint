const admin = require('firebase-admin');
const csv = require('csv-parser');
const fs = require('fs');

// Try to load service account key, fallback to application default credentials
let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
  console.log('✅ Service account key loaded successfully');
} catch (error) {
  console.log('⚠️  Service account key not found, using application default credentials');
  console.log('   For production, download serviceAccountKey.json from Firebase Console');
}

// Initialize Firebase Admin SDK
if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'receipt-sprint'
  });
} else {
  admin.initializeApp({
    projectId: 'receipt-sprint'
  });
}

const db = admin.firestore();

// Function to read CSV data
function readCSVData() {
  return new Promise((resolve, reject) => {
    const universities = [];
    
    fs.createReadStream('Most-Recent-Cohorts-Institution_05192025.csv')
      .pipe(csv())
      .on('data', (row) => {
        // Extract only the required fields
        const universityData = {
          unitId: row['﻿UNITID'] || row['UNITID'], // Handle BOM character
          name: row['INSTNM'] || '',
          city: row['CITY'] || '',
          state: row['STABBR'] || '',
          website: row['INSTURL'] || ''
        };

        // Only add universities with valid names
        if (universityData.name && universityData.name.trim() !== '') {
          universities.push(universityData);
        }
      })
      .on('end', () => {
        console.log(`📚 Read ${universities.length} universities from CSV`);
        resolve(universities);
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV file:', error);
        reject(error);
      });
  });
}

// Function to upload universities to Firestore in batches
async function uploadUniversities() {
  try {
    // First, read all data from CSV
    const universities = await readCSVData();
    
    const BATCH_SIZE = 500; // Firestore batch limit
    let uploadedCount = 0;
    
    console.log(`🚀 Starting upload of ${universities.length} universities to 'universities' collection...`);
    
    // Upload in batches
    for (let i = 0; i < universities.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const batchUniversities = universities.slice(i, i + BATCH_SIZE);
      
      batchUniversities.forEach(university => {
        const docRef = db.collection('universities').doc();
        batch.set(docRef, {
          ...university,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
      uploadedCount += batchUniversities.length;
      console.log(`📤 Uploaded batch: ${uploadedCount}/${universities.length} universities`);
    }
    
    console.log(`🎉 Successfully uploaded ${uploadedCount} universities to Firestore!`);
    console.log('📋 Sample university data:');
    console.log(JSON.stringify(universities.slice(0, 3), null, 2));
    
  } catch (error) {
    console.error('💥 Error uploading universities:', error);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 Permission denied error. This could be due to:');
      console.log('   1. Firestore security rules (Admin SDK should bypass these)');
      console.log('   2. Service account permissions');
      console.log('   3. Project configuration issues');
      console.log('\n🔧 Try running: node test-firebase-admin.cjs');
    }
    
    throw error;
  }
}

// Run the upload
uploadUniversities()
  .then(() => {
    console.log('✅ Upload completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Upload failed:', error.message);
    process.exit(1);
  });
