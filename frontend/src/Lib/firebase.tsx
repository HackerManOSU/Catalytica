// Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "input secret here or whatever the name is",
  authDomain: "catalytica-b8ad9.firebaseapp.com",
  projectId: "catalytica-b8ad9",
  storageBucket: "catalytica-b8ad9.firebasestorage.app",
  messagingSenderId: "891546386409",
  appId: "1:891546386409:web:1af68f77fb0596a6511578",
  measurementId: "G-Q2DB40DMKE",
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { app, analytics, db, auth, provider };

