import mongoose from "mongoose";

const flashcardSetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    noteId: { type: mongoose.Schema.Types.ObjectId, ref: "Note" },
    name: { type: String, required: true },
    cards: [
      {
        question: String,
        answer: String,
        difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
      },
    ],
  },
  { timestamps: true }
);

export const FlashcardSet = mongoose.model("FlashcardSet", flashcardSetSchema);
