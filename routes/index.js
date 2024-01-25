import { Router } from "express";
import auth from "../auth/index.js";
import controller from "../controller/index.js";
import multer from "multer";

const upload = multer({ dest: "tmp/" });
const routes = Router();

routes.get("/", (req, res) => {
  res.json({
    greeting: `Good ${new Date().getHours() < 12 ? "Morning" : "Evening"}`,
    creator: "Rahul Yadav",
    message: "Welcome to Storage System",
    github: "github.com/rahul007-bit/storage-system",
  });
});

routes.post("/create_new_storage", controller.createStorage);

routes.post(
  "/upload_file",
  auth,
  upload.single("my_file"),
  controller.uploadFile
);

routes.get("/my_upload_file", auth, controller.getMyUploadFiles);
// we can also use express.static to serve static files from public folder but
// through this way we can restrict access to files by using auth middleware
routes.get("/public/upload/:file_name", auth, controller.getFile);

routes.post("/text_file_to_audio", auth, controller.textFileToAudio);

routes.post("/merge_image_and_audio", auth, controller.mergeImageAndAudio);

routes.post("/merge_video_and_audio", auth, controller.mergeVideoAndAudio);

routes.post("/merge_all_video", auth, controller.mergeAllVideo);

routes.get("/download_file", auth, controller.downloadFile);

export default routes;
