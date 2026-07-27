import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getFlashcardSet, listFlashcardSets } from "../controllers/flashcard.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", listFlashcardSets);
router.get("/:id", getFlashcardSet);

export default router;
