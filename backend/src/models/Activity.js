import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    subject: { type: String, required: true },
  },
  { timestamps: true }
);

export const Activity = mongoose.model("Activity", activitySchema);

export async function logActivity(userId, action, subject) {
  await Activity.create({ userId, action, subject });
}
