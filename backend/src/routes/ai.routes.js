import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { uploadAudio } from "../middleware/upload.js";
import {
  chat,
  summarise,
  generateQuiz,
  generateFlashcards,
  generateMindMap,
  transcribe,
} from "../controllers/ai.controller.js";

const router = Router();

router.use(authMiddleware);
router.post("/chat", chat);
router.post("/transcribe", uploadAudio.single("audio"), transcribe);
router.post("/summarise", summarise);
router.post("/generate-quiz", generateQuiz);
router.post("/generate-flashcards", generateFlashcards);
router.post("/generate-mind-map", generateMindMap);

export default router;
