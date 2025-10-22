const admin = require('firebase-admin');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK with service account
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'receipt-sprint'
});

const db = admin.firestore();

// Function to read CSV data
function readCSVData() {
  return new Promise((resolve, reject) => {
    const schools = [];
    
    fs.createReadStream('Most-Recent-Cohorts-Institution_05192025.csv')
      .pipe(csv())
      .on('data', (row) => {
        // Extract only the required fields
        const schoolData = {
          unitId: row['﻿UNITID'] || row['UNITID'], // Handle BOM character
          name: row['INSTNM'] || '',
          city: row['CITY'] || '',
          state: row['STABBR'] || '',
          website: row['INSTURL'] || ''
        };

        // Only add schools with valid names
        if (schoolData.name && schoolData.name.trim() !== '') {
          schools.push(schoolData);
        }
      })
      .on('end', () => {
        console.log(`Read ${schools.length} schools from CSV`);
        resolve(schools);
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);
        reject(error);
      });
  });
}

// Function to upload schools to Firestore in batches
async function uploadSchools() {
  try {
    // First, read all data from CSV
    const schools = await readCSVData();
    
    const BATCH_SIZE = 500; // Firestore batch limit
    let uploadedCount = 0;
    
    // Upload in batches
    for (let i = 0; i < schools.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const batchSchools = schools.slice(i, i + BATCH_SIZE);
      
      batchSchools.forEach(school => {
        const docRef = db.collection('universities').doc();
        batch.set(docRef, {
          ...school,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
      uploadedCount += batchSchools.length;
      console.log(`Uploaded batch: ${uploadedCount}/${schools.length} schools`);
    }
    
    console.log(`Successfully uploaded ${uploadedCount} schools to Firestore`);
    console.log('Sample school data:');
    console.log(JSON.stringify(schools.slice(0, 3), null, 2));
    
  } catch (error) {
    console.error('Error uploading schools:', error);
    throw error;
  }
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
