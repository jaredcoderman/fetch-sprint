import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Your web app's Firebase configuration
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

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app;
