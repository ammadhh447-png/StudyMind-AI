"use client";

import Link from "next/link";
import { MoreVertical, Trash2, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import type { StudyGroupRecord } from "@/lib/api";

type GroupListCardProps = {
  group: StudyGroupRecord;
  onDelete: (group: StudyGroupRecord) => void;
  deleting?: boolean;
};

export function GroupListCard({ group, onDelete, deleting }: GroupListCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const progress = group.progress ?? 0;
  const isAdmin = group.role === "admin";

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  return (
    <GlassCard className="relative h-full p-4 transition hover:border-[#c9a84c]/35">
      <div ref={menuRef} className="absolute right-2 top-2 z-10">
        <button
          type="button"
          aria-label="Group options"
          disabled={deleting}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-[var(--panel-hover)] hover:text-foreground"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {menuOpen ? (
          <div className="absolute right-0 top-full mt-1 min-w-[9.5rem] overflow-hidden rounded-lg border border-[var(--dropdown-border)] bg-[var(--dropdown-bg)] py-1 shadow-xl">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 transition hover:bg-red-500/10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen(false);
                onDelete(group);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isAdmin ? "Delete group" : "Leave group"}
            </button>
          </div>
        ) : null}
      </div>

      <Link href={`/groups/${group._id}`} className="block pr-8">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#c9a84c]/20">
            <Users className="h-5 w-5 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate font-medium">{group.name}</h3>
              {group.isActive ? (
                <span className="inline-flex items-center rounded-full border border-emerald-500/35 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  Active
                </span>
              ) : null}
              {isAdmin ? (
                <span className="inline-flex items-center rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--accent-text-strong)]">
                  Admin
                </span>
              ) : null}
            </div>
            {group.description?.trim() ? (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{group.description}</p>
            ) : null}
            <p className="mt-2 text-xs text-muted">
              {group.members} member{group.members === 1 ? "" : "s"}
              {(group.tasksTotal ?? 0) > 0
                ? ` · ${group.tasksDone ?? 0}/${group.tasksTotal} tasks done`
                : null}
            </p>
            <div className="mt-2.5">
              <div className="mb-1 flex justify-between text-[10px] text-muted">
                <span>Progress</span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--panel-subtle)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </GlassCard>
  );
}

export function GroupListSection({
  title,
  subtitle,
  groups,
  onDelete,
  deletingId,
  emptyMessage,
}: {
  title: string;
  subtitle?: string;
  groups: StudyGroupRecord[];
  onDelete: (group: StudyGroupRecord) => void;
  deletingId?: string | null;
  emptyMessage?: string;
}) {
  if (groups.length === 0 && !emptyMessage) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-medium">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-muted">{subtitle}</p> : null}
      </div>
      {groups.length === 0 ? (
        <p className="text-sm text-muted">{emptyMessage}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((g) => (
            <GroupListCard
              key={g._id}
              group={g}
              onDelete={onDelete}
              deleting={deletingId === g._id}
            />
          ))}
        </div>
      )}
    </section>
  );
}
