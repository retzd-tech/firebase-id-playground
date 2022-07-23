import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

const collections = {
  MEMBERS: "members",
};

const addMember = async (data, instance) => {
  try {
    const membersCollection = collection(instance, collections.MEMBERS);
    await addDoc(membersCollection, data);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

const getMembersListRealtime = async (instance) => {
  try {
    const members = [];

    const membersCollection = collection(instance, collections.MEMBERS);
    onSnapshot(membersCollection, (snapshots) => {
      snapshots.forEach((snapshots) => {
        const member = {
          id: snapshots.id,
          ...snapshots.data(),
        };
        members.push(member);
      });
    });

    return members;
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
