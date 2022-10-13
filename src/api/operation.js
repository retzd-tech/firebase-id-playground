import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL
} from "firebase/storage";

import initilizedFirebase from "./../api/init";

const collections = {
  MEMBERS: "members",
};

const { initializeFirestore } = initilizedFirebase;
let firestore;

initializeFirestore().then((initializedFirestore) => {
  firestore = initializedFirestore;
});

const addMember = async (data) => {
  try {
    const membersCollection = collection(firestore, collections.MEMBERS);
    await addDoc(membersCollection, data);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

const getMembersListRealtime = async (setMembers) => {
  try {
    const membersCollection = collection(firestore, collections.MEMBERS);
    const queriedMembersCollection = query(
      membersCollection,
      orderBy("fullname"),
      limit(100)
    );
    onSnapshot(queriedMembersCollection, (snapshots) => {
      const members = [];
      snapshots.forEach((snapshots) => {
        const member = {
          id: snapshots.id,
          ...snapshots.data(),
        };
        members.push(member);
      });
      setMembers(members);
    });
  } catch (e) {
    console.error("Error getting documents: ", e);
  }
};

const getMembersListOnce = async (instance) => {
  try {
    const members = [];
    const membersCollection = collection(instance, collections.MEMBERS);
    const response = await getDocs(membersCollection);
    response.forEach((snapshots) => {
      const member = {
        id: snapshots.id,
        ...snapshots.data(),
      };
      members.push(member);
    });

    return members;
  } catch (e) {
    console.error("Error getting documents: ", e);
  }
};

const uploadImage = (file) => {
  const storage = getStorage();
  const fileUpload = file.target.files[0];
  const storageRef = ref(storage, "images/" + fileUpload.name);

  try {
    uploadBytes(storageRef, file).then((snapshot) => {
      console.log("Uploaded a blob or file!");
    });
  } catch (error) {
    console.log("Upload error");
  }
};

const uploadImageResumeable = async (file) => {
  const storage = getStorage();
  const metadata = {
    contentType: "image/jpeg",
  };
  const fileUpload = file.target.files[0];
  const storageRef = ref(storage, "images/" + fileUpload.name);
  const uploadTask = uploadBytesResumable(storageRef, fileUpload, metadata);
  uploadTask.on(
    "state_changed",
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log("Upload is " + progress + "% done");
      switch (snapshot.state) {
        case "paused":
          console.log("Upload is paused");
          break;
        case "running":
          console.log("Upload is running");
          break;
        default:
      }
    },
    (error) => {
      switch (error.code) {
        case "storage/unauthorized":
          break;
        case "storage/canceled":
          break;
        case "storage/unknown":
          break;
        default:
      }
    },
    () => {
      getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
        console.log("File available at", downloadURL);
      });
    }
  );
};

const operation = {
  addMember,
  getMembersListOnce,
  getMembersListRealtime,
  uploadImage,
  uploadImageResumeable
};

export default operation;
