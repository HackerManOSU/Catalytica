import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
initializeApp({
  credential: applicationDefault()
});

// Get Firestore instance
export const db: Firestore = getFirestore();  // Ensure the type is Firestore
