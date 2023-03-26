const { initializeTestEnvironment, assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { doc, getDoc, setDoc } = require("firebase/firestore");

const PROJECT_ID = "indonesia-firebase-playground";

let firebase;

const getFirebase = async () => {
    return await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: {
            host: "localhost",
            port: 8000
        }
    });
}

const getFirestore = (context) => {
    return context.firestore();
}

describe("Members", () => {
    beforeEach(async () => {
        firebase = await getFirebase();
    })

    it("should able to see members profile data", async () => {
        const auth = firebase.unauthenticatedContext();
        const firestore = getFirestore(auth);
        const memberRef = "members/userId";

        const snapshot = getDoc(doc(firestore, memberRef));

        assertSucceeds(snapshot);
    });

    it("should not be able write member data", async () => {
        const auth = firebase.unauthenticatedContext();
        const firestore = getFirestore(auth);
        const memberRef = "members/userId";

        await assertFails(setDoc(doc(firestore, memberRef), {}));
    });

    it("should be able to write data if the user is authenticated", async () => {
        const auth = firebase.authenticatedContext('adminId');
        const firestore = getFirestore(auth);
        const memberRef = "members/userId";
        const memberData = {
            email: "some email"
        }

        await assertSucceeds(setDoc(doc(firestore, memberRef), memberData));
    });

    it("should not be able to write data if the user is not authenticated", async () => {
        const auth = firebase.unauthenticatedContext();
        const firestore = getFirestore(auth);
        const memberRef = "members/userId";
        const memberData = {
            name: "some name"
        }

        await assertFails(setDoc(doc(firestore, memberRef), memberData));
    });

    it("should be able read document with a correct user id", async () => {
        const auth = firebase.authenticatedContext('userId');
        const firestore = getFirestore(auth);
        const memberRef = "members/userId";

        await assertSucceeds(getDoc(doc(firestore, memberRef)));
    });

    it("should not be able read document with an incorrect user id", async () => {
        const auth = firebase.authenticatedContext('wrongUserId');
        const firestore = getFirestore(auth);
        const memberRef = "members/userId";

        await assertFails(getDoc(doc(firestore, memberRef)));
    });
})

describe("Admin", () => {
    it("should be able to write or update members if the role is admin", async () => {
        const auth = firebase.authenticatedContext('adminId');
        const firestore = getFirestore(auth);
        const memberRef = "members/memberId";
        const memberData = {
            email: "some email"
        }

        await assertSucceeds(setDoc(doc(firestore, memberRef), memberData));
    });

    it("should not be able to write or update members if the role is not admin", async () => {
        const auth = firebase.authenticatedContext('memberId');
        const firestore = getFirestore(auth);
        const memberRef = "members/memberId";

        await assertFails(setDoc(doc(firestore, memberRef), {}));
    });

    it("should not be able to write members document if there is no email field", async () => {
        const auth = firebase.authenticatedContext('adminId');
        const firestore = getFirestore(auth);
        const memberRef = "members/memberId";
        const memberData = {}

        await assertFails(setDoc(doc(firestore, memberRef), memberData));
    })

    it("should be able to write members document if there is email field", async () => {
        const auth = firebase.authenticatedContext('adminId');
        const firestore = getFirestore(auth);
        const memberRef = "members/memberId";
        const memberData = {
            email: "some email"
        }

        await assertSucceeds(setDoc(doc(firestore, memberRef), memberData));
    })
});