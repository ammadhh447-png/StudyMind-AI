"use client";

import { useMemo } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { PlannerSubNav } from "@/components/planner/planner-subnav";
import { PlannerTaskList } from "@/components/planner/planner-task-list";
import { weekDayBuckets } from "@/components/planner/planner-utils";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { usePlannerTasks } from "@/hooks/use-planner-tasks";

export default function PlannerWeekPage() {
  const { weekTasks, error, cycleStatus, editTask, deleteTask } = usePlannerTasks();
  const weekDays = useMemo(() => weekDayBuckets(weekTasks), [weekTasks]);

  return (
    <PageShell
      inset
      header={
        <TopBar title="This week" subtitle="Current Mon–Sun week · previous week clears automatically" />
      }
    >
      <div className="space-y-4 pb-2">
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <GlassCard className="p-4">
          <PlannerSubNav />
          <div className="mb-4 border-b border-white/5 pb-4">
            <h2 className="text-sm font-medium">Week schedule</h2>
            <p className="mt-0.5 text-xs text-muted">
              {weekDays[0]?.dateLabel} – {weekDays[6]?.dateLabel} · {weekTasks.length} task
              {weekTasks.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="space-y-6">
            {weekDays.map((day) => (
              <section
                key={`${day.weekday}-${day.dateLabel}`}
                className={cn(day.isPast && "opacity-55")}
              >
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <h3
                    className={cn(
                      "text-sm font-medium",
                      day.isToday ? "text-[#e2b96f]" : "text-foreground"
                    )}
                  >
                    {day.weekdayLong}
                    {day.isToday ? " · Today" : ""}
                  </h3>
                  <span className="text-xs text-muted">{day.dateLabel}</span>
                </div>
                <PlannerTaskList
                  tasks={day.tasks}
                  emptyMessage="No tasks scheduled."
                  onCycleStatus={(t) => void cycleStatus(t)}
                  onEdit={(t, title) => editTask(t, title)}
                  onDelete={(t) => deleteTask(t)}
                />
              </section>
            ))}
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}
