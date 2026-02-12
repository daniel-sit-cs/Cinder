// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // <--- Back to simple import
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


// Replace with the config from your Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAVNF4wUDBOsqpQ8cHV7tDY_wgl4Lm93z4",
  authDomain: "cinder-9012f.firebaseapp.com",
  projectId: "cinder-9012f",
  storageBucket: "cinder-9012f.firebasestorage.app",
  messagingSenderId: "360957931672",
  appId: "1:360957931672:web:5c2fd48c4dff3f8a7be0ed",
  measurementId: "G-0XXHQTX8HF"
};

const app = initializeApp(firebaseConfig);

// use getAuth() which is standard and crash-proof
export const auth = getAuth(app); 

export const db = getFirestore(app);
export const storage = getStorage(app);
