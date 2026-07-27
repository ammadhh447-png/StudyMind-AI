"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { progressApi } from "@/lib/api";

const PAGE_SIZE = 10;

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ActivityPage() {
  const [items, setItems] = useState<
    { id?: string; action: string; subject: string; time: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await progressApi.get();
      setItems(data.recentActivity || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  async function clearAll() {
    setClearing(true);
    setError("");
    try {
      await progressApi.clearActivities();
      setItems([]);
      setPage(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not clear activity");
    } finally {
      setClearing(false);
    }
  }

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.action.toLowerCase().includes(q) || item.subject.toLowerCase().includes(q)
    );
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, page]);

  return (
    <PageShell
      inset
      header={<TopBar title="Recent Activity" subtitle="Your study events and updates" />}
    >
      <div className="space-y-4 pb-2">
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <GlassCard className="p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-[220px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                type="search"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] pl-8 pr-2.5 text-xs text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-[#c9a84c]/40"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={clearing || items.length === 0}
              onClick={() => void clearAll()}
            >
              {clearing ? "Clearing…" : "Clear all"}
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted">Loading activity…</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-sm text-muted">Activity appears as you study.</p>
          ) : (
            <>
              <ul className="space-y-3">
                {pageItems.map((item) => (
                  <li
                    key={item.id || `${item.action}-${item.time}`}
                    className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm">{item.action}</p>
                      <p className="text-xs text-muted">{item.subject}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted">{timeAgo(item.time)}</span>
                  </li>
                ))}
              </ul>

              {filteredItems.length > PAGE_SIZE ? (
                <div className="mt-4 flex items-center justify-end gap-2">
                  <span className="mr-1 text-xs text-muted">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--panel-border)] bg-[var(--surface-solid)] text-foreground transition hover:bg-[var(--panel-hover)] disabled:pointer-events-none disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--panel-border)] bg-[var(--surface-solid)] text-foreground transition hover:bg-[var(--panel-hover)] disabled:pointer-events-none disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </>
          )}
        </GlassCard>
      </div>
    </PageShell>
  );
}
