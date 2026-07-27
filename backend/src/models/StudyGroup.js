import mongoose from "mongoose";
import crypto from "crypto";

const studyGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    inviteCode: { type: String, unique: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    memberRoles: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        role: { type: String, enum: ["admin", "member"], default: "member" },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    messages: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: String,
        role: String,
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    announcements: [
      {
        title: String,
        body: String,
        authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        authorName: String,
        pinned: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    files: [
      {
        name: String,
        fileType: String,
        size: Number,
        url: String,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        uploaderName: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    tasks: [
      {
        title: String,
        dueDate: String,
        status: {
          type: String,
          enum: ["Pending", "In Progress", "Done"],
          default: "Pending",
        },
        assignedTo: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    plannerItems: [
      {
        title: String,
        topic: String,
        scheduledAt: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    quizScores: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: String,
        quizTitle: String,
        score: Number,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    activities: [
      {
        action: String,
        subject: String,
        userName: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

studyGroupSchema.pre("validate", function generateInvite(next) {
  if (!this.inviteCode) {
    this.inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();
  }
  next();
});

export const StudyGroup = mongoose.model("StudyGroup", studyGroupSchema);
