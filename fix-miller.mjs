import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: AIzaSyAerliEUGtJ4aKPWQvJma4NIbJWxensu1M,
  authDomain: receipt-sprint.firebaseapp.com,
  projectId: receipt-sprint,
  storageBucket: receipt-sprint.firebasestorage.app,
  messagingSenderId: 358446206895,
  appId: 1:358446206895:web:458164f20bfcd61a59295a,
  measurementId: G-DF5P72EFFY
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const compsSnap = await getDocs(query(collection(db, 'competitions'), where('name', '==', 'Miller'), where('schoolName', '==', 'Suffolk University')));
  for (const c of compsSnap.docs) {
    const comp = { id: c.id, ...c.data() };
    const goal = comp.goal || 50000;
    const now = new Date();
    const endPassed = comp.endDate ? new Date(comp.endDate) <= now : false;

    // If not at goal and end date not passed, revert to active and clear winner fields
    if ((comp.winnerPoints || 0) < goal && !endPassed) {
      await updateDoc(doc(db, 'competitions', comp.id), {
        status: 'active',
        winnerTeamId: null,
        winnerTeamName: null,
        winnerPoints: 0,
        isTied: false,
        tiedTeamIds: [],
        tiedTeamNames: [],
      });
      console.log('Reverted to active:', comp.id, comp.name);
    } else {
      console.log('No change needed for:', comp.id, comp.name);
    }
  }
}

run().catch(err => { console.error(err); process.exit(1); });
