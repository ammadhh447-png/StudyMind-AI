"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { PlannerSubNav } from "@/components/planner/planner-subnav";
import { PlannerTaskList } from "@/components/planner/planner-task-list";
import {
  PlannerAddTaskForm,
  defaultPlannerAddValues,
} from "@/components/planner/planner-add-task-form";
import { GlassCard } from "@/components/ui/glass-card";
import { plannerApi } from "@/lib/api";
import { usePlannerTasks } from "@/hooks/use-planner-tasks";

export default function PlannerTodayPage() {
  const { tasks, error, setError, load, cycleStatus, editTask, deleteTask } = usePlannerTasks();
  const [draft, setDraft] = useState(defaultPlannerAddValues);
  const [adding, setAdding] = useState(false);

  const doneCount = tasks.filter((t) => t.status === "Done").length;
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
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add task");
    } finally {
      setAdding(false);
    }
  }

  return (
    <PageShell
      inset
      header={
        <TopBar title="Today's plan" subtitle="All tasks scheduled for today" />
      }
    >
      <div className="space-y-4 pb-2">
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <GlassCard className="p-4">
          <PlannerSubNav />
          <div className="mb-4 space-y-3 border-b border-white/5 pb-4">
            <div>
              <h2 className="text-sm font-medium">All tasks today</h2>
              <p className="mt-0.5 text-xs text-muted">
                {tasks.length} task{tasks.length === 1 ? "" : "s"} · {todayProgress}% complete
              </p>
            </div>
            <PlannerAddTaskForm
              className="w-full"
              value={draft}
              onChange={setDraft}
              onSubmit={() => void addTask()}
              disabled={adding}
            />
          </div>
          <PlannerTaskList
            tasks={tasks}
            emptyMessage="No tasks for today. Add one above to get started."
            onCycleStatus={(t) => void cycleStatus(t)}
            onEdit={(t, title) => editTask(t, title)}
            onDelete={(t) => deleteTask(t)}
          />
        </GlassCard>
      </div>
    </PageShell>
  );
}
