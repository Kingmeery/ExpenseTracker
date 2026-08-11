import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

// config from the Firebase console (Project settings > your web app)
const firebaseConfig = {
  apiKey: "AIzaSyDZ0S5cjgQbD295dpWHoulEEOtZmDHi8cc",
  authDomain: "expense-tracker-ad54d.firebaseapp.com",
  projectId: "expense-tracker-ad54d",
  storageBucket: "expense-tracker-ad54d.firebasestorage.app",
  messagingSenderId: "400896468177",
  appId: "1:400896468177:web:ce2ed0a9e004a6932311f0"
};

const app = initializeApp(firebaseConfig);

// other files import these instead of setting up their own connection
export const auth = getAuth(app);
export const db = getFirestore(app);