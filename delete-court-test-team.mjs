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
    console.log('Searching for Court competition at Suffolk University...');
    
    // Find Court competition at Suffolk University
    const compsSnap = await getDocs(query(
      collection(db, 'competitions'),
      where('name', '==', 'Court'),
      where('schoolName', '==', 'Suffolk University')
    ));

    if (compsSnap.empty) {
      console.log('No Court competition found for Suffolk University');
      return;
    }

    const compDoc = compsSnap.docs[0];
    const comp = { id: compDoc.id, ...compDoc.data() };
    console.log('Found competition:', comp.id, comp.name);

    // Get teams for this competition
    const teamsSnap = await getDocs(query(collection(db, 'teams'), where('competitionId', '==', comp.id)));
    const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    console.log(`Found ${teams.length} teams in the competition:`);
    teams.forEach((team, index) => {
      console.log(`${index + 1}. ${team.name} (ID: ${team.id}) - Members: ${team.memberEmails?.length || 0}`);
    });

    // Find test team (case-insensitive)
    const testTeams = teams.filter(t => 
      (t.name || '').toLowerCase().includes('test') || 
      (t.name || '').toLowerCase() === 'test team'
    );
    
    if (testTeams.length === 0) {
      console.log('No test team found in Court competition');
      return;
    }

    console.log(`Found ${testTeams.length} test team(s) to delete:`);
    testTeams.forEach(team => {
      console.log(`- ${team.name} (ID: ${team.id})`);
    });

    // Delete each test team
    for (const team of testTeams) {
      const membersCount = Array.isArray(team.memberEmails) ? team.memberEmails.length : 0;
      
      await deleteDoc(doc(db, 'teams', team.id));
      console.log(`Deleted team: ${team.name} (ID: ${team.id})`);
      
      // Update competition counts
      await updateDoc(doc(db, 'competitions', comp.id), {
        teamCount: Math.max(0, (comp.teamCount || 0) - 1),
        participantCount: Math.max(0, (comp.participantCount || 0) - membersCount),
      });
      console.log(`Updated competition counts - removed 1 team and ${membersCount} participants`);
    }

    console.log('Successfully deleted test team(s) from Court competition!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

run().catch(err => { 
  console.error(err); 
  process.exit(1); 
});
