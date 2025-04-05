import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { deleteDocument, getUserDocuments, uploadDocument } from "../controllers/document.controller.js";

const router = Router();


router.use(verifyJWT);


router.route("/upload").post(
  upload.single("file"),
  uploadDocument
);


router.route("/").get(getUserDocuments);


router.route("/:id").delete(deleteDocument);

export default router;