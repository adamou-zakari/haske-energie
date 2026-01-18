import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// VA SUR https://console.firebase.google.com
// Projet haske-energie → ⚙️ → Paramètres → Vos applications → Web
// COPIE TES VRAIES VALEURS ICI
const firebaseConfig = {
  apiKey: "AIzaSyBGRy-nx-QJgGGUUtFwMtnxfymXs_TDAmE",
  authDomain: "haske-energie.firebaseapp.com",
  projectId: "haske-energie",
  storageBucket: "haske-energie.firebasestorage.app",
  messagingSenderId: "933925941848",
  appId: "1:933925941848:web:14dcb5ee48f32f0a1a502d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };