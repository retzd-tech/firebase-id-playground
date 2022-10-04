import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD-J-BL09PK_DxIbjpERcN4y_EpPruhY0w",
  authDomain: "indonesia-firebase-playground.firebaseapp.com",
  projectId: "indonesia-firebase-playground",
  storageBucket: "indonesia-firebase-playground.appspot.com",
  messagingSenderId: "109641815905",
  appId: "1:109641815905:web:ed6d0d7fdd5ea479dbd720",
  measurementId: "G-Q5R35B65T2"
};

const initializeFirestore = async () => {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  initializeAnalytics(app)

  // Initialize Cloud Firestore and get a reference to the service
  let firestore = getFirestore(app);
  
  console.log('Is localhost', checkIfLocalhost());
  // if (checkIfLocalhost()) {
  connectFirestoreEmulator(firestore, 'localhost', 8000);
  // }

  return firestore;
};

const initializeAnalytics = (app) => {
  getAnalytics(app);
}

const initilizedFirebase = {
  initializeFirestore
}

const checkIfLocalhost = () => {
  if (window.location.hostname.includes('localhost')) {
    return true;
  }
  return false;
}

export default initilizedFirebase;
