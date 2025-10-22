const admin = require('firebase-admin');

// Try to load service account key, fallback to application default credentials
let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
  console.log('✅ Service account key loaded successfully');
} catch (error) {
  console.log('⚠️  Service account key not found, using application default credentials');
  console.log('   To get service account key:');
  console.log('   1. Go to https://console.firebase.google.com/');
  console.log('   2. Select project "receipt-sprint"');
  console.log('   3. Go to Project Settings → Service Accounts');
  console.log('   4. Click "Generate new private key"');
  console.log('   5. Save as serviceAccountKey.json in this folder');
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

// Test connection
async function testConnection() {
  try {
    console.log('🔄 Testing Firestore connection...');
    
    // Try to read from a collection
    const testRef = db.collection('universities').limit(1);
    const snapshot = await testRef.get();
    
    console.log('✅ Firestore connection successful!');
    console.log(`📊 Found ${snapshot.size} documents in universities collection`);
    
    // Try to write a test document
    console.log('🔄 Testing write permissions...');
    const testDoc = db.collection('universities').doc('test-doc');
    await testDoc.set({
      test: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Write permissions confirmed!');
    
    // Clean up test document
    await testDoc.delete();
    console.log('🧹 Test document cleaned up');
    
  } catch (error) {
    console.error('❌ Error testing Firestore:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 This is likely due to Firestore security rules.');
      console.log('   The Admin SDK should bypass these rules, but you may need to:');
      console.log('   1. Check your service account permissions');
      console.log('   2. Ensure the service account has "Cloud Datastore User" role');
      console.log('   3. Try using Application Default Credentials');
    }
  }
}

testConnection()
  .then(() => {
    console.log('\n🎉 Firebase Admin SDK test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
