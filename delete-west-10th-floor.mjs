import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

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
  // Find West competition at Suffolk University
  const compsSnap = await getDocs(query(
    collection(db, 'competitions'),
    where('name', '==', 'West'),
    where('schoolName', '==', 'Suffolk University')
  ));

  if (compsSnap.empty) {
    console.log('No West competition found for Suffolk University');
    return;
  }

  const compDoc = compsSnap.docs[0];
  const comp = { id: compDoc.id, ...compDoc.data() };
  console.log('Found competition:', comp.id, comp.name);

  // Get teams for this competition
  const teamsSnap = await getDocs(query(collection(db, 'teams'), where('competitionId', '==', comp.id)));
  const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Find 10th floor team (case-insensitive)
  const targetTeams = teams.filter(t => (t.name || '').toLowerCase() === '10th floor');
  if (targetTeams.length === 0) {
    console.log('No team named 10th
