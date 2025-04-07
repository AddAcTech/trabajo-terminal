import express from "express";
import { storeImage, getImages } from "../controllers/images.controller.js";
import upload from "../middleware/upload.middleware.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// The 'image' parameter should match the field name in your form
// Added authenticateToken middleware to protect this route
router.post("/upload", authenticateToken, upload.single("image"), storeImage);
router.get("/images", authenticateToken, getImages);

export default router;
