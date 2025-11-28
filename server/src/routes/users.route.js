import express from "express";
import { storeUser, loginUser, verifyMainKey, checkMainKey, storeKey } from "../controllers/users.controller.js";

const router = express.Router();

router.post("/store", storeUser);
router.post("/login", loginUser);

router.post("/check-key",checkMainKey);
router.post("/verify-key", verifyMainKey);
router.post("/set-key", storeKey);

export default router;
