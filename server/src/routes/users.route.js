import express from "express";
import { storeUser } from "../controllers/users.controller.js";

const router = express.Router();

router.post("/store", storeUser);

export default router;
