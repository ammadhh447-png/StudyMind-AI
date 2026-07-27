import { FlashcardSet } from "../models/FlashcardSet.js";

export async function listFlashcardSets(req, res, next) {
  try {
    const sets = await FlashcardSet.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, sets });
  } catch (err) {
    next(err);
  }
}

export async function getFlashcardSet(req, res, next) {
  try {
    const set = await FlashcardSet.findOne({ _id: req.params.id, userId: req.user.id });
    if (!set) {
      return res.status(404).json({ success: false, message: "Flashcard set not found" });
    }
    res.json({ success: true, set });
  } catch (err) {
    next(err);
  }
}
