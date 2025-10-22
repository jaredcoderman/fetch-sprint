import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../src/firebase.js';

async function run() {
  const compsSnap = await getDocs(query(
    collection(db, 'competitions'),
    where('name', '==', 'West'),
    where('schoolName', '==', 'Suffolk University')
  ));
  if (compsSnap.empty) { console.log('No West competition found'); return; }
  const compDoc = compsSnap.docs[0];
  const comp = { id: compDoc.id, ...compDoc.data() };

  const teamsSnap = await getDocs(query(collection(db, 'teams'), where('competitionId', '==', comp.id)));
  const targets = teamsSnap.docs.filter(d => ((d.data().name||'').toLowerCase() === '10th floor' || (d.data().name||'').toLowerCase() === 'floor 10' || (d.data().name||'').toLowerCase() === '10 floor'));
  if (targets.length === 0) { console.log('No team named 10th floor found'); return; }

  for (const d of targets) {
    const team = { id: d.id, ...d.data() };
    const membersCount = Array.isArray(team.members) ? team.members.length : 0;
    await deleteDoc(doc(db, 'teams', team.id));
    console.log('Deleted team:', team.name, team.id);
    await updateDoc(doc(db, 'competitions', comp.id), {
      teamCount: Math.max(0, (comp.teamCount || 0) - 1),
      participantCount: Math.max(0, (comp.participantCount || 0) - membersCount),
    });
    console.log('Updated competition counts');
  }
}

run().catch(err => { console.error(err); process.exit(1); });
