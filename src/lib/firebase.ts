/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'dummy-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'agentblazer-db.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'agentblazer-db',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'agentblazer-db.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '365130306828',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:365130306828:web:c9b8e9755b67d81ee92529',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
// Force account selection screen so users can pick their sjec.ac.in email
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
