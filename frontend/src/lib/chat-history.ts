export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatThread = {
  id: string;
  title: string;
  noteId?: string;
  messages: ChatMessage[];
  updatedAt: string;
};

const STORAGE_PREFIX = "studymind_chat_threads_";

export const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I can explain topics from your notes. Ask a question and I will answer using your uploaded materials when available.",
};

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function loadChatThreads(userId: string): ChatThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatThread[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistChatThreads(userId: string, threads: ChatThread[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(userId), JSON.stringify(threads.slice(0, 100)));
}

export function createThread(noteId?: string): ChatThread {
  const now = new Date().toISOString();
  return {
    id: `thread_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: "New conversation",
    noteId,
    messages: [WELCOME_MESSAGE],
    updatedAt: now,
  };
}

export function threadTitleFromMessages(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New conversation";
  const t = firstUser.content.trim();
  if (t.length <= 48) return t;
  return `${t.slice(0, 48)}…`;
}

export function formatThreadTime(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const h = Math.floor(d / 3600000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
