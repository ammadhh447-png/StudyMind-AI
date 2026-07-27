"use client";

import { useCallback, useEffect, useState } from "react";
import { Shuffle } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/charts/lazy-charts";
import {
  aiApi,
  notesApi,
  type FlashcardSetRecord,
  type NoteRecord,
} from "@/lib/api";
import { NoteSelect } from "@/components/notes/note-select";

export default function FlashcardsPage() {
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [noteId, setNoteId] = useState("");
  const [activeSet, setActiveSet] = useState<FlashcardSetRecord | null>(null);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const noteRes = await notesApi.list();
    setNotes(noteRes.notes);
  }, []);

  useEffect(() => {
    load().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load flashcards")
    );
  }, [load]);

  const cards = activeSet?.cards || [];
  const card = cards[index];

  async function generate() {
    if (!noteId) {
      setError("Select a note first.");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      const { set } = await aiApi.generateFlashcards(noteId);
      setActiveSet(set);
      setIndex(0);
      setShowAnswer(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  function shuffle() {
    if (!activeSet) return;
    const shuffled = [...activeSet.cards].sort(() => Math.random() - 0.5);
    setActiveSet({ ...activeSet, cards: shuffled });
    setIndex(0);
    setShowAnswer(false);
  }

  return (
    <PageShell inset header={<TopBar title="Flashcards" subtitle="Smart revision from your materials" />}>
      <div className="space-y-3 pb-1">
      <div className="flex flex-wrap items-end gap-3">
        {notes.length > 0 ? (
          <NoteSelect
            notes={notes}
            value={noteId}
            onChange={(id) => {
              setNoteId(id);
              setActiveSet(null);
              setIndex(0);
              setShowAnswer(false);
              setError("");
            }}
            placeholder="Select"
            className="w-full max-w-xs"
            triggerClassName="h-10 rounded-xl"
          />
        ) : null}
        <Button onClick={generate} disabled={generating}>
          {generating ? "Generating..." : "Generate Flashcards"}
        </Button>
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <div className="grid gap-3 lg:grid-cols-3">
        <GlassCard className="flex min-h-[360px] flex-col items-center justify-center lg:col-span-2">
          {card ? (
            <>
              <p className="mb-2 text-xs uppercase tracking-wider text-muted">
                {showAnswer ? "Answer" : "Question"} · {index + 1}/{cards.length}
              </p>
              <h2 className="max-w-lg text-center text-xl font-medium">
                {showAnswer ? card.answer : card.question}
              </h2>
              <Button
                className="mt-8"
                variant="secondary"
                onClick={() => setShowAnswer((v) => !v)}
              >
                {showAnswer ? "Show Question" : "Show Answer"}
              </Button>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                <Button variant="ghost" size="sm" onClick={shuffle}>
                  <Shuffle className="h-4 w-4" />
                  Shuffle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIndex((i) => Math.min(i + 1, cards.length - 1));
                    setShowAnswer(false);
                  }}
                >
                  Next
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">
              {noteId
                ? "Click Generate Flashcards to study."
                : "Select a note, then generate flashcards."}
            </p>
          )}
        </GlassCard>
        <div className="space-y-3">
          <GlassCard>
            <h2 className="mb-4 text-sm font-medium">Sets</h2>
            {activeSet ? (
              <div className="flex w-full items-center justify-between rounded-lg bg-[#c9a84c]/20 px-3 py-2 text-sm text-[#f0d08a] ring-1 ring-[#c9a84c]/35">
                <span className="truncate">{activeSet.name}</span>
                <span className="shrink-0 text-muted">{activeSet.cards.length}</span>
              </div>
            ) : (
              <p className="text-sm text-muted">
                {noteId
                  ? "Generate flashcards to see the set here."
                  : "Select a note first."}
              </p>
            )}
          </GlassCard>
          <GlassCard>
            <h2 className="mb-4 text-sm font-medium">Progress</h2>
            <div className="flex justify-center">
              <ProgressRing
                value={
                  cards.length
                    ? Math.round(((index + 1) / cards.length) * 100)
                    : 0
                }
              />
            </div>
          </GlassCard>
        </div>
      </div>
      </div>
    </PageShell>
  );
}
