const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, limit, orderBy } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAerliEUGtJ4aKPWQvJma4NIbJWxensu1M",
  authDomain: "receipt-sprint.firebaseapp.com",
  projectId: "receipt-sprint",
  storageBucket: "receipt-sprint.firebasestorage.app",
  messagingSenderId: "358446206895",
  appId: "1:358446206895:web:458164f20bfcd61a59295a",
  measurementId: "G-DF5P72EFFY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test university search function
async function testUniversitySearch(searchTerm) {
  console.log(`🔍 Searching for: "${searchTerm}"`);
  
  try {
    // Try exact match first
    const exactQuery = query(
      collection(db, 'universities'),
      where('name', '==', searchTerm),
      limit(1)
    );
    
    const exactSnapshot = await getDocs(exactQuery);
    
    if (!exactSnapshot.empty) {
      const university = exactSnapshot.docs[0].data();
      console.log('✅ Exact match found:');
      console.log(`   Name: ${university.name}`);
      console.log(`   City: ${university.city}`);
      console.log(`   State: ${university.state}`);
      console.log(`   Website: ${university.website}`);
      return university;
    }
    
    // Try partial match
    console.log('🔍 No exact match, trying partial search...');
    const allQuery = query(
      collection(db, 'universities'),
      orderBy('name'),
      limit(100)
    );
    
    const allSnapshot = await getDocs(allQuery);
    const searchLower = searchTerm.toLowerCase();
    
    const matches = [];
    for (const doc of allSnapshot.docs) {
      const university = doc.data();
      if (university.name && university.name.toLowerCase().includes(searchLower)) {
        matches.push(university);
      }
    }
    
    if (matches.length > 0) {
      console.log(`✅ Found ${matches.length} partial matches:`);
      matches.slice(0, 5).forEach((uni, index) => {
        console.log(`   ${index + 1}. ${uni.name} (${uni.city}, ${uni.state})`);
      });
      return matches[0];
    } else {
      console.log('❌ No matches found');
      return null;
    }
    
  } catch (error) {
    console.error('💥 Error searching universities:', error.message);
    return null;
  }
}

// Test with some common university names
async function runTests() {
  console.log('🧪 Testing University Search Functionality\n');
  
  const testCases = [
    'Harvard University',
    'Stanford University', 
    'MIT',
    'University of California',
    'Yale',
    'Princeton',
    'Columbia University',
    'University of Michigan',
    'Ohio State University',
    'University of Texas'
  ];
  
  for (const testCase of testCases) {
    await testUniversitySearch(testCase);
    console.log(''); // Empty line for readability
  }
  
  console.log('✅ All tests completed!');
  process.exit(0);
}

runTests().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
