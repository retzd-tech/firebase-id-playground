import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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

const initializeFirestore = () => {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  initializeAnalytics(app)

  // Initialize Cloud Firestore and get a reference to the service
  return getFirestore(app);
};

const initializeAnalytics = (app) => {
  getAnalytics(app);
}

const initilizedFirebase = {
  initializeFirestore
}

export default initilizedFirebase;
