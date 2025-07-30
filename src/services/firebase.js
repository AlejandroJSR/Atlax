import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAjtW89rfWuUVJ1KPDDewACp6gxzV0sMfQ",
  authDomain: "atlax-5c7f6.firebaseapp.com",
  projectId: "atlax-5c7f6",
  storageBucket: "atlax-5c7f6.appspot.com",
  messagingSenderId: "304736001186",
  appId: "1:304736001186:web:b62f0662d1521fc42ccbfb",
  measurementId: "G-VPZPT5D0H0",
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
// Habilitar persistencia local
enableIndexedDbPersistence(db).catch((err) =>
  console.error("Error habilitando cache local", err)
);

const auth = getAuth(app);

export { db, auth };
