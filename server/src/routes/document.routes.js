import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { deleteDocument, getUserDocuments, uploadDocument } from "../controllers/document.controller.js";

const router = Router();

// // Apply authentication middleware to all routes
router.use(verifyJWT);

// Upload a new PDF document
router.route("/upload").post(
  upload.single("file"),
  uploadDocument
);

// Get all documents for current user
router.route("/").get(getUserDocuments);

// // Delete a document
router.route("/:id").delete(deleteDocument);

export default router;