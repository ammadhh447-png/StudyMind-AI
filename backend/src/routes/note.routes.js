import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { deleteNote, listNotes, uploadNote } from "../controllers/note.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", listNotes);
router.post("/upload", upload.single("file"), uploadNote);
router.delete("/:id", deleteNote);

export default router;
