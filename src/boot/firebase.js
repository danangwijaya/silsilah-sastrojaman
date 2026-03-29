import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// ============ Firebase Configuration ============
// Menggunakan konfigurasi yang sama dari aplikasi sebelumnya
const firebaseConfig = {
    apiKey: "API KEY",
    authDomain: "silsilah-sastrojaman.firebaseapp.com",
    projectId: "silsilah-sastrojaman",
    storageBucket: "silsilah-sastrojaman.firebasestorage.app",
    messagingSenderId: "YOUR ID",
    appId: "YOUR ID",
    measurementId: "G-XXXXXX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage, app };
