"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Bot,
  Flame,
  Layers,
  MessageSquare,
  Upload,
  Zap,
} from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import {
  MiniSparkline,
  ProgressRing,
  StudyOverviewDonut,
  WeeklyActivityChart,
  WeeklyStudyBar,
} from "@/components/charts/lazy-charts";
import { progressApi } from "@/lib/api";

const quickActions = [
  { label: "Upload Notes", icon: Upload, href: "/notes" },
  { label: "AI Chat", icon: MessageSquare, href: "/assistant" },
  { label: "Create Quiz", icon: Zap, href: "/quizzes" },
  { label: "Flashcards", icon: Layers, href: "/flashcards" },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function DashboardPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof progressApi.get>> | null>(null);

  useEffect(() => {
    progressApi.get().then(setData).catch(() => {});
  }, []);

  const stats = data?.stats;
  const recentActivity = data?.recentActivity ?? [];
  const recentPreview = recentActivity.slice(0, 5);
  const trends = data?.trends;
  const cards = stats
    ? [
        { label: "Study Hours", value: `${stats.studyHours}h`, delta: "Live", trend: trends?.studyHours.map((x) => x.value) ?? [] },
        { label: "Quizzes Completed", value: String(stats.quizzesCompleted), delta: "Live", trend: trends?.quizzesCompleted.map((x) => x.value) ?? [] },
        { label: "Flashcards Studied", value: String(stats.flashcardsStudied), delta: "Live", trend: trends?.flashcardsStudied.map((x) => x.value) ?? [] },
        { label: "Avg. Quiz Score", value: `${stats.averageScore}%`, delta: "Live", trend: trends?.averageScore.map((x) => x.value) ?? [] },
        { label: "Weak Topics", value: String(stats.weakTopics), delta: "Tracked", trend: trends?.averageScore.map((x) => (x.value < 70 && x.value > 0 ? 1 : 0)) ?? [] },
      ]
    : [];

  return (
    <PageShell inset header={<TopBar title="Dashboard" subtitle="Your learning overview at a glance" />}>
      <div className="mx-auto w-full max-w-[1680px] space-y-4 pb-2">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((stat) => (
          <GlassCard key={stat.label} className="p-4">
            <p className="text-xs text-muted">{stat.label}</p>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-emerald-400">{stat.delta}</p>
              </div>
              <MiniSparkline data={stat.trend} />
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <GlassCard className="p-4 xl:col-span-1">
          <h2 className="mb-3 text-sm font-medium">Study Progress</h2>
          <div className="flex justify-center scale-90">
            <ProgressRing value={stats?.overallProgress || 0} />
          </div>
        </GlassCard>
        <GlassCard className="p-4 xl:col-span-2">
          <h2 className="mb-2 text-sm font-medium">Weekly Activity</h2>
          <WeeklyActivityChart data={trends?.activity} />
        </GlassCard>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <GlassCard className="p-4">
          <h2 className="mb-2 text-sm font-medium">Study Overview</h2>
          <StudyOverviewDonut data={data?.overviewBreakdown} />
        </GlassCard>
        <GlassCard className="relative flex min-h-[220px] items-center justify-center overflow-hidden p-6 lg:col-span-2">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#c9a84c]/10 via-transparent to-transparent" />
          <div className="relative z-10 flex max-w-md flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c9a84c]/20 text-[#e2b96f]">
              <Bot className="h-6 w-6" />
            </div>
            <h2 className="text-base font-semibold">AI Assistant</h2>
            <p className="mt-2 text-sm text-muted">
              Ask questions about your uploaded notes and get instant explanations.
            </p>
            <Button asChild className="mt-5">
              <Link href="/assistant">
                <Bot className="h-4 w-4" />
                Start Chat
              </Link>
            </Button>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map(({ label, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <GlassCard className="flex items-center gap-3 transition hover:border-[#c9a84c]/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9a84c]/20">
                <Icon className="h-5 w-5 text-[#e2b96f]" />
              </div>
              <span className="text-sm font-medium">{label}</span>
            </GlassCard>
          </Link>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <GlassCard className="p-4 lg:col-span-2">
          <h2 className="mb-2 text-sm font-medium">Weekly Study Time</h2>
          <WeeklyStudyBar data={trends?.studyTime} />
        </GlassCard>
        <GlassCard className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-400" />
            <h2 className="text-sm font-medium">Study Streak</h2>
          </div>
          <p className="text-3xl font-bold">{Math.min(7, stats?.notesCount || 0)} days</p>
        </GlassCard>
      </div>

      <GlassCard className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium">Recent Activity</h2>
          <Link
            href="/activity"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-muted transition hover:border-[#c9a84c]/40 hover:bg-white/5 hover:text-[#f0d08a]"
            aria-label="View all activity"
            title="View all activity"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <ul className="space-y-3">
          {recentPreview.length === 0 ? (
            <li className="text-sm text-muted">Activity appears as you study.</li>
          ) : (
            recentPreview.map((item) => (
              <li
                key={`${item.subject}-${item.time}`}
                className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm">{item.action}</p>
                  <p className="text-xs text-muted">{item.subject}</p>
                </div>
                <span className="text-xs text-muted">{timeAgo(item.time)}</span>
              </li>
            ))
          )}
        </ul>
      </GlassCard>
      </div>
    </PageShell>
  );
}
