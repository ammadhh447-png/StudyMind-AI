import { MindMap } from "../models/MindMap.js";
import { logActivity } from "../models/Activity.js";

export async function listMindMaps(req, res, next) {
  try {
    const maps = await MindMap.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, maps });
  } catch (err) {
    next(err);
  }
}

export async function getMindMap(req, res, next) {
  try {
    const map = await MindMap.findOne({ _id: req.params.id, userId: req.user.id });
    if (!map) {
      return res.status(404).json({ success: false, message: "Mind map not found" });
    }
    res.json({ success: true, map });
  } catch (err) {
    next(err);
  }
}

export async function saveMindMap(req, res, next) {
  try {
    const { title, noteId, nodes } = req.body;
    const map = await MindMap.create({
      userId: req.user.id,
      title,
      noteId,
      nodes: nodes || [],
    });
    await logActivity(req.user.id, "Mind map created", map.title);
    res.status(201).json({ success: true, map });
  } catch (err) {
    next(err);
  }
}

export async function updateMindMap(req, res, next) {
  try {
    const { nodes, title } = req.body;
    const update = {};
    if (nodes !== undefined) update.nodes = nodes;
    if (title !== undefined) update.title = title;
    const map = await MindMap.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: update },
      { new: true }
    );
    if (!map) {
      return res.status(404).json({ success: false, message: "Mind map not found" });
    }
    res.json({ success: true, map });
  } catch (err) {
    next(err);
  }
}

export async function deleteMindMap(req, res, next) {
  try {
    const map = await MindMap.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!map) {
      return res.status(404).json({ success: false, message: "Mind map not found" });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
