import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getAuth, connectAuthEmulator } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyD-J-BL09PK_DxIbjpERcN4y_EpPruhY0w",
  authDomain: "indonesia-firebase-playground.firebaseapp.com",
  projectId: "indonesia-firebase-playground",
  storageBucket: "indonesia-firebase-playground.appspot.com",
  messagingSenderId: "109641815905",
  appId: "1:109641815905:web:ed6d0d7fdd5ea479dbd720",
  measurementId: "G-Q5R35B65T2",
};

const initializeFirestore = (app) => {
  let firestore = getFirestore(app);
  if (isLocalhost()) {
    connectFirestoreEmulator(firestore, "localhost", 8000);
  }
  return firestore;
};

const initializeFirebaseStorage = (app) => {
  let firebaseStorage = getStorage(app);
  if (isLocalhost()) {
    connectStorageEmulator(firebaseStorage, "localhost", 9199);
  }
  return firebaseStorage;
};


const initializeAnalytics = (app) => {
  getAnalytics(app);
};

const initializeAuthentication = (app) => {
  const authentication = getAuth();
  if (isLocalhost()) {
    connectAuthEmulator(authentication, "http://localhost:9099")
  }
  return authentication;
}

const isLocalhost = () => {
  if (window.location.hostname.includes("localhost")) {
    return true;
  }
  return false;
};

const initialize = () => {
  const app = initializeApp(firebaseConfig);
  initializeAnalytics(app);
  const firestore = initializeFirestore(app);
  const firebaseStorage = initializeFirebaseStorage(app);
  const authentication = initializeAuthentication(app);
  return {
    firestore,
    authentication,
    firebaseStorage
  }
}

export default initialize();
