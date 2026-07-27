"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  XCircle,
  AlertCircle,
  CircleDot,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { groupsApi, quizzesApi, type QuizQuestion, type QuizRecord } from "@/lib/api";
import { PageShell } from "@/components/layout/page-shell";
import { cn } from "@/lib/utils";

type QuestionResult = {
  index: number;
  correct: boolean;
  points: number;
  expected: string;
};

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase();
}

function resultStatus(result: QuestionResult | undefined) {
  if (!result) return "pending" as const;
  if (result.correct) return "correct" as const;
  if (result.points >= 45) return "partial" as const;
  return "incorrect" as const;
}

function OptionGroup({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ul className="mt-4 space-y-2">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <li key={opt.value}>
            <button
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                selected
                  ? "border-violet-500 bg-violet-600/25 text-foreground shadow-sm shadow-violet-900/20"
                  : "border-white/10 bg-white/5 text-foreground/90 hover:border-violet-500/40 hover:bg-white/[0.07]"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                  selected ? "border-violet-400 bg-violet-500" : "border-muted bg-transparent"
                )}
              >
                {selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
              </span>
              <span className="leading-relaxed">{opt.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function OptionReview({
  options,
  userAnswer,
  correctAnswer,
}: {
  options: { label: string; value: string }[];
  userAnswer: string;
  correctAnswer: string;
}) {
  const userNorm = normalizeAnswer(userAnswer);
  const correctNorm = normalizeAnswer(correctAnswer);

  return (
    <ul className="mt-4 space-y-2">
      {options.map((opt) => {
        const isCorrectOption = normalizeAnswer(opt.value) === correctNorm;
        const isUserPick = normalizeAnswer(opt.value) === userNorm;
        const userWasWrong = isUserPick && !isCorrectOption;

        return (
          <li
            key={opt.value}
            className={cn(
              "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
              isCorrectOption
                ? "border-emerald-500/50 bg-emerald-500/10 text-foreground"
                : userWasWrong
                  ? "border-red-500/40 bg-red-500/10 text-foreground"
                  : "border-white/10 bg-white/[0.03] text-foreground/80"
            )}
          >
            <span className="mt-0.5 shrink-0">
              {isCorrectOption ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : userWasWrong ? (
                <XCircle className="h-4 w-4 text-red-400" />
              ) : (
                <CircleDot className="h-4 w-4 text-muted" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <span className="leading-relaxed">{opt.label}</span>
              {isCorrectOption ? (
                <span className="ml-2 text-xs font-medium text-emerald-400">Correct answer</span>
              ) : null}
              {userWasWrong ? (
                <span className="ml-2 text-xs font-medium text-red-400">Your choice</span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function AnswerReviewBlock({
  userAnswer,
  correctAnswer,
  status,
}: {
  userAnswer: string;
  correctAnswer: string;
  status: "correct" | "partial" | "incorrect" | "pending";
}) {
  const showCorrect = status !== "correct";

  return (
    <div className="mt-4 space-y-3">
      <div
        className={cn(
          "rounded-xl border px-4 py-3",
          status === "correct"
            ? "border-emerald-500/40 bg-emerald-500/10"
            : status === "partial"
              ? "border-amber-500/40 bg-amber-500/10"
              : "border-red-500/35 bg-red-500/10"
        )}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Your answer</p>
        <p className="mt-1 text-sm leading-relaxed text-foreground">
          {userAnswer.trim() || "—"}
        </p>
      </div>
      {showCorrect ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-400/90">
            Correct answer
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{correctAnswer}</p>
        </div>
      ) : null}
    </div>
  );
}

function QuestionStatusBadge({ status }: { status: ReturnType<typeof resultStatus> }) {
  if (status === "correct") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Correct
      </span>
    );
  }
  if (status === "partial") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-300">
        <AlertCircle className="h-3.5 w-3.5" />
        Partial credit
      </span>
    );
  }
  if (status === "incorrect") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-300">
        <XCircle className="h-3.5 w-3.5" />
        Incorrect
      </span>
    );
  }
  return null;
}

export default function QuizAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get("group");
  const id = params.id as string;
  const [quiz, setQuiz] = useState<QuizRecord | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [results, setResults] = useState<QuestionResult[] | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    quizzesApi
      .get(id)
      .then(({ quiz: data }) => {
        setQuiz(data);
        setAnswers(data.questions.map(() => ""));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load quiz"));
  }, [id]);

  const answeredCount = useMemo(
    () => answers.filter((a) => a.trim().length > 0).length,
    [answers]
  );

  const correctCount = useMemo(
    () => results?.filter((r) => r.correct).length ?? 0,
    [results]
  );

  function setAnswer(index: number, value: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function renderInput(q: QuizQuestion, index: number) {
    if (q.type === "mcq" && q.options?.length) {
      return (
        <OptionGroup
          options={q.options.map((o) => ({ label: o, value: o }))}
          value={answers[index]}
          onChange={(v) => setAnswer(index, v)}
        />
      );
    }
    if (q.type === "true_false") {
      return (
        <OptionGroup
          options={[
            { label: "True", value: "True" },
            { label: "False", value: "False" },
          ]}
          value={answers[index]}
          onChange={(v) => setAnswer(index, v)}
        />
      );
    }
    return (
      <Textarea
        className="mt-4 min-h-[100px]"
        placeholder="Type your answer..."
        value={answers[index]}
        onChange={(e) => setAnswer(index, e.target.value)}
      />
    );
  }

  function renderReview(q: QuizQuestion, index: number, result: QuestionResult | undefined) {
    const status = resultStatus(result);
    const expected = result?.expected ?? q.answer;
    const userAnswer = answers[index] ?? "";

    if (q.type === "mcq" && q.options?.length) {
      return (
        <OptionReview
          options={q.options.map((o) => ({ label: o, value: o }))}
          userAnswer={userAnswer}
          correctAnswer={expected}
        />
      );
    }
    if (q.type === "true_false") {
      return (
        <OptionReview
          options={[
            { label: "True", value: "True" },
            { label: "False", value: "False" },
          ]}
          userAnswer={userAnswer}
          correctAnswer={expected}
        />
      );
    }
    return (
      <AnswerReviewBlock userAnswer={userAnswer} correctAnswer={expected} status={status} />
    );
  }

  async function tryAgainWithNewQuestions() {
    if (!quiz) return;
    setRetrying(true);
    setError("");
    try {
      const { quiz: next } = await quizzesApi.regenerate(id);
      setQuiz(next);
      setAnswers(next.questions.map(() => ""));
      setScore(null);
      setResults(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate new questions");
    } finally {
      setRetrying(false);
    }
  }

  async function submit() {
    if (!quiz) return;
    const unanswered = quiz.questions.length - answeredCount;
    if (unanswered > 0) {
      setError(`Please answer all questions (${unanswered} remaining).`);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const result = await quizzesApi.submit(id, answers);
      setScore(result.score);
      setResults(result.results);
      if (groupId && quiz) {
        void groupsApi
          .recordQuizScore(groupId, { quizTitle: quiz.title, score: result.score })
          .catch(() => {});
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!quiz && !error) {
    return <p className="text-sm text-muted">Loading quiz...</p>;
  }

  const total = quiz?.questions.length ?? 0;
  const isReview = score !== null && results !== null;

  return (
    <PageShell scrollBody={false} inset>
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-white/10 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link
              href="/quizzes"
              className="mb-2 inline-flex items-center gap-1 text-xs text-violet-300 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All quizzes
            </Link>
            <h1 className="text-xl font-semibold tracking-tight">{quiz?.title || "Quiz"}</h1>
            <p className="text-sm text-muted">
              {isReview
                ? `Review · ${correctCount} of ${total} fully correct`
                : `${answeredCount} of ${total} answered`}
            </p>
          </div>
          {isReview ? (
            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
              <GlassCard className="flex items-center gap-3 px-4 py-2.5">
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold",
                    score >= 70
                      ? "bg-emerald-500/20 text-emerald-300"
                      : score >= 50
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-red-500/20 text-red-300"
                  )}
                >
                  {score}%
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted">Overall score</p>
                  <p className="text-sm font-semibold">
                    {score >= 70 ? "Well done" : score >= 50 ? "Keep practicing" : "Review answers below"}
                  </p>
                </div>
              </GlassCard>
            </div>
          ) : null}
        </div>
        {total > 0 && !isReview ? (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all"
              style={{ width: `${(answeredCount / total) * 100}%` }}
            />
          </div>
        ) : null}
        {isReview ? (
          <p className="mt-3 text-xs text-muted">
            Green marks the correct option or answer. Compare your responses before leaving this page.
          </p>
        ) : null}
      </header>

      {error ? <p className="mt-2 shrink-0 text-sm text-red-400">{error}</p> : null}

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto py-4">
        <div className="space-y-4">
          {quiz?.questions.map((q, i) => {
            const result = results?.find((r) => r.index === i);
            const status = resultStatus(result);
            const borderAccent =
              !isReview
                ? ""
                : status === "correct"
                  ? "ring-1 ring-emerald-500/30"
                  : status === "partial"
                    ? "ring-1 ring-amber-500/30"
                    : "ring-1 ring-red-500/25";

            return (
              <GlassCard key={`${q.prompt}-${i}`} className={borderAccent}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-xs uppercase tracking-wide text-muted">
                    Question {i + 1} · {q.type.replace("_", " ")}
                  </p>
                  {isReview ? <QuestionStatusBadge status={status} /> : null}
                </div>
                <p className="mt-2 text-base font-medium leading-relaxed text-foreground">
                  {q.prompt}
                </p>
                {isReview ? renderReview(q, i, result) : renderInput(q, i)}
                {isReview && result ? (
                  <p className="mt-3 text-xs text-muted">Points earned: {result.points} / 100</p>
                ) : null}
              </GlassCard>
            );
          })}
        </div>
      </div>

      <footer className="shrink-0 border-t border-white/10 bg-[#070816]/90 pt-3 backdrop-blur-md">
        {isReview ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="w-full sm:w-auto" variant="secondary" onClick={() => router.push("/quizzes")}>
              Back to quizzes
            </Button>
            <Button
              className="w-full sm:w-auto"
              variant="ghost"
              disabled={retrying}
              onClick={() => void tryAgainWithNewQuestions()}
            >
              {retrying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  New questions…
                </>
              ) : (
                "Try again"
              )}
            </Button>
          </div>
        ) : (
          <Button className="w-full" onClick={() => void submit()} disabled={submitting || !quiz}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit quiz"
            )}
          </Button>
        )}
      </footer>
    </div>
    </PageShell>
  );
}
