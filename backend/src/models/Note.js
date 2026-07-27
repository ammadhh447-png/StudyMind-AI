import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    fileType: {
      type: String,
      enum: ["PDF", "Document", "Image", "Presentation"],
      required: true,
    },
    fileUrl: { type: String, required: true },
    pageCount: { type: Number, default: 0 },
    extractedText: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Note = mongoose.model("Note", noteSchema);
