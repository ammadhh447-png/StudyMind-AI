const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  authProvider?: "google" | "local";
  preferences?: {
    language?: string;
    theme?: string;
    aiResponseLength?: string;
  };
};

export type NoteRecord = {
  _id: string;
  title: string;
  fileType: string;
  fileUrl: string;
  pageCount: number;
  extractedText?: string;
  createdAt: string;
};

export type QuizQuestion = {
  type: string;
  prompt: string;
  options?: string[];
  answer: string;
};

export type QuizRecord = {
  _id: string;
  title: string;
  difficulty: string;
  noteId?: string;
  questions: QuizQuestion[];
};

export type StudySummary = {
  title?: string;
  quickOverview?: string;
  keyPoints?: string[];
  definitions?: { term: string; meaning: string }[];
  examTips?: string[];
  rememberThis?: string;
};

export type FlashcardSetRecord = {
  _id: string;
  name: string;
  cards: { question: string; answer: string; difficulty: string }[];
};

export type PlannerTaskRecord = {
  _id: string;
  title: string;
  status: "Pending" | "In Progress" | "Done";
  scheduledTime: string;
  dueDate?: string;
};

export type MindMapRecord = {
  _id: string;
  title: string;
  nodes: { id: string; label: string; parentId: string | null; detail?: string }[];
  createdAt?: string;
  updatedAt?: string;
};

export type StudyGroupRecord = {
  _id: string;
  name: string;
  description?: string;
  members: number;
  unread: number;
  role?: "admin" | "member";
  progress?: number;
  files?: number;
  tasksDone?: number;
  tasksTotal?: number;
  isActive?: boolean;
  updatedAt?: string;
};

export type GroupMember = {
  userId: string;
  name: string;
  email?: string;
  avatar?: string;
  role: "admin" | "member";
  joinedAt?: string;
};

export type GroupDetail = {
  _id: string;
  name: string;
  description: string;
  inviteCode: string;
  createdBy: string;
  members: GroupMember[];
  stats: {
    members: number;
    files: number;
    tasksDone: number;
    tasksTotal: number;
    quizzes: number;
    progress: number;
  };
  messages: {
    userId?: string;
    userName: string;
    role?: string;
    text: string;
    createdAt: string;
  }[];
  announcements: {
    title: string;
    body: string;
    authorName: string;
    createdAt: string;
  }[];
  files: {
    _id?: string;
    name: string;
    fileType: string;
    size: number;
    url: string;
    uploaderName: string;
    createdAt: string;
  }[];
  tasks: {
    _id: string;
    title: string;
    dueDate: string;
    status: "Pending" | "In Progress" | "Done";
    assignedTo?: string;
  }[];
  plannerItems: { title: string; topic: string; scheduledAt: string }[];
  activities: { action: string; subject: string; userName: string; createdAt: string }[];
  leaderboard: { userName: string; quizTitle: string; score: number; createdAt: string }[];
  updatedAt?: string;
  createdAt?: string;
};

export type ProgressPayload = {
  stats: {
    studyHours: number;
    quizzesCompleted: number;
    flashcardsStudied: number;
    averageScore: number;
    notesCount: number;
    weakTopics: number;
    overallProgress: number;
  };
  recentActivity: { id?: string; action: string; subject: string; time: string }[];
  weakTopicDetails: { quizId: string; topic: string; score: number }[];
  trends: {
    studyHours: { day: string; value: number }[];
    quizzesCompleted: { day: string; value: number }[];
    flashcardsStudied: { day: string; value: number }[];
    averageScore: { day: string; value: number }[];
    activity: { day: string; value: number }[];
    studyTime: { day: string; value: number }[];
  };
  overviewBreakdown: { name: string; value: number; color: string }[];
};

const TOKEN_KEY = "studymind_token";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error(
      "Cannot reach the API. Is the backend running on port 5000?"
    );
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data as T;
}

export const authApi = {
  register: (body: { name: string; email: string; password: string }) =>
    api<{ token: string; user: ApiUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    api<{ token: string; user: ApiUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  google: (credential: string) =>
    api<{ token: string; user: ApiUser }>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    }),
  me: () => api<{ user: ApiUser }>("/auth/me"),
  updateProfile: (body: Record<string, unknown>) =>
    api<{ user: ApiUser }>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return api<{ user: ApiUser }>("/auth/me/avatar", { method: "POST", body: form });
  },
};

export const notesApi = {
  list: () => api<{ notes: NoteRecord[] }>("/notes"),
  upload: (file: File, title?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (title) form.append("title", title);
    return api<{ note: NoteRecord }>("/notes/upload", { method: "POST", body: form });
  },
  remove: (id: string) => api<{ success: boolean }>(`/notes/${id}`, { method: "DELETE" }),
};

export const aiApi = {
  chat: (message: string, noteId?: string) =>
    api<{ reply: string; sources: { title: string; excerpt: string }[] }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, noteId }),
    }),
  transcribe: (audio: Blob) => {
    const form = new FormData();
    const type = (audio.type || "audio/webm").split(";")[0] || "audio/webm";
    const ext = type.includes("wav")
      ? "wav"
      : type.includes("mp4")
        ? "mp4"
        : type.includes("ogg")
          ? "ogg"
          : "webm";
    form.append("audio", new Blob([audio], { type }), `speech.${ext}`);
    return api<{ text: string }>("/ai/transcribe", { method: "POST", body: form });
  },
  summarise: (payload: { text?: string; noteId?: string }) =>
    api<{ summary: StudySummary; format: "structured" | "text" }>("/ai/summarise", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  generateQuiz: (noteId: string, difficulty?: string) =>
    api<{ quiz: QuizRecord }>("/ai/generate-quiz", {
      method: "POST",
      body: JSON.stringify({ noteId, difficulty }),
    }),
  generateFlashcards: (noteId: string) =>
    api<{ set: FlashcardSetRecord }>("/ai/generate-flashcards", {
      method: "POST",
      body: JSON.stringify({ noteId }),
    }),
  generateMindMap: (noteId: string) =>
    api<{ map: MindMapRecord }>("/ai/generate-mind-map", {
      method: "POST",
      body: JSON.stringify({ noteId }),
    }),
};

export const quizzesApi = {
  list: () => api<{ quizzes: QuizRecord[] }>("/quizzes"),
  get: (id: string) => api<{ quiz: QuizRecord }>(`/quizzes/${id}`),
  submit: (id: string, answers: string[]) =>
    api<{
      score: number;
      results: { index: number; correct: boolean; points: number; expected: string }[];
    }>(`/quizzes/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
  regenerate: (id: string) =>
    api<{ quiz: QuizRecord }>(`/quizzes/${id}/regenerate`, { method: "POST" }),
};

export const flashcardsApi = {
  list: () => api<{ sets: FlashcardSetRecord[] }>("/flashcards"),
  get: (id: string) => api<{ set: FlashcardSetRecord }>(`/flashcards/${id}`),
};

export const progressApi = {
  get: () => api<ProgressPayload>("/progress"),
  clearActivities: () =>
    api<{ success: boolean }>("/progress/activities", { method: "DELETE" }),
};

export const plannerApi = {
  listToday: () => api<{ tasks: PlannerTaskRecord[] }>("/planner"),
  listWeek: () => api<{ tasks: PlannerTaskRecord[] }>("/planner/week"),
  create: (body: Partial<PlannerTaskRecord>) =>
    api<{ task: PlannerTaskRecord }>("/planner", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: Partial<PlannerTaskRecord>) =>
    api<{ task: PlannerTaskRecord }>(`/planner/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  delete: (id: string) =>
    api<{ success: boolean }>(`/planner/${id}`, { method: "DELETE" }),
};

export const mindMapsApi = {
  list: () => api<{ maps: MindMapRecord[] }>("/mind-maps"),
  get: (id: string) => api<{ map: MindMapRecord }>(`/mind-maps/${id}`),
  update: (id: string, body: { nodes?: MindMapRecord["nodes"]; title?: string }) =>
    api<{ map: MindMapRecord }>(`/mind-maps/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  delete: (id: string) =>
    api<{ success: boolean }>(`/mind-maps/${id}`, { method: "DELETE" }),
};

export const groupsApi = {
  list: () => api<{ groups: StudyGroupRecord[] }>("/groups"),
  get: (id: string) => api<{ group: GroupDetail }>(`/groups/${id}`),
  delete: (id: string) =>
    api<{ removed: "group" | "membership" }>(`/groups/${id}`, { method: "DELETE" }),
  create: (body: { name: string; description?: string }) =>
    api<{ group: GroupDetail }>("/groups", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  join: (inviteCode: string) =>
    api<{ group: GroupDetail }>("/groups/join", {
      method: "POST",
      body: JSON.stringify({ inviteCode }),
    }),
  invite: (id: string) =>
    api<{ inviteCode: string; inviteUrl: string }>(`/groups/${id}/invite`),
  sendMessage: (id: string, text: string) =>
    api<{ messages: GroupDetail["messages"] }>(`/groups/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  addAnnouncement: (id: string, body: { title: string; body: string }) =>
    api<{ announcements: GroupDetail["announcements"] }>(`/groups/${id}/announcements`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  uploadFile: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api<{ files: GroupDetail["files"] }>(`/groups/${id}/files`, {
      method: "POST",
      body: fd,
    });
  },
  createTask: (
    id: string,
    body: { title: string; dueDate?: string; status?: string; assignedTo?: string }
  ) =>
    api<{ tasks: GroupDetail["tasks"] }>(`/groups/${id}/tasks`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateTask: (
    id: string,
    taskId: string,
    body: Partial<{ title: string; dueDate: string; status: string; assignedTo: string }>
  ) =>
    api<{ tasks: GroupDetail["tasks"] }>(`/groups/${id}/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  addPlannerItem: (id: string, body: { title: string; topic?: string; scheduledAt?: string }) =>
    api<{ plannerItems: GroupDetail["plannerItems"] }>(`/groups/${id}/planner`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  recordQuizScore: (id: string, body: { quizTitle: string; score: number }) =>
    api<{ leaderboard: GroupDetail["leaderboard"] }>(`/groups/${id}/quiz-scores`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
