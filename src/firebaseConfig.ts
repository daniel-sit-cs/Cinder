// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

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
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
const analytics = getAnalytics(app);