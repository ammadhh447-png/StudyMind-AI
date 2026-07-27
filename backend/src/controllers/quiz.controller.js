import { Quiz } from "../models/Quiz.js";
import { logActivity } from "../models/Activity.js";

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
