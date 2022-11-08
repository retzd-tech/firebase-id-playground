const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require("@firebase/rules-unit-testing");

const { doc, setDoc } = require("firebase/firestore");

const PROJECT_ID = "indonesia-firebase-playground";
let firebase;

const getFirebase = async (auth) => {
  const config = {
    projectId: PROJECT_ID,
    firestore: {
      host: "localhost",
      port: 8000,
    },
  };
  return await initializeTestEnvironment(config);
};

describe("Security Rules", () => {
  it("should initialize firebase without authentication successfully", async () => {
    firebase = await getFirebase(null);
    assertSucceeds(firebase);
  });

  it("should not be able to write members data if no authentication provided", async () => {
    firebase = await getFirebase(null);
    const membersToBeAdded = {
      name: "public member",
    };
    const membersPath = "members/some-id";
    const firestore = firebase.unauthenticatedContext().firestore();
    const result = setDoc(doc(firestore, membersPath), membersToBeAdded);

    assertFails(result);
  });
});
