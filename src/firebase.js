import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Firebase configuration — client-side keys are public-safe
const firebaseConfig = {
  apiKey: "AIzaSyAV1iKL77dpdgrmGsopWJS4LkPVB0f-qK0",
  authDomain: "techgram-7c8a6.firebaseapp.com",
  projectId: "techgram-7c8a6",
  storageBucket: "techgram-7c8a6.firebasestorage.app",
  messagingSenderId: "5228296079",
  appId: "1:5228296079:web:dcb4caf1162e2104d018a0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;
