import mongoose from "mongoose";

const plannerTaskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Done"],
      default: "Pending",
    },
    scheduledTime: { type: String, default: "09:00 AM" },
    dueDate: { type: Date, default: () => new Date() },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

plannerTaskSchema.index({ status: 1, reminderSent: 1, dueDate: 1 });

export const PlannerTask = mongoose.model("PlannerTask", plannerTaskSchema);
