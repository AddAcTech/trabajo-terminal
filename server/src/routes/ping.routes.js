import express from "express";
import { getPing } from "../controllers/ping.controller.js";

const router = express.Router();

// GET /ping
router.get("/", getPing);

export default router;
