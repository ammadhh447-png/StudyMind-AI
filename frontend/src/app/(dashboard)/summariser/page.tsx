"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { GlassCard } from "@/components/ui/glass-card";
import {
  SummaryOutput,
  type StudySummary,
} from "@/components/summariser/summary-output";
import { aiApi, notesApi } from "@/lib/api";

type SessionUpload = {
  id: string;
  title: string;
  fileType: string;
  pageCount: number;
};

export default function SummariserPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [upload, setUpload] = useState<SessionUpload | null>(null);
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState<StudySummary | null>(null);
  const [format, setFormat] = useState<"structured" | "text">("structured");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const { note } = await notesApi.upload(file);
      setUpload({
        id: note._id,
        title: note.title,
        fileType: note.fileType,
        pageCount: note.pageCount,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function clearUpload() {
    setUpload(null);
  }

  async function generate() {
    if (!text.trim() && !upload) {
      setError("Upload a file or paste text to summarise.");
      return;
    }
    setPending(true);
    setError("");
    setSummary(null);
    try {
      const result = await aiApi.summarise({
        text: text.trim() || undefined,
        noteId: upload?.id,
      });
      setSummary(result.summary);
      setFormat(result.format);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Summarisation failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <PageShell
      scrollBody={false}
      inset
      header={
        <TopBar
          title="AI Summariser"
          subtitle="Upload a file or paste text for an exam-ready summary"
        />
      }
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden px-3 pb-3 pt-1 sm:px-4">
        {error ? <p className="mb-2 shrink-0 text-sm text-red-400">{error}</p> : null}

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
          <div className="glass-panel flex min-h-0 flex-col overflow-hidden rounded-2xl">
            <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-4 py-3">
              <FileText className="h-4 w-4 text-[#e2b96f]" />
              <h2 className="text-sm font-medium">Source for this summary</h2>
            </div>

            <div className="scrollbar-thin min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
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

              {upload ? (
                <div className="flex items-start gap-3 rounded-xl border border-[#c9a84c]/35 bg-[#c9a84c]/10 p-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#c9a84c]/25">
                    <FileText className="h-6 w-6 text-[#f0d08a]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{upload.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                      <Badge variant="muted">{upload.fileType}</Badge>
                      <span>{upload.pageCount} pages</span>
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      Ready to summarise. Upload another file to replace this one.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearUpload}
                    className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-white/10 hover:text-foreground"
                    aria-label="Remove uploaded file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <GlassCard
                  className="flex flex-col items-center justify-center border-dashed py-10"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) void handleUpload(file);
                  }}
                >
                  <Upload className="mb-3 h-8 w-8 text-[#c9a84c]" />
                  <p className="max-w-xs text-center text-sm text-muted">
                    Upload a PDF, DOCX, PPT, or image to summarise
                  </p>
                  <Button
                    type="button"
                    className="mt-4"
                    disabled={uploading}
                    onClick={() => inputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Choose file"}
                  </Button>
                </GlassCard>
              )}

              {upload ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={uploading}
                  onClick={() => inputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Replace with another file
                </Button>
              ) : null}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">
                  Or paste text
                </label>
                <Textarea
                  className="min-h-[160px] resize-none"
                  placeholder="Paste lecture notes or an excerpt. You can use this alone or together with an uploaded file."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>
            </div>

            <div className="shrink-0 border-t border-white/10 p-4">
              <Button className="w-full" onClick={() => void generate()} disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate study summary
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="glass-panel flex min-h-0 flex-col overflow-hidden rounded-2xl ring-1 ring-violet-500/15">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <Sparkles className="h-4 w-4 text-[#e2b96f]" />
              <h2 className="text-sm font-medium">Student summary</h2>
            </div>
            <div className="min-h-0 flex-1">
              <SummaryOutput summary={summary} format={format} />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
