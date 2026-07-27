import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    noteId: { type: mongoose.Schema.Types.ObjectId, ref: "Note" },
    title: { type: String, required: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
    questions: [
      {
        type: { type: String, enum: ["mcq", "true_false", "short", "long"] },
        prompt: String,
        options: [String],
        answer: String,
      },
    ],
    attempts: [
      {
        score: Number,
        takenAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const Quiz = mongoose.model("Quiz", quizSchema);
