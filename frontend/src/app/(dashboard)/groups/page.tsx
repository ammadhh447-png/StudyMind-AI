"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { GroupListSection } from "@/components/groups/group-list-card";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { groupsApi, type StudyGroupRecord } from "@/lib/api";

function sortGroups(groups: StudyGroupRecord[]) {
  return [...groups].sort((a, b) => {
    const aActive = a.isActive ? 1 : 0;
    const bActive = b.isActive ? 1 : 0;
    if (bActive !== aActive) return bActive - aActive;
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return bTime - aTime;
  });
}

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<StudyGroupRecord[]>([]);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { groups: data } = await groupsApi.list();
    setGroups(sortGroups(data));
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load groups"));
  }, [load]);

  const activeGroups = useMemo(() => groups.filter((g) => g.isActive), [groups]);
  const otherGroups = useMemo(() => groups.filter((g) => !g.isActive), [groups]);

  async function createGroup() {
    if (!name.trim()) return;
    setCreating(true);
    setError("");
    try {
      const { group } = await groupsApi.create({ name: name.trim(), description: desc.trim() });
      router.push(`/groups/${group._id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  async function removeGroup(group: StudyGroupRecord) {
    const label = group.role === "admin" ? "Delete this group for everyone?" : "Leave this group?";
    if (!window.confirm(label)) return;
    setDeletingId(group._id);
    setError("");
    try {
      await groupsApi.delete(group._id);
      setGroups((prev) => prev.filter((g) => g._id !== group._id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove group");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <PageShell
      inset
      header={<TopBar title="Study Groups" subtitle="Create groups and collaborate with classmates" />}
    >
      <div className="mx-auto w-full max-w-6xl space-y-6 pb-2">
        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <GlassCard className="p-4 sm:p-5">
          <div className="mb-4 flex items-start gap-3 border-b border-[var(--panel-divider)] pb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c9a84c]/20">
              <Plus className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">New study group</h2>
              <p className="mt-0.5 text-xs text-muted">
                Name your group and add a short description for members.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-muted">Group name</label>
              <Input
                placeholder="e.g. CS101 Midterm Squad"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void createGroup()}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-muted">Description (optional)</label>
              <Textarea
                className="min-h-[72px]"
                placeholder="What you are studying together"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => void createGroup()} disabled={creating || !name.trim()}>
              {creating ? "Creating…" : "Create group"}
            </Button>
          </div>
        </GlassCard>

        {groups.length === 0 ? (
          <GlassCard className="flex flex-col items-center px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c9a84c]/15">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <p className="mt-3 text-sm font-medium">No groups yet</p>
            <p className="mt-1 max-w-sm text-xs text-muted">
              Create a group above to share notes, tasks, and quizzes with classmates.
            </p>
          </GlassCard>
        ) : (
          <>
            <GroupListSection
              title="Active groups"
              subtitle="Recent activity, open tasks, or chat in the last 7 days"
              groups={activeGroups}
              onDelete={(g) => void removeGroup(g)}
              deletingId={deletingId}
              emptyMessage="No active groups right now. Open a group or add tasks to see it here."
            />
            {otherGroups.length > 0 ? (
              <GroupListSection
                title="Other groups"
                subtitle="Quiet groups — open anytime to pick back up"
                groups={otherGroups}
                onDelete={(g) => void removeGroup(g)}
                deletingId={deletingId}
              />
            ) : null}
          </>
        )}
      </div>
    </PageShell>
  );
}
