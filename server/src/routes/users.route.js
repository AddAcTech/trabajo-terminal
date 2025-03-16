import express from "express";
import { storeUser, loginUser } from "../controllers/users.controller.js";

const router = express.Router();

router.post("/store", storeUser);
router.post("/login", loginUser);

export default router;
