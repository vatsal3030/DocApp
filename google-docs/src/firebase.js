import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyCiegy0ZSnVrwTISASLTMn6dvPUi8xkR0A",
  authDomain: "docs-8ad27.firebaseapp.com",
  projectId: "docs-8ad27",
  storageBucket: "docs-8ad27.firebasestorage.app",
  messagingSenderId: "30363209100",
  appId: "1:30363209100:web:45faa2fa42228003d25aa9",
  measurementId: "G-DQLK1V826Z"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);