import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

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
    console.log('Searching for "Off-Campus" competition...');
    
    // Find the "Off-Campus" competition at Suffolk University
    const compsSnap = await getDocs(query(
      collection(db, 'competitions'),
      where('name', '==', 'Off-Campus'),
      where('schoolName', '==', 'Suffolk University')
    ));

    if (compsSnap.empty) {
      console.log('No "Off-Campus" competition found');
      return;
    }

    const compDoc = compsSnap.docs[0];
    const comp = { id: compDoc.id, ...compDoc.data() };
    console.log('Found competition:', comp.id, comp.name, 'at', comp.schoolName);

    // Get teams for this competition
    const teamsSnap = await getDocs(query(collection(db, 'teams'), where('competitionId', '==', comp.id)));
    const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    console.log(`Found ${teams.length} teams in the competition:`);
    teams.forEach((team, index) => {
      console.log(`${index + 1}. ${team.name} (ID: ${team.id}) - Members: ${team.memberEmails?.length || 0}`);
    });

    // Delete all teams in this competition
    for (const team of teams) {
      const membersCount = Array.isArray(team.memberEmails) ? team.memberEmails.length : 0;
      await deleteDoc(doc(db, 'teams', team.id));
      console.log('Deleted team:', team.name, `(ID: ${team.id})`);
    }

    // Delete the competition itself
    await deleteDoc(doc(db, 'competitions', comp.id));
    console.log('Deleted competition:', comp.name, `(ID: ${comp.id})`);

    // Update school's competition count
    const schoolsQuery = query(
      collection(db, 'schools'),
      where('name', '==', comp.schoolName)
    );
    const schoolsSnapshot = await getDocs(schoolsQuery);
    if (!schoolsSnapshot.empty) {
      const schoolDoc = schoolsSnapshot.docs[0];
      const currentCount = schoolDoc.data().competitionCount || 0;
      await updateDoc(doc(db, 'schools', schoolDoc.id), {
        competitionCount: Math.max(0, currentCount - 1)
      });
      console.log(`Updated school competition count for ${comp.schoolName}`);
    }

    console.log('Successfully deleted "Off-Campus" competition and all associated teams!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

run().catch(err => { console.error(err); process.exit(1); });
