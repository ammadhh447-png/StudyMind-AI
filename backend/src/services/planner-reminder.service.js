import { PlannerTask } from "../models/PlannerTask.js";
import { emitNotification } from "../socket.js";

export function parseScheduledTime(timeStr = "09:00 AM") {
  const raw = String(timeStr || "09:00").trim();
  const ampm = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let hours = Number(ampm[1]);
    const minutes = Number(ampm[2]);
    const period = ampm[3].toUpperCase();
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return { hours, minutes };
  }
  const h24 = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) {
    return { hours: Number(h24[1]), minutes: Number(h24[2]) };
  }
  return { hours: 9, minutes: 0 };
}

export function formatScheduledTime(timeStr) {
  const { hours, minutes } = parseScheduledTime(timeStr);
  const period = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `${h12}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function taskDueDateTime(task) {
  const base = task.dueDate ? new Date(task.dueDate) : new Date();
  const { hours, minutes } = parseScheduledTime(task.scheduledTime);
  const when = new Date(base);
  when.setHours(hours, minutes, 0, 0);
  return when;
}

export function parseDueDateInput(value) {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

const LOOKBACK_MS = 2 * 60 * 1000;
const LOOKAHEAD_MS = 30 * 1000;

export async function processPlannerReminders() {
  const now = Date.now();
  const windowStart = new Date(now - LOOKBACK_MS);
  const windowEnd = new Date(now + LOOKAHEAD_MS);

  const candidates = await PlannerTask.find({
    status: { $in: ["Pending", "In Progress"] },
    reminderSent: { $ne: true },
    dueDate: {
      $gte: new Date(now - 24 * 60 * 60 * 1000),
      $lte: new Date(now + 24 * 60 * 60 * 1000),
    },
  }).limit(200);

  for (const task of candidates) {
    const when = taskDueDateTime(task);
    if (when < windowStart || when > windowEnd) continue;

    task.reminderSent = true;
    await task.save();

    const timeLabel = formatScheduledTime(task.scheduledTime);
    const statusLabel = task.status === "In Progress" ? "still in progress" : "still pending";

    emitNotification(String(task.userId), {
      action: "Study reminder",
      subject: `“${task.title}” is ${statusLabel} — scheduled for ${timeLabel}. Time to focus.`,
      href: "/planner",
      kind: "reminder",
    });
  }
}

let reminderTimer = null;

export function startPlannerReminderJob(intervalMs = 30_000) {
  if (reminderTimer) return;
  const tick = () => {
    processPlannerReminders().catch((err) => {
      console.error("Planner reminder job failed:", err.message);
    });
  };
  tick();
  reminderTimer = setInterval(tick, intervalMs);
  if (typeof reminderTimer.unref === "function") reminderTimer.unref();
}
