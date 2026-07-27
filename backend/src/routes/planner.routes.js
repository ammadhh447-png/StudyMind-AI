import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  createTask,
  deleteTask,
  listTasks,
  listWeekTasks,
  updateTask,
} from "../controllers/planner.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", listTasks);
router.get("/week", listWeekTasks);
router.post("/", createTask);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
