const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { async } = require("@firebase/util");
admin.initializeApp();

const firestore = admin.firestore();

const sanitizeString = (string) => {
  return string.replace(/[^a-zA-Z ]/g, " ");
};

const getFilename = (filepath) => {
  const splittedString = filepath.split("/");
  const filenameIndex = splittedString.length - 1;
  return splittedString[filenameIndex];
};

exports.helloWorld = functions.https.onRequest((request, response) => {
  const someObjectResponse = {
    data: "Hello World",
  };
  functions.logger.info("Hello logs!", { structuredData: true });
  response.send(someObjectResponse);
});

exports.createCustomToken = functions.https.onRequest(
  async (request, response) => {
    const email = request.body.email;
    const user = await admin.auth().getUserByEmail(email);
    const customToken = await admin.auth().createCustomToken(user.uid);
    return response.send({ customToken, user });
  }
);

const removeFileExtensionPrefix = (filename) => {
  const splittedFilename = filename.split(" ");
  splittedFilename.pop();
  return splittedFilename.join(" ");
};

exports.generateImageName = functions.firestore
  .document("galleries/{id}")
  .onCreate((snapshot) => {
    const { filename } = snapshot.data();
    const sanitizedFilename = sanitizeString(filename);
    const imageName = removeFileExtensionPrefix(sanitizedFilename);
    return snapshot.ref.update({ name: imageName });
  });

exports.onFileUploaded = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType;
    const filename = getFilename(filePath);
    const file = {
      filename: filename,
      path: filePath,
      type: contentType,
    };
    firestore.collection("galleries").add(file);
    return functions.logger.log(
      "File upload properties has been created successfully for ",
      filePath
    );
  });
