"use client";

import { ChevronLeft, ChevronRight, MoreVertical, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { notesApi, type NoteRecord } from "@/lib/api";

const filters = ["All", "PDF", "Document", "Image", "Presentation"] as const;
const PAGE_SIZE = 6;

function NoteListCard({
  note,
  onDelete,
  deleting,
}: {
  note: NoteRecord;
  onDelete: (note: NoteRecord) => void;
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
    <GlassCard className="relative p-4 transition hover:border-[#c9a84c]/35">
      <div ref={menuRef} className="absolute right-2 top-2 z-20">
        <button
          type="button"
          aria-label="Note options"
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
                onDelete(note);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        ) : null}
      </div>

      <h3 className="pr-10 font-medium leading-snug">{note.title}</h3>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted">
        <Badge variant="muted">{note.fileType}</Badge>
        <span>{note.pageCount} pages</span>
      </div>
      <p className="mt-2 text-xs text-muted">{new Date(note.createdAt).toLocaleDateString()}</p>
    </GlassCard>
  );
}

export default function NotesPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState<(typeof filters)[number]>("All");
  const [page, setPage] = useState(1);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadNotes = useCallback(async () => {
    try {
      const { notes: data } = await notesApi.list();
      setNotes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    setPage(1);
  }, [active]);

  const filtered = useMemo(
    () => (active === "All" ? notes : notes.filter((n) => n.fileType === active)),
    [active, notes]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      await notesApi.upload(file);
      await loadNotes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function removeNote(note: NoteRecord) {
    if (!window.confirm(`Delete “${note.title}”?`)) return;
    setDeletingId(note._id);
    setError("");
    try {
      await notesApi.remove(note._id);
      setNotes((prev) => prev.filter((n) => n._id !== note._id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <PageShell inset header={<TopBar title="My Notes" subtitle="Organise and manage study materials" />}>
      <div className="space-y-4 pb-1">
        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.pptx,image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file);
            e.target.value = "";
          }}
        />

        <GlassCard
          className="flex flex-col items-center justify-center border-dashed py-8"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) void handleUpload(file);
          }}
        >
          <Upload className="mb-3 h-7 w-7 text-[#c9a84c]" />
          <p className="text-sm font-medium">Upload notes</p>
          <p className="mt-1 text-xs text-muted">Drop PDF, DOCX, PPT, or images here</p>
          <Button className="mt-4" disabled={uploading} onClick={() => inputRef.current?.click()}>
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Note"}
          </Button>
        </GlassCard>

        <div>
          <h2 className="mb-3 text-sm font-medium">Notes material</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActive(f)}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm transition",
                  active === f
                    ? "btn-gold text-[#1a1408] font-medium"
                    : "glass-panel text-muted hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-sm text-muted">Loading notes...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted">No notes yet. Upload a file above.</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {pageItems.map((note) => (
                  <NoteListCard
                    key={note._id}
                    note={note}
                    deleting={deletingId === note._id}
                    onDelete={removeNote}
                  />
                ))}
              </div>

              {filtered.length > PAGE_SIZE ? (
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
        </div>
      </div>
    </PageShell>
  );
}
