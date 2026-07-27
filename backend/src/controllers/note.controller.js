import { Note } from "../models/Note.js";
import { storeFile } from "../services/storage.service.js";
import { extractTextFromFile } from "../services/ocr.service.js";
import { logActivity } from "../models/Activity.js";

export async function listNotes(req, res, next) {
  try {
    const notes = await Note.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, notes });
  } catch (err) {
    next(err);
  }
}

export async function uploadNote(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "File is required" });
    }

    const { buffer, originalname, mimetype } = req.file;
    const title = req.body.title?.trim() || originalname.replace(/\.[^.]+$/, "");

    const { url } = await storeFile(buffer, originalname, mimetype);
    const extracted = await extractTextFromFile(buffer, mimetype, originalname);

    const note = await Note.create({
      userId: req.user.id,
      title,
      fileType: extracted.fileType,
      fileUrl: url,
      pageCount: extracted.pageCount,
      extractedText: extracted.text,
    });

    await logActivity(req.user.id, "Uploaded notes", note.title);

    res.status(201).json({ success: true, note });
  } catch (err) {
    next(err);
  }
}

export async function deleteNote(req, res, next) {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
