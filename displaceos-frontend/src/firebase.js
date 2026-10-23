import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // <-- Login ke liye naya tool

const firebaseConfig = {
  apiKey: "AIzaSyAXKR133dmr96Gh8OmcPDpaywBKj6bkWfo",
  authDomain: "displaceos-186f3.firebaseapp.com",
  projectId: "displaceos-186f3",
  storageBucket: "displaceos-186f3.firebasestorage.app",
  messagingSenderId: "9115360773",
  appId: "1:9115360773:web:955d68766f142d4759866c",
  measurementId: "G-NLFDZDNMVM"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // <-- Login system chalu ho gaya