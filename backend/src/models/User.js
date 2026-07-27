import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String },
    googleId: { type: String },
    avatar: { type: String },
    bio: { type: String, default: "" },
    preferences: {
      language: { type: String, default: "en" },
      theme: { type: String, default: "dark" },
      aiResponseLength: { type: String, default: "balanced" },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
