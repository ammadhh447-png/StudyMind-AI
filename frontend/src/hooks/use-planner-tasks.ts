"use client";

import { useCallback, useEffect, useState } from "react";
import { plannerApi, type PlannerTaskRecord } from "@/lib/api";

export function usePlannerTasks() {
  const [tasks, setTasks] = useState<PlannerTaskRecord[]>([]);
  const [weekTasks, setWeekTasks] = useState<PlannerTaskRecord[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [today, week] = await Promise.all([
      plannerApi.listToday(),
      plannerApi.listWeek(),
    ]);
    setTasks(today.tasks);
    setWeekTasks(week.tasks);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [load]);

  async function cycleStatus(task: PlannerTaskRecord) {
    const order = ["Pending", "In Progress", "Done"] as const;
    const next = order[(order.indexOf(task.status) + 1) % order.length];
    await plannerApi.update(task._id, { status: next });
    await load();
  }

  async function editTask(task: PlannerTaskRecord, title: string) {
    await plannerApi.update(task._id, { title });
    await load();
  }

  async function deleteTask(task: PlannerTaskRecord) {
    await plannerApi.delete(task._id);
    await load();
  }

  return { tasks, weekTasks, error, setError, load, cycleStatus, editTask, deleteTask };
}
