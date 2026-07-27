import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getProgress, clearActivities } from "../controllers/progress.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", getProgress);
router.delete("/activities", clearActivities);

export default router;
