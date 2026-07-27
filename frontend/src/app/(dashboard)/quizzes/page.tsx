"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/charts/lazy-charts";
import { aiApi, notesApi, progressApi, quizzesApi, type NoteRecord, type QuizRecord } from "@/lib/api";
import { NoteSelect } from "@/components/notes/note-select";

const difficultyVariant = {
  Easy: "success",
  Medium: "warning",
  Hard: "danger",
} as const;

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizRecord[]>([]);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [noteId, setNoteId] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const [avgScore, setAvgScore] = useState(0);

  const load = useCallback(async () => {
    try {
      const [quizRes, noteRes, progressRes] = await Promise.all([
        quizzesApi.list(),
        notesApi.list(),
        progressApi.get(),
      ]);
      setQuizzes(quizRes.quizzes);
      setNotes(noteRes.notes);
      setAvgScore(progressRes.stats.averageScore);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function generateQuiz() {
    if (!noteId) {
      setError("Select a note first to generate a quiz.");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      await aiApi.generateQuiz(noteId, "Medium");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Quiz generation failed");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <PageShell inset header={<TopBar title="Quizzes" subtitle="AI-generated assessments from your notes" />}>
      <div className="space-y-3 pb-1">
      <div className="flex flex-wrap items-end gap-3">
        {notes.length > 0 ? (
          <div>
            <label className="mb-1 block text-xs text-muted">Source note</label>
            <NoteSelect
              notes={notes}
              value={noteId}
              onChange={setNoteId}
              placeholder="Select"
              triggerClassName="h-10 rounded-xl"
            />
          </div>
        ) : null}
        <Button onClick={generateQuiz} disabled={generating}>
          {generating ? "Generating..." : "Generate Quiz with AI"}
        </Button>
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {loading ? (
            <p className="text-sm text-muted">Loading...</p>
          ) : quizzes.length === 0 ? (
            <p className="text-sm text-muted">No quizzes yet. Generate one from your notes.</p>
          ) : (
            quizzes.map((quiz) => (
              <GlassCard
                key={quiz._id}
                className="flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <h3 className="font-medium">{quiz.title}</h3>
                  <p className="text-sm text-muted">{quiz.questions?.length || 0} questions</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      difficultyVariant[
                        quiz.difficulty as keyof typeof difficultyVariant
                      ] || "muted"
                    }
                  >
                    {quiz.difficulty}
                  </Badge>
                  <Button size="sm" asChild>
                    <Link href={`/quizzes/${quiz._id}`}>Attempt</Link>
                  </Button>
                </div>
              </GlassCard>
            ))
          )}
        </div>
        <GlassCard>
          <h2 className="mb-4 text-sm font-medium">Performance</h2>
          <div className="flex justify-center">
            <ProgressRing value={avgScore} />
          </div>
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Quizzes</dt>
              <dd>{quizzes.length}</dd>
            </div>
          </dl>
        </GlassCard>
      </div>
      </div>
    </PageShell>
  );
}
