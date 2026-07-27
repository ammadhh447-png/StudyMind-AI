import mongoose from "mongoose";

const mindMapSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    noteId: { type: mongoose.Schema.Types.ObjectId, ref: "Note" },
    title: { type: String, required: true },
    nodes: [
      {
        id: String,
        label: String,
        parentId: { type: String, default: null },
        detail: String,
      },
    ],
  },
  { timestamps: true }
);

export const MindMap = mongoose.model("MindMap", mindMapSchema);
