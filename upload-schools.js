const admin = require('firebase-admin');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
// Option 1: Use service account key file (recommended for production)
// const serviceAccount = require('./serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: 'https://receipt-sprint-default-rtdb.firebaseio.com'
// });

// Option 2: Use Application Default Credentials (for local development)
admin.initializeApp({
  projectId: 'receipt-sprint'
});

const db = admin.firestore();

// Function to upload schools to Firestore
async function uploadSchools() {
  const schools = [];
  const batch = db.batch();
  let batchCount = 0;
  const BATCH_SIZE = 500; // Firestore batch limit

  return new Promise((resolve, reject) => {
    fs.createReadStream('Most-Recent-Cohorts-Institution_05192025.csv')
      .pipe(csv())
      .on('data', (row) => {
        // Extract only the required fields
        const schoolData = {
          unitId: row['﻿UNITID'] || row['UNITID'], // Handle BOM character
          name: row['INSTNM'] || '',
          city: row['CITY'] || '',
          state: row['STABBR'] || '',
          website: row['INSTURL'] || '',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Only add schools with valid names
        if (schoolData.name && schoolData.name.trim() !== '') {
          schools.push(schoolData);
          
          // Add to batch
          const docRef = db.collection('schools').doc();
          batch.set(docRef, schoolData);
          batchCount++;

          // Commit batch when it reaches the limit
          if (batchCount >= BATCH_SIZE) {
            batch.commit().then(() => {
              console.log(`Uploaded batch of ${batchCount} schools`);
            }).catch(error => {
              console.error('Error uploading batch:', error);
            });
            batchCount = 0;
          }
        }
      })
      .on('end', async () => {
        try {
          // Commit remaining schools
          if (batchCount > 0) {
            await batch.commit();
            console.log(`Uploaded final batch of ${batchCount} schools`);
          }
          
          console.log(`Successfully uploaded ${schools.length} schools to Firestore`);
          console.log('Sample school data:');
          console.log(JSON.stringify(schools.slice(0, 3), null, 2));
          resolve();
        } catch (error) {
          console.error('Error uploading final batch:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);
        reject(error);
      });
  });
}

// Run the upload
uploadSchools()
  .then(() => {
    console.log('Upload completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Upload failed:', error);
    process.exit(1);
  });
