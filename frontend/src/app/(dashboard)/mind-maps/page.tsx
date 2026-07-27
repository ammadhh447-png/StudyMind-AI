"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, GitBranch, MoreVertical, Plus, Search, Trash2 } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { MindMapCardPreview } from "@/components/mind-map/mind-map-canvas";
import { aiApi, mindMapsApi, notesApi, type MindMapRecord, type NoteRecord } from "@/lib/api";
import { NoteSelect } from "@/components/notes/note-select";

const PAGE_SIZE = 15;

function MindMapListCard({
  map,
  onDelete,
  deleting,
}: {
  map: MindMapRecord;
  onDelete: (map: MindMapRecord) => void;
  deleting?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
      <div ref={menuRef} className="absolute right-2 top-2 z-20">
        <button
          type="button"
          aria-label="Mind map options"
          disabled={deleting}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--panel-border)] bg-[var(--surface-solid)] text-foreground shadow-sm transition hover:bg-[var(--panel-hover)]"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {menuOpen ? (
          <div className="absolute right-0 top-full mt-1 min-w-[9rem] overflow-hidden rounded-lg border border-[var(--dropdown-border)] bg-[var(--dropdown-bg)] py-1 shadow-xl">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 transition hover:bg-red-500/10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen(false);
                onDelete(map);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        ) : null}
      </div>

      <Link href={`/mind-maps/${map._id}`} className="block">
        <MindMapCardPreview map={map} />
        <div className="mt-2 flex items-center gap-2 pr-8">
          <GitBranch className="h-4 w-4 shrink-0 text-[#c9a84c]" />
          <h3 className="truncate text-sm font-medium">{map.title}</h3>
        </div>
        <p className="mt-1 text-xs text-muted">{map.nodes.length} nodes</p>
      </Link>
    </GlassCard>
  );
}

export default function MindMapsPage() {
  const [maps, setMaps] = useState<MindMapRecord[]>([]);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [noteId, setNoteId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const [mapRes, noteRes] = await Promise.all([mindMapsApi.list(), notesApi.list()]);
    const sorted = [...mapRes.maps].sort((a, b) => {
      const ta = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const tb = new Date(b.createdAt || b.updatedAt || 0).getTime();
      return tb - ta;
    });
    setMaps(sorted);
    setNotes(noteRes.notes);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filteredMaps = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return maps;
    return maps.filter((m) => m.title.toLowerCase().includes(q));
  }, [maps, search]);

  const totalPages = Math.max(1, Math.ceil(filteredMaps.length / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pageMaps = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredMaps.slice(start, start + PAGE_SIZE);
  }, [filteredMaps, page]);

  async function createMap() {
    if (!noteId) {
      setError("Select a note first.");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      await aiApi.generateMindMap(noteId);
      setPage(1);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function removeMap(map: MindMapRecord) {
    if (!window.confirm(`Delete “${map.title}”?`)) return;
    setDeletingId(map._id);
    setError("");
    try {
      await mindMapsApi.delete(map._id);
      setMaps((prev) => prev.filter((m) => m._id !== map._id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete mind map");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <PageShell inset header={<TopBar title="Mind Maps" subtitle="Visualize your notes and concepts" />}>
      <div className="mx-auto w-full max-w-[1680px] space-y-4 pb-2">
        <div className="flex flex-wrap items-end gap-3">
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
          {notes.length > 0 ? (
            <NoteSelect
              notes={notes}
              value={noteId}
              onChange={setNoteId}
              placeholder="Select"
              className="w-full max-w-xs"
              triggerClassName="h-10 rounded-xl"
            />
          ) : null}
          <Button onClick={createMap} disabled={generating}>
            <Plus className="h-4 w-4" />
            {generating ? "Creating..." : "Create Mind Map"}
          </Button>
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {maps.length === 0 ? (
          <GlassCard>
            <p className="text-sm text-muted">
              No mind maps yet. Choose a note and click Create Mind Map to generate an interactive
              concept tree.
            </p>
          </GlassCard>
        ) : filteredMaps.length === 0 ? (
          <p className="text-sm text-muted">No mind maps match your search.</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {pageMaps.map((map) => (
                <MindMapListCard
                  key={map._id}
                  map={map}
                  onDelete={(m) => void removeMap(m)}
                  deleting={deletingId === map._id}
                />
              ))}
            </div>

            {filteredMaps.length > PAGE_SIZE ? (
              <div className="flex items-center justify-end gap-2">
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
      </div>
    </PageShell>
  );
}
