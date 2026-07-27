import crypto from "crypto";
import { StudyGroup } from "../models/StudyGroup.js";
import { User } from "../models/User.js";
import { storeFile } from "../services/storage.service.js";
import { emitNotificationToUsers } from "../socket.js";

function isMember(group, userId) {
  return group.memberRoles?.some((m) => String(m.userId) === String(userId));
}

function userRole(group, userId) {
  const row = group.memberRoles?.find((m) => String(m.userId) === String(userId));
  return row?.role || "member";
}

function isGroupActive(group) {
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const since = Date.now() - weekMs;
  if (new Date(group.updatedAt).getTime() >= since) return true;
  const tasks = group.tasks || [];
  if (tasks.some((t) => t.status !== "Done")) return true;
  const messages = group.messages || [];
  if (messages.some((m) => new Date(m.createdAt).getTime() >= since)) return true;
  return false;
}

async function logActivity(group, userName, action, subject) {
  group.activities.unshift({
    action,
    subject,
    userName,
    createdAt: new Date(),
  });
  group.activities = group.activities.slice(0, 40);
}

function groupMemberIds(group) {
  return (group.memberRoles || []).map((m) => String(m.userId));
}

function notifyGroup(group, senderId, notification) {
  emitNotificationToUsers(groupMemberIds(group), notification, senderId);
}

async function hydrateMembers(group) {
  const ids = group.memberRoles?.map((m) => m.userId) ?? [];
  const users = await User.find({ _id: { $in: ids } }).select("name email avatar");
  const byId = new Map(users.map((u) => [String(u._id), u]));
  return (group.memberRoles ?? []).map((m) => {
    const u = byId.get(String(m.userId));
    return {
      userId: String(m.userId),
      name: u?.name || "Member",
      email: u?.email,
      avatar: u?.avatar,
      role: m.role,
      joinedAt: m.joinedAt,
    };
  });
}

function groupStats(group) {
  const tasks = group.tasks || [];
  const done = tasks.filter((t) => t.status === "Done").length;
  const files = group.files?.length || 0;
  const quizzes = group.quizScores?.length || 0;
  const members = group.memberRoles?.length || 0;
  const progress =
    tasks.length === 0
      ? Math.min(100, Math.round(members * 8 + files * 3 + quizzes * 5))
      : Math.round((done / tasks.length) * 100);
  return { members, files, tasksDone: done, tasksTotal: tasks.length, quizzes, progress };
}

async function formatGroupDetail(group) {
  const members = await hydrateMembers(group);
  const stats = groupStats(group);
  const leaderboard = [...(group.quizScores || [])]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((s) => ({
      userName: s.userName,
      quizTitle: s.quizTitle,
      score: s.score,
      createdAt: s.createdAt,
    }));

  return {
    _id: group._id,
    name: group.name,
    description: group.description,
    inviteCode: group.inviteCode,
    createdBy: group.createdBy,
    members,
    stats,
    messages: (group.messages || []).slice(-80),
    announcements: group.announcements || [],
    files: group.files || [],
    tasks: group.tasks || [],
    plannerItems: group.plannerItems || [],
    activities: group.activities || [],
    leaderboard,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
}

async function migrateLegacyMembers(group) {
  if (group.memberRoles?.length) return;
  const legacy = group.members || [];
  if (!legacy.length) return;
  group.memberRoles = legacy.map((id) => ({
    userId: id,
    role: String(id) === String(group.createdBy) ? "admin" : "member",
  }));
  await group.save();
}

async function ensureInviteCode(group) {
  if (group.inviteCode) return group.inviteCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    group.inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    try {
      await group.save();
      return group.inviteCode;
    } catch (err) {
      if (err?.code !== 11000) throw err;
    }
  }
  throw new Error("Could not generate invite code");
}

export async function listGroups(req, res, next) {
  try {
    const legacy = await StudyGroup.find({
      $or: [{ memberRoles: { $size: 0 } }, { memberRoles: { $exists: false } }],
      members: { $exists: true, $ne: [] },
    });
    for (const g of legacy) {
      await migrateLegacyMembers(g);
    }

    const groups = await StudyGroup.find({
      "memberRoles.userId": req.user.id,
    }).sort({ updatedAt: -1 });

    res.json({
      success: true,
      groups: groups.map((g) => ({
        _id: g._id,
        name: g.name,
        description: g.description,
        members: g.memberRoles?.length || 0,
        unread: 0,
        role: userRole(g, req.user.id),
        isActive: isGroupActive(g),
        updatedAt: g.updatedAt,
        ...groupStats(g),
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function getGroup(req, res, next) {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    await migrateLegacyMembers(group);
    await ensureInviteCode(group);
    if (!isMember(group, req.user.id)) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    res.json({ success: true, group: await formatGroupDetail(group) });
  } catch (err) {
    next(err);
  }
}

export async function createGroup(req, res, next) {
  try {
    const { name, description } = req.body;
    const user = await User.findById(req.user.id);
    const group = await StudyGroup.create({
      name: name?.trim() || "New Study Group",
      description: description?.trim() || "",
      createdBy: req.user.id,
      memberRoles: [{ userId: req.user.id, role: "admin" }],
      messages: [],
      activities: [
        {
          action: "Created group",
          subject: name || "New Study Group",
          userName: user?.name || "Admin",
          createdAt: new Date(),
        },
      ],
    });
    res.status(201).json({ success: true, group: await formatGroupDetail(group) });
  } catch (err) {
    next(err);
  }
}

export async function joinGroup(req, res, next) {
  try {
    const code = String(req.body.inviteCode || "")
      .trim()
      .toUpperCase();
    if (!code) {
      return res.status(400).json({ success: false, message: "Invite code required" });
    }
    const group = await StudyGroup.findOne({ inviteCode: code });
    if (!group) {
      return res.status(404).json({ success: false, message: "Invalid invite code" });
    }
    if (isMember(group, req.user.id)) {
      return res.json({ success: true, group: await formatGroupDetail(group) });
    }
    const user = await User.findById(req.user.id);
    group.memberRoles.push({ userId: req.user.id, role: "member" });
    await logActivity(group, user?.name || "Member", "Joined group", group.name);
    await group.save();
    res.json({ success: true, group: await formatGroupDetail(group) });
  } catch (err) {
    next(err);
  }
}

export async function getInviteLink(req, res, next) {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group || !isMember(group, req.user.id)) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    await ensureInviteCode(group);
    const base = process.env.CLIENT_URL || "http://localhost:3000";
    res.json({
      success: true,
      inviteCode: group.inviteCode,
      inviteUrl: `${base}/groups/join?code=${encodeURIComponent(group.inviteCode)}`,
    });
  } catch (err) {
    next(err);
  }
}

export async function postMessage(req, res, next) {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: "Message required" });
    }
    const user = await User.findById(req.user.id);
    const group = await StudyGroup.findById(req.params.id);
    if (!group || !isMember(group, req.user.id)) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    const role = userRole(group, req.user.id);
    group.messages.push({
      userId: req.user.id,
      userName: user?.name || "Student",
      role,
      text: text.trim(),
    });
    await logActivity(group, user?.name || "Member", "Posted in chat", text.trim().slice(0, 60));
    await group.save();
    notifyGroup(group, req.user.id, {
      action: "New group message",
      subject: `${user?.name || "Someone"} in ${group.name}`,
      href: `/groups/${group._id}`,
    });
    res.json({ success: true, messages: group.messages.slice(-80) });
  } catch (err) {
    next(err);
  }
}

export async function postAnnouncement(req, res, next) {
  try {
    const { title, body } = req.body;
    const group = await StudyGroup.findById(req.params.id);
    if (!group || !isMember(group, req.user.id)) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    if (userRole(group, req.user.id) !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }
    const user = await User.findById(req.user.id);
    group.announcements.unshift({
      title: title?.trim() || "Announcement",
      body: body?.trim() || "",
      authorId: req.user.id,
      authorName: user?.name || "Admin",
      pinned: true,
    });
    await logActivity(group, user?.name || "Admin", "Announcement", title || "Update");
    await group.save();
    notifyGroup(group, req.user.id, {
      action: "Group announcement",
      subject: title?.trim() || "New announcement",
      href: `/groups/${group._id}`,
    });
    res.json({ success: true, announcements: group.announcements });
  } catch (err) {
    next(err);
  }
}

export async function uploadGroupFile(req, res, next) {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group || !isMember(group, req.user.id)) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "File required" });
    }
    const user = await User.findById(req.user.id);
    const stored = await storeFile(req.file.buffer, req.file.originalname, req.file.mimetype);
    const ext = req.file.originalname.split(".").pop()?.toUpperCase() || "FILE";
    group.files.unshift({
      name: req.file.originalname,
      fileType: ext,
      size: req.file.size,
      url: stored.url,
      uploadedBy: req.user.id,
      uploaderName: user?.name || "Member",
    });
    await logActivity(group, user?.name || "Member", "Uploaded file", req.file.originalname);
    await group.save();
    notifyGroup(group, req.user.id, {
      action: "File shared",
      subject: req.file.originalname,
      href: `/groups/${group._id}`,
    });
    res.json({ success: true, files: group.files });
  } catch (err) {
    next(err);
  }
}

export async function createTask(req, res, next) {
  try {
    const { title, dueDate, status, assignedTo } = req.body;
    const group = await StudyGroup.findById(req.params.id);
    if (!group || !isMember(group, req.user.id)) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    const user = await User.findById(req.user.id);
    group.tasks.unshift({
      title: title?.trim() || "New task",
      dueDate: dueDate || "",
      status: status || "Pending",
      assignedTo: assignedTo || "",
      createdBy: req.user.id,
    });
    await logActivity(group, user?.name || "Member", "Created task", title || "Task");
    await group.save();
    res.json({ success: true, tasks: group.tasks });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req, res, next) {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group || !isMember(group, req.user.id)) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    const task = group.tasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    const { title, dueDate, status, assignedTo } = req.body;
    if (title !== undefined) task.title = title;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (status !== undefined) task.status = status;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    await group.save();
    res.json({ success: true, tasks: group.tasks });
  } catch (err) {
    next(err);
  }
}

export async function addPlannerItem(req, res, next) {
  try {
    const { title, topic, scheduledAt } = req.body;
    const group = await StudyGroup.findById(req.params.id);
    if (!group || !isMember(group, req.user.id)) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    const user = await User.findById(req.user.id);
    group.plannerItems.unshift({
      title: title?.trim() || "Study session",
      topic: topic?.trim() || "",
      scheduledAt: scheduledAt || "",
    });
    await logActivity(group, user?.name || "Member", "Planner update", title || "Session");
    await group.save();
    res.json({ success: true, plannerItems: group.plannerItems });
  } catch (err) {
    next(err);
  }
}

export async function recordQuizScore(req, res, next) {
  try {
    const { quizTitle, score } = req.body;
    const group = await StudyGroup.findById(req.params.id);
    if (!group || !isMember(group, req.user.id)) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    const user = await User.findById(req.user.id);
    group.quizScores.unshift({
      userId: req.user.id,
      userName: user?.name || "Member",
      quizTitle: quizTitle || "Group quiz",
      score: Number(score) || 0,
    });
    await logActivity(
      group,
      user?.name || "Member",
      "Quiz completed",
      `${quizTitle || "Quiz"} (${score}%)`
    );
    await group.save();
    res.json({ success: true, leaderboard: group.quizScores.slice(0, 10) });
  } catch (err) {
    next(err);
  }
}

export async function deleteGroup(req, res, next) {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    await migrateLegacyMembers(group);
    if (!isMember(group, req.user.id)) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    const role = userRole(group, req.user.id);
    if (role === "admin") {
      await StudyGroup.findByIdAndDelete(req.params.id);
      return res.json({ success: true, removed: "group" });
    }
    group.memberRoles = (group.memberRoles || []).filter(
      (m) => String(m.userId) !== String(req.user.id)
    );
    await group.save();
    res.json({ success: true, removed: "membership" });
  } catch (err) {
    next(err);
  }
}
