"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { ActivitySubNav } from "@/components/activity/activity-subnav";
import { GlassCard } from "@/components/ui/glass-card";
import {
  ProgressRing,
  WeeklyActivityChart,
  WeeklyStudyBar,
} from "@/components/charts/lazy-charts";
import { progressApi } from "@/lib/api";

export default function ProgressPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof progressApi.get>> | null>(null);

  useEffect(() => {
    progressApi.get().then(setData).catch(() => {});
  }, []);

  const s = data?.stats;
  const weakTopics = data?.weakTopicDetails ?? [];
  const weakPreview = weakTopics.slice(0, 5);

  return (
    <PageShell header={<TopBar title="Progress" subtitle="Analytics and learning insights" />} inset>
      <div className="space-y-4 pb-2">
        <ActivitySubNav />
        <div className="grid gap-3 lg:grid-cols-4">
          {[
            { label: "Overall progress", value: s?.overallProgress || 0 },
            { label: "Quiz mastery", value: s?.averageScore || 0 },
            { label: "Flashcard retention", value: Math.min(100, (s?.flashcardsStudied || 0) * 2) },
            { label: "Notes uploaded", value: Math.min(100, (s?.notesCount || 0) * 15) },
          ].map((item) => (
            <GlassCard key={item.label} className="flex scale-90 flex-col items-center p-3">
              <p className="mb-2 text-xs text-muted">{item.label}</p>
              <ProgressRing value={item.value} />
            </GlassCard>
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <GlassCard className="p-4">
            <h2 className="mb-2 text-sm font-medium">Activity trend</h2>
            <WeeklyActivityChart data={data?.trends.activity} />
          </GlassCard>
          <GlassCard className="p-4">
            <h2 className="mb-2 text-sm font-medium">Study time</h2>
            <WeeklyStudyBar data={data?.trends.studyTime} />
          </GlassCard>
        </div>
        <GlassCard className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Weak topic analysis</h2>
            <Link
              href="/progress/weak-topics"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-muted transition hover:border-[#c9a84c]/40 hover:bg-white/5 hover:text-[#f0d08a]"
              aria-label="View all weak topics"
              title="View all weak topics"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="space-y-3">
            {weakPreview.length === 0 ? (
              <li className="text-sm text-muted">Complete quizzes to see weak topics.</li>
            ) : (
              weakPreview.map((t) => (
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
              ))
            )}
          </ul>
        </GlassCard>
      </div>
    </PageShell>
  );
}
