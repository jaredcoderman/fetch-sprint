import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import csv from 'csv-parser';

// Firebase config (same as in your firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyBqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQ",
  authDomain: "receipt-sprint.firebaseapp.com",
  projectId: "receipt-sprint",
  storageBucket: "receipt-sprint.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnopqrstuv"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
        console.log(`Read ${universities.length} universities from CSV`);
        resolve(universities);
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);
        reject(error);
      });
  });
}

// Function to upload universities to Firestore
async function uploadUniversities() {
  try {
    // First, read all data from CSV
    const universities = await readCSVData();
    
    console.log('Starting upload to Firestore...');
    
    // Upload in batches of 500 (Firestore batch limit)
    const BATCH_SIZE = 500;
    let uploadedCount = 0;
    
    for (let i = 0; i < universities.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const batchUniversities = universities.slice(i, i + BATCH_SIZE);
      
      batchUniversities.forEach(university => {
        const docRef = collection(db, 'universities');
        batch.set(docRef, {
          ...university,
          createdAt: new Date().toISOString()
        });
      });
      
      await batch.commit();
      uploadedCount += batchUniversities.length;
      console.log(`Uploaded batch: ${uploadedCount}/${universities.length} universities`);
    }
    
    console.log(`Successfully uploaded ${uploadedCount} universities to Firestore`);
    console.log('Sample university data:');
    console.log(JSON.stringify(universities.slice(0, 3), null, 2));
    
  } catch (error) {
    console.error('Error uploading universities:', error);
    throw error;
  }
}

// Run the upload
uploadUniversities()
  .then(() => {
    console.log('Upload completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Upload failed:', error);
    process.exit(1);
  });
