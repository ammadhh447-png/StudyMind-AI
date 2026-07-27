"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { ActivitySubNav } from "@/components/activity/activity-subnav";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { progressApi } from "@/lib/api";

export default function WeakTopicsPage() {
  const [topics, setTopics] = useState<
    { quizId: string; topic: string; score: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    progressApi
      .get()
      .then((data) => setTopics(data.weakTopicDetails || []))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load weak topics")
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell
      inset
      header={
        <TopBar
          title="Weak topic analysis"
          subtitle="Topics to review based on quiz performance"
        />
      }
    >
      <div className="space-y-4 pb-2">
        <ActivitySubNav />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <GlassCard className="p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium">All weak topics</h2>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/quizzes">Practice quizzes</Link>
            </Button>
          </div>
          {loading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : topics.length === 0 ? (
            <p className="text-sm text-muted">Complete quizzes to see weak topics.</p>
          ) : (
            <ul className="space-y-3">
              {topics.map((t) => (
                <li key={t.quizId}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{t.topic}</span>
                    <span className="text-muted">{t.score}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-500/80 to-amber-500/80"
                      style={{ width: `${t.score}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>
    </PageShell>
  );
}
