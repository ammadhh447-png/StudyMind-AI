import { PlannerTask } from "../models/PlannerTask.js";
import { logActivity } from "../models/Activity.js";
import {
  formatScheduledTime,
  parseDueDateInput,
} from "../services/planner-reminder.service.js";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return d;
}

function endOfWeek(date = new Date()) {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function listTasks(req, res, next) {
  try {
    let tasks = await PlannerTask.find({
      userId: req.user.id,
      dueDate: { $gte: startOfToday(), $lte: endOfToday() },
    }).sort({ scheduledTime: 1 });

    if (tasks.length === 0) {
      await PlannerTask.insertMany([
        {
          userId: req.user.id,
          title: "Review uploaded notes",
          status: "In Progress",
          scheduledTime: "10:00 AM",
          dueDate: startOfToday(),
          reminderSent: false,
        },
        {
          userId: req.user.id,
          title: "Complete an AI quiz",
          status: "Pending",
          scheduledTime: "2:00 PM",
          dueDate: startOfToday(),
          reminderSent: false,
        },
        {
          userId: req.user.id,
          title: "Flashcard revision session",
          status: "Pending",
          scheduledTime: "6:00 PM",
          dueDate: startOfToday(),
          reminderSent: false,
        },
      ]);
      tasks = await PlannerTask.find({
        userId: req.user.id,
        dueDate: { $gte: startOfToday(), $lte: endOfToday() },
      }).sort({ scheduledTime: 1 });
    }

    res.json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
}

export async function listWeekTasks(req, res, next) {
  try {
    const weekStart = startOfWeek();
    const weekEnd = endOfWeek();

    await PlannerTask.deleteMany({
      userId: req.user.id,
      dueDate: { $lt: weekStart },
    });

    const tasks = await PlannerTask.find({
      userId: req.user.id,
      dueDate: { $gte: weekStart, $lte: weekEnd },
    }).sort({ dueDate: 1, scheduledTime: 1 });

    res.json({
      success: true,
      tasks,
      week: {
        start: weekStart.toISOString(),
        end: weekEnd.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createTask(req, res, next) {
  try {
    const { title, status, scheduledTime, dueDate } = req.body;
    const task = await PlannerTask.create({
      userId: req.user.id,
      title,
      status: status || "Pending",
      scheduledTime: formatScheduledTime(scheduledTime || "09:00"),
      dueDate: parseDueDateInput(dueDate),
      reminderSent: false,
    });
    await logActivity(req.user.id, "Planner task added", task.title);
    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req, res, next) {
  try {
    const allowed = {};
    if (req.body.title !== undefined) allowed.title = req.body.title;
    if (req.body.status !== undefined) allowed.status = req.body.status;
    if (req.body.scheduledTime !== undefined) {
      allowed.scheduledTime = formatScheduledTime(req.body.scheduledTime);
      allowed.reminderSent = false;
    }
    if (req.body.dueDate !== undefined) {
      allowed.dueDate = parseDueDateInput(req.body.dueDate);
      allowed.reminderSent = false;
    }

    const task = await PlannerTask.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      allowed,
      { new: true }
    );
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req, res, next) {
  try {
    await PlannerTask.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
