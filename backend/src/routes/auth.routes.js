import { Router } from "express";
import {
  register,
  login,
  getProfile,
  googleAuth,
  updateProfile,
  uploadAvatar,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);
router.get("/me", authMiddleware, getProfile);
router.patch("/me", authMiddleware, updateProfile);
router.post("/me/avatar", authMiddleware, upload.single("avatar"), uploadAvatar);

export default router;
