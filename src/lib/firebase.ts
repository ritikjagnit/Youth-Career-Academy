import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

// Using the configuration provided
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCU_LdIGi8MljDL9osL1UYvuWDYXQn7sJM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "myotpapp-a3c15.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "myotpapp-a3c15",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "myotpapp-a3c15.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "597260807485",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:597260807485:web:5bc419e4962afd9e106954",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-D6PH10JYHG"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
auth.languageCode = "en";

// Persist session for /phone-login; registration signs out after verify
void setPersistence(auth, browserLocalPersistence);

// Dev only: use with Firebase Console → Phone → test phone numbers
if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_TEST_MODE === "true") {
  auth.settings.appVerificationDisabledForTesting = true;
}

