"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Bot,
  FileText,
  Loader2,
  MessageSquarePlus,
  Mic,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PageShell } from "@/components/layout/page-shell";
import { TopBar } from "@/components/layout/top-bar";
import { useAuth } from "@/components/providers/auth-provider";
import { aiApi, notesApi, type NoteRecord } from "@/lib/api";
import { NoteSelect } from "@/components/notes/note-select";
import {
  WELCOME_MESSAGE,
  createThread,
  formatThreadTime,
  loadChatThreads,
  persistChatThreads,
  threadTitleFromMessages,
  type ChatMessage,
  type ChatThread,
} from "@/lib/chat-history";
import { cn } from "@/lib/utils";

const HISTORY_PREVIEW = 5;

export default function AssistantPage() {
  const { user } = useAuth();
  const userId = user?.id || "guest";
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [noteId, setNoteId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [showAllHistory, setShowAllHistory] = useState(false);

  const upsertThreads = useCallback(
    (next: ChatThread[]) => {
      const sorted = [...next].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setThreads(sorted);
      persistChatThreads(String(userId), sorted);
    },
    [userId]
  );

  const saveActiveThread = useCallback(
    (nextMessages: ChatMessage[], nextNoteId?: string) => {
      if (!activeId) return;
      setThreads((prev) => {
        const next = prev.map((t) =>
          t.id === activeId
            ? {
                ...t,
                messages: nextMessages,
                noteId: nextNoteId ?? t.noteId,
                title: threadTitleFromMessages(nextMessages),
                updatedAt: new Date().toISOString(),
              }
            : t
        );
        const sorted = [...next].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        persistChatThreads(String(userId), sorted);
        return sorted;
      });
    },
    [activeId, userId]
  );

  useEffect(() => {
    notesApi
      .list()
      .then(({ notes: data }) => {
        setNotes(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const stored = loadChatThreads(String(userId));
    if (stored.length > 0) {
      setThreads(stored);
      const latest = stored[0];
      setActiveId(latest.id);
      setMessages(latest.messages);
      if (latest.noteId) setNoteId(latest.noteId);
      return;
    }
    const fresh = createThread();
    setThreads([fresh]);
    setActiveId(fresh.id);
    setMessages(fresh.messages);
    persistChatThreads(String(userId), [fresh]);
  }, [userId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, pending, activeId]);

  function resizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function startNewChat() {
    const fresh = createThread(noteId || undefined);
    upsertThreads([fresh, ...threads]);
    setActiveId(fresh.id);
    setMessages(fresh.messages);
    setInput("");
    setError("");
    setShowAllHistory(false);
  }

  function openThread(thread: ChatThread) {
    setActiveId(thread.id);
    setMessages(thread.messages);
    if (thread.noteId) setNoteId(thread.noteId);
    setShowAllHistory(false);
  }

  function deleteThread(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const next = threads.filter((t) => t.id !== id);
    if (next.length === 0) {
      const fresh = createThread(noteId || undefined);
      upsertThreads([fresh]);
      setActiveId(fresh.id);
      setMessages(fresh.messages);
      return;
    }
    upsertThreads(next);
    if (activeId === id) {
      openThread(next[0]);
    }
  }

  async function onSend(e?: FormEvent) {
    e?.preventDefault();
    if (!input.trim() || pending) return;
    const message = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    const withUser = [...messages, { role: "user" as const, content: message }];
    setMessages(withUser);
    saveActiveThread(withUser, noteId || undefined);
    setPending(true);
    setError("");
    try {
      const { reply } = await aiApi.chat(message, noteId || undefined);
      const withReply = [...withUser, { role: "assistant" as const, content: reply }];
      setMessages(withReply);
      saveActiveThread(withReply, noteId || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
    } finally {
      setPending(false);
    }
  }

  function onNoteChange(nextId: string) {
    setNoteId(nextId);
    if (activeId) {
      upsertThreads(
        threads.map((t) => (t.id === activeId ? { ...t, noteId: nextId || undefined } : t))
      );
    }
  }

  const visibleThreads = showAllHistory ? threads : threads.slice(0, HISTORY_PREVIEW);
  const selectedNote = notes.find((n) => n._id === noteId);

  return (
    <PageShell
      scrollBody={false}
      inset
      header={<TopBar title="AI Assistant" subtitle="Chat with your uploaded study materials" />}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        {error ? <p className="shrink-0 px-4 pt-2 text-sm text-red-400">{error}</p> : null}

        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_300px]">
          <div className="flex min-h-0 flex-col border-r border-white/10 bg-[var(--surface-solid)]/20">
            <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#c9a84c]/25 text-[#f0d08a]">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    Note context
                  </p>
                  {notes.length === 0 ? (
                    <p className="truncate text-sm text-muted">
                      No notes yet —{" "}
                      <Link href="/notes" className="text-[#e2b96f] hover:underline">
                        upload materials
                      </Link>
                    </p>
                  ) : (
                    <NoteSelect
                      notes={notes}
                      value={noteId}
                      onChange={onNoteChange}
                      placeholder="Select"
                      className="mt-0.5"
                    />
                  )}
                </div>
              </div>
              {selectedNote ? (
                <span className="hidden text-xs text-muted sm:inline">{selectedNote.fileType}</span>
              ) : null}
            </div>

            <div
              ref={scrollRef}
              className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-4 py-5 md:px-6"
            >
              {messages.map((m, i) => (
                <div
                  key={`${activeId}-${m.role}-${i}`}
                  className={cn(
                    "flex gap-3",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {m.role === "assistant" ? (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#c9a84c] to-[#8a6420]">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  ) : null}
                  <div
                    className={cn(
                      "max-w-[min(100%,720px)]",
                      m.role === "user"
                        ? "rounded-2xl rounded-tr-md bg-[#c9a84c]/90 px-4 py-3 text-sm text-white shadow-md shadow-violet-900/20"
                        : "flex-1 pt-0.5"
                    )}
                  >
                    {m.role === "user" ? (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      <ChatMarkdown content={m.content} />
                    )}
                  </div>
                  {m.role === "user" ? (
                    <UserAvatar name={user?.name} avatar={user?.avatar} size="sm" className="mt-0.5" />
                  ) : null}
                </div>
              ))}
              {pending ? (
                <div className="flex items-center gap-3 text-sm text-muted">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c9a84c]/30">
                    <Loader2 className="h-4 w-4 animate-spin text-[#e2b96f]" />
                  </div>
                  StudyMind is thinking...
                </div>
              ) : null}
            </div>

            <div className="shrink-0 border-t border-white/10 bg-[var(--surface-solid)]/40 p-3 md:p-4">
              <form
                className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 pl-3"
                onSubmit={onSend}
              >
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder="Message StudyMind AI..."
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    resizeTextarea();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void onSend();
                    }
                  }}
                  className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-sm outline-none placeholder:text-muted"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  className="shrink-0"
                  aria-label="Voice input"
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  type="submit"
                  disabled={pending || !input.trim()}
                  className="shrink-0"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <aside className="hidden min-h-0 flex-col bg-[var(--surface-solid)]/30 lg:flex">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
              <h2 className="text-sm font-semibold">Chat history</h2>
              <div className="flex items-center gap-1">
                {threads.length > HISTORY_PREVIEW ? (
                  <button
                    type="button"
                    onClick={() => setShowAllHistory((v) => !v)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-muted transition hover:border-[#c9a84c]/40 hover:bg-white/5 hover:text-[#f0d08a]"
                    aria-label={showAllHistory ? "Show recent chats" : "View all chats"}
                    title={showAllHistory ? "Show recent" : "View all"}
                  >
                    <ArrowUpRight className={cn("h-4 w-4", showAllHistory && "rotate-90")} />
                  </button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-8 gap-1.5 px-2.5 text-xs"
                  onClick={startNewChat}
                >
                  <MessageSquarePlus className="h-3.5 w-3.5" />
                  New
                </Button>
              </div>
            </div>
            <ul className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-2">
              {visibleThreads.length === 0 ? (
                <li className="px-2 py-4 text-sm text-muted">No conversations yet.</li>
              ) : (
                visibleThreads.map((t) => (
                  <li key={t.id}>
                    <div
                      className={cn(
                        "group flex items-start gap-1 rounded-xl transition",
                        t.id === activeId
                          ? "bg-[#c9a84c]/20 ring-1 ring-violet-500/30"
                          : "hover:bg-white/[0.06]"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => openThread(t)}
                        className="min-w-0 flex-1 px-3 py-2.5 text-left"
                      >
                        <p className="line-clamp-2 text-sm font-medium leading-snug">{t.title}</p>
                        <p className="mt-1 text-[11px] text-muted">{formatThreadTime(t.updatedAt)}</p>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => deleteThread(t.id, e)}
                        className="mr-1.5 mt-2 shrink-0 rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-red-500/15 hover:text-red-300 group-hover:opacity-100"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
            {showAllHistory && threads.length > HISTORY_PREVIEW ? (
              <p className="shrink-0 border-t border-white/10 px-4 py-2 text-center text-[11px] text-muted">
                Showing all {threads.length} conversations
              </p>
            ) : null}
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
