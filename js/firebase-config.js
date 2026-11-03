import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCH31xtXWX5CZCo7MXtYJA7I5WobR27bq4",
  authDomain: "didge-sports-stock-pro.firebaseapp.com",
  projectId: "didge-sports-stock-pro",
  storageBucket: "didge-sports-stock-pro.firebasestorage.app",
  messagingSenderId: "885321630657",
  appId: "1:885321630657:web:aa0b0dd6bb9a19360aa540",
  measurementId: "G-76F4P33W12"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  }, "didge");
} catch (error) {
  db = getFirestore(app, "didge");
}

export { app, auth, db, firebaseConfig };