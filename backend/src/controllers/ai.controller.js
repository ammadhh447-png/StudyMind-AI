import { Note } from "../models/Note.js";
import { Quiz } from "../models/Quiz.js";
import { FlashcardSet } from "../models/FlashcardSet.js";
import { MindMap } from "../models/MindMap.js";
import { logActivity } from "../models/Activity.js";
import {
  generateAIResponse,
  generateStructuredJSON,
} from "../services/openrouter.service.js";
import { transcribeWithGroq } from "../services/stt.service.js";

async function getNoteContext(userId, noteId) {
  if (!noteId) return "";
  const note = await Note.findOne({ _id: noteId, userId });
  if (!note) return "";
  return `Title: ${note.title}\n\n${note.extractedText?.slice(0, 12000) || ""}`;
}

export async function chat(req, res, next) {
  try {
    const { message, noteId } = req.body;
    const context = await getNoteContext(req.user.id, noteId);
    const allNotes = await Note.find({ userId: req.user.id })
      .select("title extractedText")
      .limit(5);
    const mergedContext =
      context ||
      allNotes
        .map((n) => `${n.title}:\n${n.extractedText?.slice(0, 2000) || ""}`)
        .join("\n\n");

    const reply = await generateAIResponse({
      prompt: message,
      context: mergedContext,
      mode: "chat",
    });
    await logActivity(req.user.id, "AI chat session", message.slice(0, 80));
    res.json({ success: true, reply, sources: allNotes.map((n) => ({
      title: n.title,
      excerpt: n.extractedText?.slice(0, 160) || "",
    })) });
  } catch (err) {
    next(err);
  }
}

export async function transcribe(req, res, next) {
  try {
    if (!req.file?.buffer?.length) {
      return res.status(400).json({ success: false, message: "No audio uploaded" });
    }

    if (!process.env.GROQ_API_KEY?.trim()) {
      return res.status(503).json({
        success: false,
        message:
          "Add GROQ_API_KEY in backend/.env (https://console.groq.com/keys), restart the backend, then try voice again — or type your question.",
      });
    }

    const text = (await transcribeWithGroq(req.file.buffer, req.file.mimetype || "audio/webm")) || "";
    if (!text) {
      return res.status(422).json({
        success: false,
        message: "Could not understand the audio. Speak closer to the mic and try again.",
      });
    }
    res.json({ success: true, text });
  } catch (err) {
    next(err);
  }
}

export async function summarise(req, res, next) {
  try {
    const { text, noteId } = req.body;
    let source = text;
    let sourceTitle = "Custom text";
    if (noteId) {
      const note = await Note.findOne({ _id: noteId, userId: req.user.id });
      source = note?.extractedText || text;
      sourceTitle = note?.title || sourceTitle;
    }
    if (!source?.trim()) {
      return res.status(400).json({ success: false, message: "No text to summarise" });
    }

    const material = source.slice(0, 12000);
    try {
      const summary = await generateStructuredJSON({
        context: material,
        prompt: `Summarise this study material titled "${sourceTitle}" for exam revision. JSON only:
{
  "title": string,
  "quickOverview": string (2-3 sentences, beginner-friendly),
  "keyPoints": string[] (6-10 concise exam-relevant bullets),
  "definitions": [{"term": string, "meaning": string}] (3-8 items; empty array if none),
  "examTips": string[] (3-5 practical revision tips),
  "rememberThis": string (one memorable exam takeaway)
}`,
      });
      await logActivity(req.user.id, "Generated summary", sourceTitle);
      return res.json({ success: true, summary, format: "structured" });
    } catch {
      const fallback = await generateAIResponse({
        prompt: `Summarise for students using labelled sections (Quick overview, Key points, Exam tips). Plain text only, no # or **:\n\n${material}`,
        mode: "summarise",
      });
      await logActivity(req.user.id, "Generated summary", sourceTitle);
      return res.json({
        success: true,
        summary: { title: sourceTitle, quickOverview: fallback, keyPoints: [], definitions: [], examTips: [], rememberThis: "" },
        format: "text",
      });
    }
  } catch (err) {
    next(err);
  }
}

export async function generateQuiz(req, res, next) {
  try {
    const { noteId, title, difficulty = "Medium" } = req.body;
    const context = await getNoteContext(req.user.id, noteId);
    if (!context.trim()) {
      return res.status(400).json({ success: false, message: "Upload a note with extractable text first" });
    }

    const data = await generateStructuredJSON({
      context,
      prompt: `Generate a ${difficulty} difficulty quiz with 8 questions mixing mcq, true_false, and short types. JSON shape: { "title": string, "questions": [{ "type": "mcq"|"true_false"|"short", "prompt": string, "options": string[] (mcq only), "answer": string }] }`,
    });

    const quiz = await Quiz.create({
      userId: req.user.id,
      noteId: noteId || undefined,
      title: title || data.title || "AI Generated Quiz",
      difficulty,
      questions: (data.questions || []).map((q) => {
        const type = ["mcq", "true_false", "short", "long"].includes(q.type) ? q.type : "short";
        let options = Array.isArray(q.options) ? q.options.map((o) => String(o)) : [];
        if (type === "mcq" && options.length > 1) {
          options = [...options].sort(() => Math.random() - 0.5);
        }
        return {
          type,
          prompt: String(q.prompt || "").trim(),
          options,
          answer: String(q.answer || "").trim(),
        };
      }),
    });

    await logActivity(req.user.id, "Generated quiz", quiz.title);
    res.status(201).json({ success: true, quiz });
  } catch (err) {
    next(err);
  }
}

export async function generateFlashcards(req, res, next) {
  try {
    const { noteId, name } = req.body;
    const context = await getNoteContext(req.user.id, noteId);
    if (!context.trim()) {
      return res.status(400).json({ success: false, message: "Upload a note with extractable text first" });
    }

    const data = await generateStructuredJSON({
      context,
      prompt: `Generate exactly 12 study flashcards from the notes.
Return JSON with this exact shape:
{"name":"Short set title","cards":[{"question":"...","answer":"...","difficulty":"easy"}]}
Rules:
- "cards" must be an array of 12 objects
- each card needs question, answer, difficulty (easy|medium|hard)
- keep answers concise`,
    });

    const cards = Array.isArray(data.cards)
      ? data.cards
          .filter((c) => c && (c.question || c.answer))
          .map((c) => ({
            question: String(c.question || "").trim() || "Question",
            answer: String(c.answer || "").trim() || "Answer",
            difficulty: ["easy", "medium", "hard"].includes(String(c.difficulty))
              ? String(c.difficulty)
              : "medium",
          }))
      : [];

    if (cards.length === 0) {
      return res.status(422).json({
        success: false,
        message: "AI did not return usable flashcards. Try again.",
      });
    }

    const set = await FlashcardSet.create({
      userId: req.user.id,
      noteId: noteId || undefined,
      name: name || data.name || "AI Flashcards",
      cards,
    });

    await logActivity(req.user.id, "Generated flashcards", set.name);
    res.status(201).json({ success: true, set });
  } catch (err) {
    next(err);
  }
}

export async function generateMindMap(req, res, next) {
  try {
    const { noteId, title } = req.body;
    const context = await getNoteContext(req.user.id, noteId);
    if (!context.trim()) {
      return res.status(400).json({ success: false, message: "Upload a note with extractable text first" });
    }

    const data = await generateStructuredJSON({
      context,
      prompt: `Create a study mind map as JSON:
{
  "title": string,
  "nodes": [
    { "id": string, "label": string, "parentId": string|null, "detail": string }
  ]
}
Rules:
- Exactly one central node with id "root" and parentId null; label = main topic from the notes.
- Exactly 4 first-level branches (parentId "root") — one for each quadrant of a visual mind map.
- Each branch has 3-5 second-level child nodes (parentId = that branch id).
- Keep labels short (2-5 words) so they fit in boxes.
- Each node needs a short "detail" (1 sentence for revision).
- Unique string ids (root, n1, n2, ...).`,
    });

    const rawNodes = Array.isArray(data.nodes) ? data.nodes : [];
    const seen = new Set();
    const nodes = rawNodes
      .filter((n) => n && n.id && n.label)
      .map((n, i) => {
        let id = String(n.id);
        if (seen.has(id)) id = `${id}-${i}`;
        seen.add(id);
        return {
          id,
          label: String(n.label).slice(0, 120),
          parentId: n.parentId == null || n.parentId === "" ? null : String(n.parentId),
          detail: n.detail ? String(n.detail).slice(0, 500) : "",
        };
      });

    if (!nodes.some((n) => n.id === "root")) {
      nodes.unshift({
        id: "root",
        label: data.title || "Main topic",
        parentId: null,
        detail: "Central theme from your notes.",
      });
    }

    const map = await MindMap.create({
      userId: req.user.id,
      noteId: noteId || undefined,
      title: title || data.title || "AI Mind Map",
      nodes,
    });

    await logActivity(req.user.id, "Mind map created", map.title);
    res.status(201).json({ success: true, map });
  } catch (err) {
    next(err);
  }
}
