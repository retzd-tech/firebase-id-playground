import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD6W-8tFlIFqYDaGkW2MNixQ9DacKdV8Cg",
  authDomain: "gdg-jakarta-community.firebaseapp.com",
  projectId: "gdg-jakarta-community",
  storageBucket: "gdg-jakarta-community.appspot.com",
  messagingSenderId: "665303790450",
  appId: "1:665303790450:web:2c9868560d8543b17623eb",
  measurementId: "G-EJ7N8ET7RX",
};

const initializeFirestore = () => {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

  // Initialize Cloud Firestore and get a reference to the service
  return getFirestore(app);
};

const initilizedFirebase = {
  initializeFirestore
}

export default initilizedFirebase;
