import type { PlannerTaskRecord } from "@/lib/api";

export const PLANNER_PREVIEW_LIMIT = 5;

export const statusVariant = {
  "In Progress": "success",
  Pending: "warning",
  Done: "muted",
} as const;

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return d;
}

export function formatTaskSchedule(task: PlannerTaskRecord) {
  const time = task.scheduledTime || "—";
  if (!task.dueDate) return time;
  const d = new Date(task.dueDate);
  if (Number.isNaN(d.getTime())) return time;
  const dateLabel = d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${dateLabel} · ${time}`;
}

export function weekDayBuckets(weekTasks: PlannerTaskRecord[]) {
  const todayStart = startOfDay(new Date());
  const weekStart = startOfWeek();

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const dayStart = startOfDay(d);
    const dayTasks = weekTasks.filter((t) => {
      if (!t.dueDate) return false;
      return startOfDay(new Date(t.dueDate)) === dayStart;
    });
    return {
      weekday: d.toLocaleDateString(undefined, { weekday: "short" }),
      weekdayLong: d.toLocaleDateString(undefined, { weekday: "long" }),
      dateLabel: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      dayNum: d.getDate(),
      count: dayTasks.length,
      tasks: dayTasks,
      isToday: dayStart === todayStart,
      isPast: dayStart < todayStart,
    };
  });
}
