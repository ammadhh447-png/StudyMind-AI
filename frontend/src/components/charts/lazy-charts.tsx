"use client";

import dynamic from "next/dynamic";

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-white/[0.06] ${className ?? "h-48 w-full"}`}
      aria-hidden
    />
  );
}

export const MiniSparkline = dynamic(
  () => import("./study-charts").then((m) => m.MiniSparkline),
  { ssr: false, loading: () => <ChartSkeleton className="h-10 w-20" /> }
);

export const ProgressRing = dynamic(
  () => import("./study-charts").then((m) => m.ProgressRing),
  { ssr: false, loading: () => <ChartSkeleton className="h-24 w-24 rounded-full" /> }
);

export const StudyOverviewDonut = dynamic(
  () => import("./study-charts").then((m) => m.StudyOverviewDonut),
  { ssr: false, loading: () => <ChartSkeleton className="h-52 w-full" /> }
);

export const WeeklyActivityChart = dynamic(
  () => import("./study-charts").then((m) => m.WeeklyActivityChart),
  { ssr: false, loading: () => <ChartSkeleton className="h-56 w-full" /> }
);

export const WeeklyStudyBar = dynamic(
  () => import("./study-charts").then((m) => m.WeeklyStudyBar),
  { ssr: false, loading: () => <ChartSkeleton className="h-56 w-full" /> }
);

export const GroupProgressOverview = dynamic(
  () => import("./study-charts").then((m) => m.GroupProgressOverview),
  { ssr: false, loading: () => <ChartSkeleton className="h-40 w-full" /> }
);
