import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  deleteMindMap,
  getMindMap,
  listMindMaps,
  saveMindMap,
  updateMindMap,
} from "../controllers/mindmap.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", listMindMaps);
router.get("/:id", getMindMap);
router.post("/", saveMindMap);
router.patch("/:id", updateMindMap);
router.delete("/:id", deleteMindMap);

export default router;
