"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Bot,
  CalendarDays,
  ClipboardList,
  FileText,
  GitBranch,
  Layers,
  Megaphone,
  Send,
  Upload,
  Users,
  CheckCircle2,
  Clock,
  FolderOpen,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { GroupProgressOverview, MiniSparkline } from "@/components/charts/lazy-charts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { groupsApi, type GroupDetail } from "@/lib/api";
import { buildInviteJoinUrl } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";

function PanelHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/8 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        {subtitle ? <p className="text-xs text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tint: string;
}) {
  return (
    <div className="glass-panel flex h-[92px] items-center gap-3 rounded-2xl px-4 py-3">
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tint)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="text-2xl font-bold tabular-nums leading-tight">{value}</p>
      </div>
    </div>
  );
}

function memberInitials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function taskBadge(status: string) {
  if (status === "Done") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  if (status === "In Progress") return "bg-amber-500/20 text-amber-200 border-amber-500/30";
  return "bg-[#c9a84c]/15 text-[#f0d08a] border-[#c9a84c]/30";
}

function taskBadgeLabel(status: string) {
  if (status === "Done") return "Completed";
  return status;
}

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const h = Math.floor(d / 3600000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function isGroupDetailActive(g: GroupDetail) {
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const since = Date.now() - weekMs;
  if (g.updatedAt && new Date(g.updatedAt).getTime() >= since) return true;
  if (g.tasks.some((t) => t.status !== "Done")) return true;
  if (g.messages.some((m) => new Date(m.createdAt).getTime() >= since)) return true;
  return false;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function GroupDashboard({ groupId }: { groupId: string }) {
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [error, setError] = useState("");
  const [chat, setChat] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceBody, setAnnounceBody] = useState("");
  const [plannerTitle, setPlannerTitle] = useState("");
  const [plannerWhen, setPlannerWhen] = useState("");
  const [showAllActivity, setShowAllActivity] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { group: data } = await groupsApi.get(groupId);
    setGroup(data);
    if (data.inviteCode) {
      setInviteUrl(buildInviteJoinUrl(data.inviteCode));
      return;
    }
    try {
      const inv = await groupsApi.invite(groupId);
      setInviteUrl(buildInviteJoinUrl(inv.inviteCode) || inv.inviteUrl);
    } catch {
      setInviteUrl("");
    }
  }, [groupId]);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load group"));
  }, [load]);

  const isAdmin = group?.members.find((m) => m.userId === user?.id)?.role === "admin";

  async function sendChat() {
    if (!chat.trim()) return;
    const { messages } = await groupsApi.sendMessage(groupId, chat.trim());
    setGroup((g) => (g ? { ...g, messages } : g));
    setChat("");
  }

  async function copyInvite() {
    const url =
      inviteUrl ||
      (group?.inviteCode ? buildInviteJoinUrl(group.inviteCode) : "");
    if (!url) {
      setError("Invite link is not ready yet. Refresh the page and try again.");
      return;
    }
    const shareTitle = group?.name ? `Study group: ${group.name}` : "StudyMind AI";
    const shareText = group?.name ? `Join my study group on StudyMind AI: ${group.name}` : "Join my study group on StudyMind AI";

    try {
      const canShare = typeof navigator !== "undefined" && typeof (navigator as any).share === "function";
      if (canShare) {
        await (navigator as any).share({ title: shareTitle, text: shareText, url });
        return;
      }
    } catch {}

    try {
      await navigator.clipboard.writeText(url);
      setInviteCopied(true);
      window.setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard");
    }
  }

  if (error) return <p className="px-0.5 text-sm text-red-400">{error}</p>;
  if (!group) return <p className="px-0.5 text-sm text-muted">Loading group...</p>;

  const g = group;
  const groupIsActive = isGroupDetailActive(g);
  const sparkData = [
    Math.max(0, g.stats.progress - 18),
    Math.max(0, g.stats.progress - 12),
    Math.max(0, g.stats.progress - 6),
    g.stats.progress,
    Math.min(100, g.stats.progress + 4),
  ];

  return (
    <div className="mx-auto w-full max-w-[1680px] space-y-5 pb-3 px-0 sm:px-1">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-muted">
            <Settings2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight md:text-[1.65rem]">{g.name}</h1>
              {groupIsActive ? (
                <span className="inline-flex items-center rounded-full border border-emerald-500/35 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                  Active
                </span>
              ) : null}
            </div>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
              {g.description || "Master concepts together and ace your exams!"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" size="sm" className="h-9 px-4" onClick={() => void copyInvite()}>
            <Users className="h-4 w-4" />
            {inviteCopied ? "Copied!" : "Invite members"}
          </Button>
          <Button
            size="sm"
            className="h-9 px-4"
            onClick={() => {
              setTaskTitle("");
              setTaskDue("");
              document.getElementById("group-task-panel")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Create task
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12 xl:gap-5">
        <div className="xl:col-span-2">
          <StatCard label="Members" value={g.stats.members} icon={Users} tint="bg-[#c9a84c]/90" />
        </div>
        <div className="xl:col-span-2">
          <StatCard label="Files shared" value={g.stats.files} icon={FolderOpen} tint="bg-emerald-600/90" />
        </div>
        <div className="xl:col-span-2">
          <StatCard
            label="Tasks completed"
            value={g.stats.tasksDone}
            icon={CheckCircle2}
            tint="bg-[#a07830]/90"
          />
        </div>
        <div className="xl:col-span-2">
          <StatCard label="Quizzes taken" value={g.stats.quizzes} icon={ClipboardList} tint="bg-rose-600/90" />
        </div>
        <div className="glass-panel flex h-[92px] flex-col justify-center rounded-2xl px-4 py-3 sm:col-span-2 xl:col-span-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Group progress</p>
              <p className="text-2xl font-bold tabular-nums">{g.stats.progress}%</p>
            </div>
            <MiniSparkline data={sparkData} />
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#c9a84c] to-[#a07830] transition-all"
              style={{ width: `${Math.min(100, g.stats.progress)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12 xl:gap-6">
        <div className="flex min-w-0 flex-col gap-4 xl:col-span-9">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
            <section className="glass-panel flex flex-col rounded-2xl">
              <PanelHeader title="Group chat" subtitle="Discussions & questions" />
              <div className="space-y-3 px-4 py-3">
                {g.messages.map((m, i) => {
                  const self = m.userId === user?.id;
                  return (
                    <div key={`${m.createdAt}-${i}`} className={cn("flex gap-2", self && "flex-row-reverse")}>
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                          self ? "bg-[#c9a84c]/80" : "bg-[#5a9abf]/70"
                        )}
                      >
                        {memberInitials(m.userName || "?")}
                      </div>
                      <div className={cn("max-w-[85%] min-w-0", self && "text-right")}>
                        <div
                          className={cn(
                            "flex flex-wrap items-center gap-2 text-[11px] text-muted",
                            self && "justify-end"
                          )}
                        >
                          <span className="font-semibold text-foreground/90">{m.userName}</span>
                          {m.role === "admin" ? (
                            <span className="rounded-md bg-[#c9a84c]/25 px-1.5 py-0.5 text-[10px] text-[#f0d08a]">
                              Admin
                            </span>
                          ) : null}
                          <span>{timeAgo(m.createdAt)}</span>
                        </div>
                        <p
                          className={cn(
                            "mt-1 inline-block rounded-2xl px-3 py-2 text-sm",
                            self ? "bg-[#c9a84c]/30 text-left" : "bg-white/[0.06]"
                          )}
                        >
                          {m.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex shrink-0 gap-2 border-t border-white/8 p-3">
                <Input
                  className="h-10"
                  placeholder="Type a message..."
                  value={chat}
                  onChange={(e) => setChat(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void sendChat()}
                />
                <Button size="icon" className="h-10 w-10 shrink-0" onClick={() => void sendChat()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </section>

            <section className="glass-panel flex flex-col rounded-2xl">
              <PanelHeader
                title="Shared notes"
                subtitle="PDF, DOCX, PPT, images"
                action={
                  <>
                    <Button size="sm" variant="secondary" className="h-8" onClick={() => fileRef.current?.click()}>
                      <Upload className="h-3.5 w-3.5" />
                      Upload
                    </Button>
                    <input
                      ref={fileRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        void groupsApi.uploadFile(groupId, f).then(({ files }) => {
                          setGroup((prev) =>
                            prev ? { ...prev, files, stats: { ...prev.stats, files: files.length } } : prev
                          );
                        });
                        e.target.value = "";
                      }}
                    />
                  </>
                }
              />
              <ul className="space-y-2 px-3 py-2">
                {g.files.length === 0 ? (
                  <li className="px-1 py-4 text-center text-xs text-muted">No files yet. Share notes with the group.</li>
                ) : (
                  g.files.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
                        <FileText className="h-4 w-4 text-red-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <a href={f.url} target="_blank" rel="noreferrer" className="block truncate text-sm font-medium hover:underline">
                          {f.name}
                        </a>
                        <p className="truncate text-[11px] text-muted">
                          {f.uploaderName}
                          {f.size ? ` · ${formatFileSize(f.size)}` : ""}
                        </p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section
              id="group-task-panel"
              className="glass-panel flex flex-col rounded-2xl"
            >
              <PanelHeader title="Upcoming tasks" subtitle="Assignments & deadlines" />
              <ul className="space-y-2 px-3 py-2">
                {g.tasks.length === 0 ? (
                  <li className="px-1 py-4 text-center text-xs text-muted">No tasks yet. Create one below.</li>
                ) : (
                  g.tasks.map((t) => (
                    <li
                      key={t._id}
                      className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
                    >
                      <button
                        type="button"
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                          t.status === "Done"
                            ? "border-emerald-400 bg-emerald-500/30"
                            : "border-white/25 bg-transparent"
                        )}
                        onClick={() =>
                          void groupsApi
                            .updateTask(groupId, t._id, { status: t.status === "Done" ? "Pending" : "Done" })
                            .then(({ tasks }) => setGroup((prev) => (prev ? { ...prev, tasks } : prev)))
                        }
                      >
                        {t.status === "Done" ? <CheckCircle2 className="h-3 w-3 text-emerald-200" /> : null}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-sm font-medium", t.status === "Done" && "text-muted line-through")}>
                            {t.title}
                          </p>
                          <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px]", taskBadge(t.status))}>
                            {taskBadgeLabel(t.status)}
                          </span>
                        </div>
                        {t.dueDate ? (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                            <Clock className="h-3 w-3" />
                            {t.dueDate}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))
                )}
              </ul>
              <div className="shrink-0 space-y-2 border-t border-white/8 p-3">
                <Input placeholder="Task title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                <Input placeholder="Due date (e.g. Fri 7 PM)" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!taskTitle.trim()}
                  onClick={() =>
                    void groupsApi.createTask(groupId, { title: taskTitle, dueDate: taskDue }).then(({ tasks }) => {
                      setGroup((prev) => (prev ? { ...prev, tasks } : prev));
                      setTaskTitle("");
                      setTaskDue("");
                    })
                  }
                >
                  Add task
                </Button>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                href: `/assistant?group=${groupId}`,
                label: "AI chat on group notes",
                icon: Bot,
                btn: "Start chat",
                iconBg: "bg-emerald-500/20",
                iconColor: "text-emerald-300",
              },
              {
                href: `/quizzes?group=${groupId}`,
                label: "Group quiz",
                icon: ClipboardList,
                btn: "Start quiz",
                iconBg: "bg-[#c9a84c]/20",
                iconColor: "text-[#e2b96f]",
              },
              {
                href: `/flashcards?group=${groupId}`,
                label: "Flashcards",
                icon: Layers,
                btn: "View flashcards",
                iconBg: "bg-amber-500/20",
                iconColor: "text-amber-200",
              },
              {
                href: `/mind-maps?group=${groupId}`,
                label: "Mind maps",
                icon: GitBranch,
                btn: "View mind maps",
                iconBg: "bg-sky-500/20",
                iconColor: "text-sky-300",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="glass-panel flex h-[168px] flex-col rounded-2xl p-4 transition hover:border-[#c9a84c]/35"
              >
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", item.iconBg)}>
                  <item.icon className={cn("h-6 w-6", item.iconColor)} />
                </div>
                <p className="mt-3 line-clamp-2 text-sm font-semibold leading-snug">{item.label}</p>
                <span className="mt-auto inline-flex h-8 w-full items-center justify-center rounded-lg border border-[#c9a84c]/25 bg-[#c9a84c]/10 text-xs font-medium text-[#f0d08a]">
                  {item.btn}
                </span>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <section className="glass-panel rounded-2xl p-4 lg:col-span-7">
              <p className="text-sm font-semibold">Group study planner</p>
              <p className="text-xs text-muted">Scheduled sessions & topics</p>
              <ul className="mt-4 space-y-2">
                {g.plannerItems.length === 0 ? (
                  <li className="text-xs text-muted">Add study sessions below.</li>
                ) : (
                  g.plannerItems.slice(0, 6).map((p, i) => (
                    <li
                      key={i}
                      className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm"
                    >
                      <CalendarDays className="h-4 w-4 shrink-0 text-[#e2b96f]" />
                      <span className="font-semibold text-[#f0d08a]">{p.scheduledAt || "TBD"}</span>
                      <span className="text-muted">— {p.title}</span>
                    </li>
                  ))
                )}
              </ul>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Input placeholder="Session title" value={plannerTitle} onChange={(e) => setPlannerTitle(e.target.value)} />
                <Input placeholder="When" value={plannerWhen} onChange={(e) => setPlannerWhen(e.target.value)} />
                <Button
                  size="sm"
                  className="shrink-0 sm:px-6"
                  disabled={!plannerTitle.trim()}
                  onClick={() =>
                    void groupsApi.addPlannerItem(groupId, { title: plannerTitle, scheduledAt: plannerWhen }).then(({ plannerItems }) => {
                      setGroup((prev) => (prev ? { ...prev, plannerItems } : prev));
                      setPlannerTitle("");
                      setPlannerWhen("");
                    })
                  }
                >
                  Add
                </Button>
              </div>
            </section>

            <section className="glass-panel rounded-2xl p-4 lg:col-span-5">
              <p className="text-sm font-semibold">Group progress overview</p>
              <p className="text-xs text-muted">Tasks, quizzes, notes & members</p>
              <div className="mt-2">
                <GroupProgressOverview
                  progress={g.stats.progress}
                  tasksDone={g.stats.tasksDone}
                  tasksTotal={g.stats.tasksTotal}
                  quizzes={g.stats.quizzes}
                  files={g.stats.files}
                  members={g.stats.members}
                />
              </div>
            </section>
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-4 xl:col-span-3 xl:border-l xl:border-white/8 xl:pl-6">
          <section className="glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Members ({g.stats.members})</p>
              {isAdmin ? (
                <Button variant="ghost" size="sm" className="h-7 text-xs text-[#e2b96f]" onClick={() => void copyInvite()}>
                  Manage
                </Button>
              ) : null}
            </div>
            <ul className="mt-3 space-y-1">
              {g.members.map((m, i) => (
                <li key={m.userId} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.04]">
                  <div className="relative">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#c9a84c]/80 to-[#8a6420]/80 text-xs font-bold">
                      {memberInitials(m.name)}
                    </div>
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#12162a]",
                        i % 3 === 0 ? "bg-emerald-400" : "bg-white/25"
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.name}</p>
                    <p className="text-[11px] capitalize text-muted">{m.role === "admin" ? "Group admin" : m.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="glass-panel rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-[#e2b96f]" />
              <p className="text-sm font-semibold">Announcements</p>
            </div>
            <ul className="mt-3 space-y-2">
              {g.announcements.length === 0 ? (
                <li className="text-xs text-muted">No announcements yet.</li>
              ) : (
                g.announcements.slice(0, 3).map((a, i) => (
                  <li key={i} className="rounded-xl border border-[#c9a84c]/25 bg-[#c9a84c]/10 p-3">
                    <p className="text-sm font-semibold">{a.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{a.body}</p>
                    <p className="mt-2 text-[10px] text-muted">
                      {a.authorName} · {timeAgo(a.createdAt)}
                    </p>
                  </li>
                ))
              )}
            </ul>
            {isAdmin ? (
              <div className="mt-3 space-y-2 border-t border-white/8 pt-3">
                <Input placeholder="Title" value={announceTitle} onChange={(e) => setAnnounceTitle(e.target.value)} />
                <Textarea placeholder="Message" value={announceBody} onChange={(e) => setAnnounceBody(e.target.value)} />
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!announceTitle.trim()}
                  onClick={() =>
                    void groupsApi.addAnnouncement(groupId, { title: announceTitle, body: announceBody }).then(({ announcements }) => {
                      setGroup((prev) => (prev ? { ...prev, announcements } : prev));
                      setAnnounceTitle("");
                      setAnnounceBody("");
                    })
                  }
                >
                  Post announcement
                </Button>
              </div>
            ) : null}
          </section>

          <section className="glass-panel flex min-h-[240px] flex-col rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Activity feed</p>
              {g.activities.length > 5 ? (
                <button
                  type="button"
                  onClick={() => setShowAllActivity((v) => !v)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-muted transition hover:border-[#c9a84c]/40 hover:bg-white/5 hover:text-[#f0d08a]"
                  aria-label={showAllActivity ? "Show less activity" : "View all activity"}
                  title={showAllActivity ? "Show less" : "View all activity"}
                >
                  <ArrowUpRight className={cn("h-4 w-4 transition", showAllActivity && "rotate-90")} />
                </button>
              ) : null}
            </div>
            <ul className="mt-3 space-y-3">
              {g.activities.length === 0 ? (
                <li className="text-xs text-muted">No recent activity.</li>
              ) : (
                (showAllActivity ? g.activities : g.activities.slice(0, 5)).map((a, i) => (
                  <li key={i} className="border-l-2 border-[#c9a84c]/30 pl-3 text-xs">
                    <p>
                      <span className="font-semibold text-foreground/95">{a.userName}</span>{" "}
                      <span className="text-muted">{a.action}</span>
                    </p>
                    <p className="text-foreground/80">{a.subject}</p>
                    <p className="mt-0.5 text-[10px] text-muted">{timeAgo(a.createdAt)}</p>
                  </li>
                ))
              )}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
