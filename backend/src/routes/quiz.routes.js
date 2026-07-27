import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { listQuizzes, getQuiz, submitQuiz, recordAttempt } from "../controllers/quiz.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", listQuizzes);
router.get("/:id", getQuiz);
router.post("/:id/submit", submitQuiz);
router.post("/:id/attempts", recordAttempt);

export default router;
