import { Activity, logActivity } from "../models/Activity.js";
import { Note } from "../models/Note.js";
import { Quiz } from "../models/Quiz.js";
import { FlashcardSet } from "../models/FlashcardSet.js";

function recentDays(count = 7) {
  const days = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function countByDays(items, getDate, getValue = () => 1) {
  const days = recentDays(7);
  return days.map((day) => ({
    day: day.toLocaleDateString(undefined, { weekday: "short" }),
    value: items.reduce((sum, item) => {
      const itemDate = getDate(item);
      if (!itemDate) return sum;
      return sameDay(day, itemDate) ? sum + getValue(item) : sum;
    }, 0),
  }));
}

export async function getProgress(req, res, next) {
  try {
    const userId = req.user.id;
    const [quizzes, notes, flashcardSets, activities] = await Promise.all([
      Quiz.find({ userId }),
      Note.find({ userId }),
      FlashcardSet.find({ userId }),
      Activity.find({ userId }).sort({ createdAt: -1 }).limit(50),
    ]);

    const attempts = quizzes.flatMap((q) =>
      (q.attempts || []).map((a) => ({ score: a.score || 0, quizTitle: q.title }))
    );
    const avgScore =
      attempts.length === 0
        ? 0
        : Math.round(
            attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length
          );

    const flashcardsStudied = flashcardSets.reduce(
      (sum, set) => sum + (set.cards?.length || 0),
      0
    );

    const weakAttempts = quizzes.flatMap((q) =>
      (q.attempts || []).map((a) => ({
        quizId: String(q._id),
        topic: q.title,
        score: a.score || 0,
      }))
    ).filter((x) => x.score > 0 && x.score < 70);

    const weakestByQuiz = new Map();
    for (const row of weakAttempts) {
      const existing = weakestByQuiz.get(row.quizId);
      if (!existing || row.score < existing.score) {
        weakestByQuiz.set(row.quizId, row);
      }
    }

    const weakByQuiz = [...weakestByQuiz.values()]
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);

    const studyHours = Math.min(60, Math.round(notes.length * 2 + attempts.length * 0.5));
    const noteTrend = countByDays(notes, (n) => (n.createdAt ? new Date(n.createdAt) : null));
    const flashcardTrend = countByDays(
      flashcardSets,
      (set) => (set.createdAt ? new Date(set.createdAt) : null),
      (set) => set.cards?.length || 0
    );
    const quizTrend = countByDays(
      quizzes.flatMap((q) =>
        (q.attempts || []).map((a) => ({
          takenAt: a.takenAt,
          score: a.score || 0,
        }))
      ),
      (a) => (a.takenAt ? new Date(a.takenAt) : null)
    );
    const averageScoreTrend = recentDays(7).map((day) => {
      const dayAttempts = quizzes.flatMap((q) =>
        (q.attempts || []).filter((a) => a.takenAt && sameDay(day, new Date(a.takenAt)))
      );
      const avg =
        dayAttempts.length === 0
          ? 0
          : Math.round(
              dayAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / dayAttempts.length
            );
      return {
        day: day.toLocaleDateString(undefined, { weekday: "short" }),
        value: avg,
      };
    });
    const activityTrend = countByDays(
      activities,
      (a) => (a.createdAt ? new Date(a.createdAt) : null)
    );
    const studyTimeTrend = recentDays(7).map((day, index) => ({
      day: day.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1),
      value:
        noteTrend[index].value * 2 +
        quizTrend[index].value * 0.75 +
        Math.round(flashcardTrend[index].value / 8),
    }));
    const overviewBreakdown = [
      { name: "Notes", value: notes.length, color: "#b07a2a" },
      { name: "Quizzes", value: attempts.length, color: "#e2b96f" },
      { name: "Flashcards", value: flashcardsStudied, color: "#c9a84c" },
      { name: "Weak topics", value: weakByQuiz.length, color: "#f0d08a" },
    ];

    res.json({
      success: true,
      stats: {
        studyHours,
        quizzesCompleted: attempts.length,
        flashcardsStudied,
        averageScore: avgScore,
        notesCount: notes.length,
        weakTopics: weakByQuiz.length,
        overallProgress: Math.min(
          100,
          Math.round(notes.length * 8 + attempts.length * 5 + flashcardsStudied * 0.5)
        ),
      },
      recentActivity: activities.map((a) => ({
        id: String(a._id),
        action: a.action,
        subject: a.subject,
        time: a.createdAt,
      })),
      weakTopicDetails: weakByQuiz,
      trends: {
        studyHours: noteTrend,
        quizzesCompleted: quizTrend,
        flashcardsStudied: flashcardTrend,
        averageScore: averageScoreTrend,
        activity: activityTrend,
        studyTime: studyTimeTrend,
      },
      overviewBreakdown,
    });
  } catch (err) {
    next(err);
  }
}

export { logActivity };

export async function clearActivities(req, res, next) {
  try {
    await Activity.deleteMany({ userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
