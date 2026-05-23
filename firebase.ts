
// firebase.ts — Phase 2: Google OAuth support
// Replace the placeholder values below with your Firebase project config.
// Go to: Firebase Console → Project Settings → General → Your Apps → Web App → Config

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBbNkMjPCgKNyzNKoRGUd5sO5_bVdgZ19s",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gyansetu-cd964.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gyansetu-cd964",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:801865642200:web:ab07450e6ddb53ede0e7ad",
};

// Only initialize if config is available
const isConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

const firebaseApp = isConfigured ? initializeApp(firebaseConfig) : null;

export const auth = isConfigured ? getAuth(firebaseApp!) : null;
export const googleProvider = isConfigured ? new GoogleAuthProvider() : null;
export const FIREBASE_CONFIGURED = isConfigured;
