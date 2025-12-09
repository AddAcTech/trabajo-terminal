import express from "express";
import { storeUser, loginUser, verifyMainKey, checkMainKey, storeKey, setKeyPolitic, deleteUser } from "../controllers/users.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/store", storeUser);
router.post("/login", loginUser);

router.post("/check-key",checkMainKey);
router.post("/verify-key", verifyMainKey);
router.post("/set-key", storeKey);

router.post("/update-key-politic", setKeyPolitic);

router.delete("/:id", authenticateToken, deleteUser);

export default router;
