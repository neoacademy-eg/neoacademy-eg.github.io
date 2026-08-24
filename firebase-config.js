// Firebase project configuration for Neo Academy.
// This apiKey is safe to be public — Firebase security relies on
// Firestore Security Rules (see firestore.rules.txt), not on hiding this key.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC3eemkKv1-pXFx_MV72VZIpAZH0ibJsU4",
  authDomain: "neo-academy-lms.firebaseapp.com",
  projectId: "neo-academy-lms",
  storageBucket: "neo-academy-lms.firebasestorage.app",
  messagingSenderId: "301106045532",
  appId: "1:301106045532:web:900b3c11024d11eb397c99",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
