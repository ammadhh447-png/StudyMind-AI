import { Quiz } from "../models/Quiz.js";
import { Note } from "../models/Note.js";
import { logActivity } from "../models/Activity.js";
import { generateStructuredJSON } from "../services/openrouter.service.js";

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "");
}

function tokenSet(text) {
  return new Set(
    normalize(text)
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

function scoreShortAnswer(question, userAnswer) {
  const a = normalize(userAnswer);
  const expected = normalize(question.answer);
  if (!a) return 0;
  if (a === expected) return 100;
  if (a.includes(expected) || expected.includes(a)) return 90;

  const answerTokens = expected.split(/\s+/).filter((w) => w.length > 2);
  if (answerTokens.length === 0) return a ? 50 : 0;

  const userTokens = tokenSet(userAnswer);
  const matched = answerTokens.filter((t) => userTokens.has(t)).length;
  const ratio = matched / answerTokens.length;
  if (ratio >= 0.75) return 85;
  if (ratio >= 0.5) return 70;
  if (ratio >= 0.25) return 45;
  return 0;
}

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalizeQuestions(rawQuestions = []) {
  return (Array.isArray(rawQuestions) ? rawQuestions : [])
    .filter((q) => q && q.prompt)
    .map((q) => {
      const type = ["mcq", "true_false", "short", "long"].includes(q.type) ? q.type : "short";
      let options = Array.isArray(q.options) ? q.options.map((o) => String(o)) : [];
      if (type === "mcq" && options.length > 1) {
        options = shuffleArray(options);
      }
      return {
        type,
        prompt: String(q.prompt).trim(),
        options,
        answer: String(q.answer || "").trim(),
      };
    });
}

async function getNoteContext(userId, noteId) {
  if (!noteId) return "";
  const note = await Note.findOne({ _id: noteId, userId });
  if (!note) return "";
  return `Title: ${note.title}\n\n${note.extractedText?.slice(0, 12000) || ""}`;
}

export async function listQuizzes(req, res, next) {
  try {
    const quizzes = await Quiz.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, quizzes });
  } catch (err) {
    next(err);
  }
}

export async function getQuiz(req, res, next) {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user.id });
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }
    res.json({ success: true, quiz });
  } catch (err) {
    next(err);
  }
}

export async function regenerateQuiz(req, res, next) {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user.id });
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    let context = await getNoteContext(req.user.id, quiz.noteId);
    if (!context.trim()) {
      context = `Quiz topic: ${quiz.title}\nPrevious questions for reference only (do not repeat):\n${quiz.questions
        .map((q, i) => `${i + 1}. ${q.prompt}`)
        .join("\n")}`;
    }

    const previous = quiz.questions
      .map((q) => q.prompt)
      .filter(Boolean)
      .slice(0, 12)
      .join(" | ");

    const data = await generateStructuredJSON({
      context,
      prompt: `Generate a brand-new ${quiz.difficulty || "Medium"} difficulty quiz with 8 DIFFERENT questions.
Mix mcq, true_false, and short types.
Do NOT repeat or lightly rephrase these previous questions: ${previous || "none"}
JSON shape:
{"title":"string","questions":[{"type":"mcq"|"true_false"|"short","prompt":"string","options":["..."] (mcq only),"answer":"string"}]}`,
    });

    const questions = normalizeQuestions(data.questions);
    if (questions.length === 0) {
      return res.status(422).json({
        success: false,
        message: "Could not generate new quiz questions. Try again.",
      });
    }

    quiz.questions = shuffleArray(questions);
    if (data.title) quiz.title = String(data.title).slice(0, 160);
    await quiz.save();
    await logActivity(req.user.id, "Retook quiz with new questions", quiz.title);

    res.json({ success: true, quiz });
  } catch (err) {
    next(err);
  }
}

export async function submitQuiz(req, res, next) {
  try {
    const { answers } = req.body;
    if (!Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: "Answers must be an array" });
    }

    const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user.id });
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    let earned = 0;
    const results = [];

    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      const userAnswer = answers[i] ?? "";
      let points = 0;
      if (q.type === "mcq" || q.type === "true_false") {
        points = normalize(userAnswer) === normalize(q.answer) ? 100 : 0;
      } else {
        points = scoreShortAnswer(q, userAnswer);
      }
      earned += points;
      results.push({ index: i, correct: points >= 70, points, expected: q.answer });
    }

    const score = Math.round(earned / Math.max(quiz.questions.length, 1));
    quiz.attempts.push({ score });
    await quiz.save();
    await logActivity(req.user.id, "Completed quiz", `${quiz.title} (${score}%)`);

    res.json({ success: true, score, results });
  } catch (err) {
    next(err);
  }
}

export async function recordAttempt(req, res, next) {
  try {
    const { score } = req.body;
    const quiz = await Quiz.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $push: { attempts: { score } } },
      { new: true }
    );
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }
    res.json({ success: true, quiz });
  } catch (err) {
    next(err);
  }
}
