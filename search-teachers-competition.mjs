import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAerliEUGtJ4aKPWQvJma4NIbJWxensu1M",
  authDomain: "receipt-sprint.firebaseapp.com",
  projectId: "receipt-sprint",
  storageBucket: "receipt-sprint.firebasestorage.app",
  messagingSenderId: "358446206895",
  appId: "1:358446206895:web:458164f20bfcd61a59295a",
  measurementId: "G-DF5P72EFFY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    console.log('Searching for all competitions...');
    
    // Get all competitions
    const compsSnap = await getDocs(collection(db, 'competitions'));
    const competitions = compsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    console.log(`Found ${competitions.length} total competitions:`);
    competitions.forEach((comp, index) => {
      console.log(`${index + 1}. "${comp.name}" at ${comp.schoolName} (ID: ${comp.id})`);
    });

    // Look for competitions with "teacher" in the name (case-insensitive)
    const teacherComps = competitions.filter(comp => 
      comp.name && comp.name.toLowerCase().includes('teacher')
    );
    
    if (teacherComps.length > 0) {
      console.log(`\nFound ${teacherComps.length} competition(s) with "teacher" in the name:`);
      teacherComps.forEach((comp, index) => {
        console.log(`${index + 1}. "${comp.name}" at ${comp.schoolName} (ID: ${comp.id})`);
      });
    } else {
      console.log('\nNo competitions found with "teacher" in the name.');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

run().catch(err => { console.error(err); process.exit(1); });
