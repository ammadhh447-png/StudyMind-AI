"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PlannerTaskRecord } from "@/lib/api";
import { cn } from "@/lib/utils";
import { statusVariant, formatTaskSchedule } from "@/components/planner/planner-utils";

type PlannerTaskListProps = {
  tasks: PlannerTaskRecord[];
  emptyMessage: string;
  onCycleStatus: (task: PlannerTaskRecord) => void;
  onEdit?: (task: PlannerTaskRecord, title: string) => void | Promise<void>;
  onDelete?: (task: PlannerTaskRecord) => void | Promise<void>;
};

function TaskMenu({
  onEdit,
  onDelete,
  disabled,
}: {
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Task options"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--panel-border)] bg-[var(--surface-solid)] text-foreground shadow-sm transition hover:bg-[var(--panel-hover)] disabled:opacity-50"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-30 mt-1 min-w-[8.5rem] overflow-hidden rounded-lg border border-[var(--dropdown-border)] bg-[var(--dropdown-bg)] py-1 shadow-xl">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition hover:bg-[var(--panel-hover)]"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 transition hover:bg-red-500/10"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function PlannerTaskList({
  tasks,
  emptyMessage,
  onCycleStatus,
  onEdit,
  onDelete,
}: PlannerTaskListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  if (tasks.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">{emptyMessage}</p>;
  }

  async function saveEdit(task: PlannerTaskRecord) {
    const title = editTitle.trim();
    if (!title || !onEdit) {
      setEditingId(null);
      return;
    }
    if (title === task.title) {
      setEditingId(null);
      return;
    }
    setBusyId(task._id);
    try {
      await onEdit(task, title);
      setEditingId(null);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ul className="divide-y divide-white/5">
      {tasks.map((task) => {
        const editing = editingId === task._id;
        return (
          <li
            key={task._id}
            className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            {editing ? (
              <form
                className="flex min-w-0 flex-1 items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveEdit(task);
                }}
              >
                <Input
                  className="h-8 flex-1 text-sm"
                  value={editTitle}
                  autoFocus
                  disabled={busyId === task._id}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 shrink-0"
                  disabled={busyId === task._id || !editTitle.trim()}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 shrink-0"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </Button>
              </form>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate font-medium",
                      task.status === "Done" && "text-muted line-through"
                    )}
                  >
                    {task.title}
                  </p>
                  <p className="text-xs text-muted">{formatTaskSchedule(task)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/40"
                    onClick={() => onCycleStatus(task)}
                  >
                    <Badge variant={statusVariant[task.status]}>{task.status}</Badge>
                  </button>
                  {onEdit || onDelete ? (
                    <TaskMenu
                      disabled={busyId === task._id}
                      onEdit={() => {
                        setEditingId(task._id);
                        setEditTitle(task.title);
                      }}
                      onDelete={() => {
                        if (!onDelete) return;
                        if (!window.confirm(`Delete “${task.title}”?`)) return;
                        setBusyId(task._id);
                        void Promise.resolve(onDelete(task)).finally(() => setBusyId(null));
                      }}
                    />
                  ) : null}
                </div>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
