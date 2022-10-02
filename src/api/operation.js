import { collection, addDoc, getDocs, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import initilizedFirebase from "./../api/init";

const collections = {
  MEMBERS: "members",
};

const { initializeFirestore } = initilizedFirebase;

const firestore = initializeFirestore();

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
    const queriedMembersCollection = query(membersCollection, orderBy("fullname"), limit(100));
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

const operation = {
  addMember,
  getMembersListOnce,
  getMembersListRealtime,
};

export default operation;
