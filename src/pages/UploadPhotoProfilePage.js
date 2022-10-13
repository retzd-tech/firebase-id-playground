import operation from "../api";

const UploadPhotoProfilePage = () => {
  return (
    <>
      <div className="App">
        <label>Choose a photo!</label>
        <input type="file" id="photo" name="photo" accept="image/*" onChange={(file) => {operation.uploadImage(file)}}/>
      </div>
    </>
  );
};

export default UploadPhotoProfilePage;
