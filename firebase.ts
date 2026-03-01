
// firebase.ts — Phase 2: Google OAuth support
// Replace the placeholder values below with your Firebase project config.
// Go to: Firebase Console → Project Settings → General → Your Apps → Web App → Config

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Only initialize if config is available
const isConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

const firebaseApp = isConfigured ? initializeApp(firebaseConfig) : null;

export const auth = isConfigured ? getAuth(firebaseApp!) : null;
export const googleProvider = isConfigured ? new GoogleAuthProvider() : null;
export const FIREBASE_CONFIGURED = isConfigured;
