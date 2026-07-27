"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BellRing, X } from "lucide-react";
import { io, type Socket } from "socket.io-client";
import { getToken } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";

export type AppNotification = {
  id: string;
  action: string;
  subject: string;
  time: string;
  href?: string;
  kind?: "default" | "reminder";
};

type NotificationContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  dismissNotification: (id: string) => void;
  markAllAsRead: () => void;
  refreshFromProgress: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

function socketBaseUrl() {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  return api.replace(/\/api\/?$/, "");
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toast, setToast] = useState<AppNotification | null>(null);
  const dismissedIds = useRef<Set<string>>(new Set());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissNotification = useCallback((id: string) => {
    dismissedIds.current.add(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setToast((t) => (t?.id === id ? null : t));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      for (const n of prev) dismissedIds.current.add(n.id);
      return [];
    });
    setToast(null);
  }, []);

  const showToast = useCallback((payload: AppNotification) => {
    setToast(payload);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToast((t) => (t?.id === payload.id ? null : t));
    }, 8000);
  }, []);

  const refreshFromProgress = useCallback(async () => {
    const { progressApi } = await import("@/lib/api");
    try {
      const data = await progressApi.get();
      const mapped = (data.recentActivity || []).slice(0, 8).map((n, i) => ({
        id: n.id ? `progress-${n.id}` : `progress-${i}-${n.time}`,
        action: n.action,
        subject: n.subject,
        time: n.time,
        href: "/activity",
        kind: "default" as const,
      }));
      setNotifications((prev) => {
        const byId = new Map<string, AppNotification>();
        for (const item of [...mapped, ...prev]) {
          if (!dismissedIds.current.has(item.id)) {
            byId.set(item.id, item);
          }
        }
        return [...byId.values()].slice(0, 20);
      });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setToast(null);
      dismissedIds.current.clear();
      return;
    }

    void refreshFromProgress();

    const token = getToken();
    if (!token) return;

    let socket: Socket | null = null;
    try {
      socket = io(socketBaseUrl(), {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
      });

      socket.on("notification", (payload: AppNotification) => {
        if (dismissedIds.current.has(payload.id)) return;
        setNotifications((prev) => {
          const next = [payload, ...prev.filter((p) => p.id !== payload.id)];
          return next.slice(0, 20);
        });
        if (payload.kind === "reminder" || /reminder/i.test(payload.action || "")) {
          showToast(payload);
        }
      });
    } catch {
      /* no socket */
    }

    return () => {
      socket?.disconnect();
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [user, refreshFromProgress, showToast]);

  const unreadCount = notifications.length;

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      dismissNotification,
      markAllAsRead,
      refreshFromProgress,
    }),
    [notifications, unreadCount, dismissNotification, markAllAsRead, refreshFromProgress]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4 sm:justify-end sm:pr-6">
          <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border border-[#c9a84c]/35 bg-[var(--dropdown-bg)] shadow-2xl shadow-black/40">
            <div className="flex items-start gap-3 p-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#c9a84c]/20 text-[#e2b96f]">
                <BellRing className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{toast.action}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{toast.subject}</p>
                <Link
                  href={toast.href || "/planner"}
                  className="mt-2 inline-block text-xs font-medium text-[#e2b96f] hover:underline"
                  onClick={() => dismissNotification(toast.id)}
                >
                  Open planner
                </Link>
              </div>
              <button
                type="button"
                aria-label="Dismiss reminder"
                className="rounded-lg p-1 text-muted transition hover:bg-[var(--panel-hover)] hover:text-foreground"
                onClick={() => dismissNotification(toast.id)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="h-0.5 w-full bg-[#c9a84c]/25">
              <div className="toast-progress-bar h-full w-full bg-[#c9a84c]" />
            </div>
          </div>
        </div>
      ) : null}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}
