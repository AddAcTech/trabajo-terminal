import express from "express";
import { storeImage } from "../controllers/images.controller.js";

const router = express.Router();

router.post("/store", storeImage);

export default router;
