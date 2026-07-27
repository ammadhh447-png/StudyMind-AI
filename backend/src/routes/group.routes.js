import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import {
  addPlannerItem,
  createGroup,
  createTask,
  getGroup,
  getInviteLink,
  joinGroup,
  listGroups,
  postAnnouncement,
  postMessage,
  recordQuizScore,
  updateTask,
  uploadGroupFile,
  deleteGroup,
} from "../controllers/group.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", listGroups);
router.post("/", createGroup);
router.post("/join", joinGroup);
router.get("/:id", getGroup);
router.delete("/:id", deleteGroup);
router.get("/:id/invite", getInviteLink);
router.post("/:id/messages", postMessage);
router.post("/:id/announcements", postAnnouncement);
router.post("/:id/files", upload.single("file"), uploadGroupFile);
router.post("/:id/tasks", createTask);
router.patch("/:id/tasks/:taskId", updateTask);
router.post("/:id/planner", addPlannerItem);
router.post("/:id/quiz-scores", recordQuizScore);

export default router;
