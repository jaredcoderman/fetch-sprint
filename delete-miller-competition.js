const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteMillerCompetition() {
  try {
    console.log('Searching for Miller competitions at Suffolk University...');
    
    // Query for competitions with "Miller" in the name at Suffolk University
    const competitionsRef = db.collection('competitions');
    const snapshot = await competitionsRef
      .where('schoolName', '==', 'Suffolk University')
      .get();
    
    const millerCompetitions = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.name && data.name.toLowerCase().includes('miller')) {
        millerCompetitions.push({
          id: doc.id,
          name: data.name,
          createdAt: data.createdAt
        });
      }
    });
    
    console.log(`Found ${millerCompetitions.length} Miller competitions:`);
    millerCompetitions.forEach((comp, index) => {
      console.log(`${index + 1}. ${comp.name} (ID: ${comp.id}) - Created: ${comp.createdAt}`);
    });
    
    if (millerCompetitions.length === 0) {
      console.log('No Miller competitions found at Suffolk University.');
      return;
    }
    
    if (millerCompetitions.length === 1) {
      console.log('Only one Miller competition found. Deleting it...');
      await db.collection('competitions').doc(millerCompetitions[0].id).delete();
      console.log(`Deleted competition: ${millerCompetitions[0].name}`);
    } else {
      // Delete the first one (oldest or first in array)
      const toDelete = millerCompetitions[0];
      console.log(`Deleting the first Miller competition: ${toDelete.name}`);
      await db.collection('competitions').doc(toDelete.id).delete();
      console.log(`Successfully deleted competition: ${toDelete.name}`);
    }
    
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteMillerCompetition();
