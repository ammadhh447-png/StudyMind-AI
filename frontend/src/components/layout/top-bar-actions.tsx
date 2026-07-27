"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell, LogOut, Moon, Settings, Sun, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAuth } from "@/components/providers/auth-provider";
import { useNotifications } from "@/components/providers/notification-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

const menuContent = "dropdown-panel";

const menuItem =
  "dropdown-item flex items-center gap-2 px-3 py-2 text-sm text-foreground";

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const h = Math.floor(d / 3600000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function TopBarActions() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    notifications,
    unreadCount,
    dismissNotification,
    markAllAsRead,
    refreshFromProgress,
  } = useNotifications();

  function openNotification(id: string, href: string) {
    dismissNotification(id);
    router.push(href);
  }

  return (
    <div className="flex items-center gap-2 sm:gap-2.5">
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="h-9 w-9"
        aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        title={theme === "dark" ? "Light mode" : "Dark mode"}
        onClick={toggleTheme}
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <DropdownMenu.Root
        modal={false}
        onOpenChange={(open) => {
          if (open) void refreshFromProgress();
        }}
      >
        <DropdownMenu.Trigger asChild>
          <Button type="button" variant="secondary" size="icon" className="relative h-9 w-9" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className={cn(menuContent, "max-w-sm")} align="end" sideOffset={8}>
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <p className="text-xs font-medium text-muted">Notifications</p>
              {notifications.length > 0 ? (
                <button
                  type="button"
                  className="text-[10px] font-medium text-accent hover:underline"
                  onClick={() => markAllAsRead()}
                >
                  Mark all as read
                </button>
              ) : null}
            </div>
            {notifications.length === 0 ? (
              <p className="px-3 pb-3 text-sm text-muted">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <DropdownMenu.Item
                  key={n.id}
                  className="dropdown-item px-3 py-2 text-sm"
                  onSelect={(e) => {
                    e.preventDefault();
                    openNotification(n.id, n.href || "/activity");
                  }}
                >
                  <p className="font-medium">{n.action}</p>
                  <p className="line-clamp-1 text-xs text-muted">{n.subject}</p>
                  <p className="mt-0.5 text-[10px] text-muted">{timeAgo(n.time)}</p>
                </DropdownMenu.Item>
              ))
            )}
            <DropdownMenu.Item asChild>
              <Link
                href="/activity"
                className="dropdown-item block px-3 py-2 text-center text-xs text-accent"
              >
                View all activity
              </Link>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="rounded-full ring-2 ring-transparent transition hover:ring-violet-500/40"
            aria-label="Profile and account"
          >
            <UserAvatar name={user?.name} avatar={user?.avatar} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className={menuContent} align="end" sideOffset={8}>
            <div className="border-b border-[var(--panel-divider)] px-3 py-2">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted">{user?.email}</p>
            </div>
            <DropdownMenu.Item asChild>
              <Link
                href="/settings"
                className={menuItem}
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link
                href="/settings"
                className={menuItem}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className={cn(menuItem, "text-red-400")}
              onSelect={() => logout()}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
