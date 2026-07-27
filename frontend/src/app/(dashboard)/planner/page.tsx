"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { PlannerSubNav } from "@/components/planner/planner-subnav";
import { PlannerTaskList } from "@/components/planner/planner-task-list";
import {
  PlannerAddTaskForm,
  defaultPlannerAddValues,
} from "@/components/planner/planner-add-task-form";
import {
  PLANNER_PREVIEW_LIMIT,
  weekDayBuckets,
} from "@/components/planner/planner-utils";
import { GlassCard } from "@/components/ui/glass-card";
import { plannerApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { usePlannerTasks } from "@/hooks/use-planner-tasks";

export default function PlannerPage() {
  const { tasks, weekTasks, error, setError, load, cycleStatus, editTask, deleteTask } =
    usePlannerTasks();
  const [draft, setDraft] = useState(defaultPlannerAddValues);
  const [adding, setAdding] = useState(false);
  const [page, setPage] = useState(1);

  const doneCount = tasks.filter((t) => t.status === "Done").length;
  const inProgressCount = tasks.filter((t) => t.status === "In Progress").length;
  const pendingCount = tasks.filter((t) => t.status === "Pending").length;

  const weekDays = useMemo(() => weekDayBuckets(weekTasks), [weekTasks]);
  const maxWeekCount = Math.max(1, ...weekDays.map((d) => d.count));

  const totalPages = Math.max(1, Math.ceil(tasks.length / PLANNER_PREVIEW_LIMIT));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pageTasks = useMemo(() => {
    const start = (page - 1) * PLANNER_PREVIEW_LIMIT;
    return tasks.slice(start, start + PLANNER_PREVIEW_LIMIT);
  }, [tasks, page]);

  const todayProgress =
    tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100);

  async function addTask() {
    if (!draft.title.trim() || adding) return;
    setAdding(true);
    setError("");
    try {
      await plannerApi.create({
        title: draft.title.trim(),
        dueDate: draft.dueDate,
        scheduledTime: draft.scheduledTime,
      });
      setDraft(defaultPlannerAddValues());
      setPage(1);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add task");
    } finally {
      setAdding(false);
    }
  }

  const stats = [
    { label: "Today", value: tasks.length },
    { label: "Done", value: doneCount },
    { label: "In progress", value: inProgressCount },
    { label: "Pending", value: pendingCount },
  ];

  return (
    <PageShell
      inset
      header={
        <TopBar title="Study Planner" subtitle="Daily tasks and your week at a glance" />
      }
    >
      <div className="space-y-4 pb-2">
        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="glass-panel rounded-xl px-3 py-2.5 sm:px-4 sm:py-3"
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                {s.label}
              </p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums sm:text-2xl">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard className="lg:col-span-2">
            <PlannerSubNav />
            <div className="mb-3">
              <h2 className="text-sm font-medium">Today&apos;s plan</h2>
              <p className="mt-0.5 text-xs text-muted">
                {todayProgress}% complete · tap status to update
              </p>
            </div>

            <div className="mb-4 border-b border-white/5 pb-4">
              <PlannerAddTaskForm
                className="w-full"
                value={draft}
                onChange={setDraft}
                onSubmit={() => void addTask()}
                disabled={adding}
              />
            </div>

            <PlannerTaskList
              tasks={pageTasks}
              emptyMessage="No tasks for today. Add one above to get started."
              onCycleStatus={(t) => void cycleStatus(t)}
              onEdit={(t, title) => editTask(t, title)}
              onDelete={(t) => deleteTask(t)}
            />

            {tasks.length > PLANNER_PREVIEW_LIMIT ? (
              <div className="mt-4 flex items-center justify-end gap-2">
                <span className="mr-1 text-xs text-muted">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--panel-border)] bg-[var(--surface-solid)] text-foreground transition hover:bg-[var(--panel-hover)] disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--panel-border)] bg-[var(--surface-solid)] text-foreground transition hover:bg-[var(--panel-hover)] disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </GlassCard>

          <GlassCard>
            <h2 className="text-sm font-medium">This week</h2>
            <p className="mt-0.5 mb-4 text-xs text-muted">
              Mon–Sun · {weekTasks.length} task{weekTasks.length === 1 ? "" : "s"} · resets each new week
            </p>
            <div className="flex items-end justify-between gap-1.5">
              {weekDays.map((day) => (
                <div
                  key={`${day.weekday}-${day.dateLabel}`}
                  className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
                >
                  <span className="text-[11px] tabular-nums text-muted">
                    {day.count > 0 ? day.count : ""}
                  </span>
                  <div
                    className={cn(
                      "w-full max-w-9 rounded-md bg-[#c9a84c]/20 transition-all",
                      day.isPast && "bg-[#c9a84c]/10 opacity-50",
                      day.isToday && "bg-[#c9a84c]/45 opacity-100 ring-1 ring-[#e2b96f]/35"
                    )}
                    style={{
                      height: `${Math.max(6, (day.count / maxWeekCount) * 56)}px`,
                    }}
                    title={`${day.weekday}: ${day.count} tasks`}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-medium",
                      day.isToday ? "text-[#e2b96f]" : "text-muted"
                    )}
                  >
                    {day.weekday.slice(0, 2)}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </PageShell>
  );
}
