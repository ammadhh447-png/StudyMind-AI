import { createServer } from "http";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/database.js";
import authRoutes from "./routes/auth.routes.js";
import noteRoutes from "./routes/note.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import quizRoutes from "./routes/quiz.routes.js";
import progressRoutes from "./routes/progress.routes.js";
import groupRoutes from "./routes/group.routes.js";
import flashcardRoutes from "./routes/flashcard.routes.js";
import plannerRoutes from "./routes/planner.routes.js";
import mindmapRoutes from "./routes/mindmap.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { uploadsDir } from "./services/storage.service.js";
import { initSocket } from "./socket.js";
import { startPlannerReminderJob } from "./services/planner-reminder.service.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "StudyMind AI API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/planner", plannerRoutes);
app.use("/api/mind-maps", mindmapRoutes);

app.use(errorHandler);

connectDB()
  .then(() => {
    initSocket(httpServer);
    startPlannerReminderJob();
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  });
