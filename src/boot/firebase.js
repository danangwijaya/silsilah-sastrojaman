import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// ============ Firebase Configuration ============
// Menggunakan konfigurasi yang sama dari aplikasi sebelumnya
const firebaseConfig = {
    apiKey: "AIzaSyAwPL-ew_YDoevL0HUxEH3TTKFY_lbw0uk",
    authDomain: "silsilah-sastrojaman.firebaseapp.com",
    projectId: "silsilah-sastrojaman",
    storageBucket: "silsilah-sastrojaman.firebasestorage.app",
    messagingSenderId: "975582815892",
    appId: "1:975582815892:web:94c36fe1e260c302f4b681",
    measurementId: "G-N8XGHVNSKQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage, app };
