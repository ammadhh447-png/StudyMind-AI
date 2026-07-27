"use client";

import { useEffect, useRef, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Camera, Eye, EyeOff, Lock, UserRound } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { PageShell } from "@/components/layout/page-shell";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

const tabTrigger =
  "rounded-lg px-4 py-2 text-sm text-muted transition data-[state=active]:bg-[#c9a84c] data-[state=active]:text-[#1a1408] data-[state=active]:font-medium";

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted">{label}</label>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
          autoComplete="new-password"
        />
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition hover:bg-[var(--panel-hover)] hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, setUser, refreshUser } = useAuth();
  const { theme: themeMode } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [authProvider, setAuthProvider] = useState<"google" | "local">("local");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [notifPrefs, setNotifPrefs] = useState({
    studyReminders: true,
    quizResults: true,
    groupMessages: true,
    weeklyReport: true,
  });

  const isGoogle = authProvider === "google";

  useEffect(() => {
    try {
      const raw = localStorage.getItem("studymind_notification_prefs");
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<typeof notifPrefs>;
        setNotifPrefs((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    authApi
      .me()
      .then(({ user: profile }) => {
        setName(profile.name);
        setBio(profile.bio || "");
        setAvatarUrl(profile.avatar || "");
        setAuthProvider(profile.authProvider || "local");
        setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          avatar: profile.avatar,
          bio: profile.bio,
          authProvider: profile.authProvider,
          preferences: profile.preferences,
        });
      })
      .catch(() => {});
  }, [setUser]);

  async function saveAccount() {
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const { user: updated } = await authApi.updateProfile({
        name,
        bio,
        password: !isGoogle && password ? password : undefined,
        newPassword: !isGoogle && newPassword ? newPassword : undefined,
        preferences: {
          theme: themeMode === "light" ? "Light" : "Dark",
        },
      });
      setUser({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        avatar: updated.avatar,
        bio: updated.bio,
        authProvider: updated.authProvider,
        preferences: updated.preferences,
      });
      setMessage("Profile updated successfully.");
      setPassword("");
      setNewPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onAvatarSelected(file: File | undefined) {
    if (!file || isGoogle) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG, PNG, or WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }
    setError("");
    setMessage("");
    setUploading(true);
    try {
      const { user: updated } = await authApi.uploadAvatar(file);
      setAvatarUrl(updated.avatar || "");
      setUser({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        avatar: updated.avatar,
        bio: updated.bio,
        authProvider: updated.authProvider || "local",
        preferences: updated.preferences,
      });
      await refreshUser().catch(() => {});
      setMessage("Profile photo updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Photo upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function toggleNotif(key: keyof typeof notifPrefs) {
    setNotifPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("studymind_notification_prefs", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const initials = (name || user?.name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <PageShell inset header={<TopBar title="Profile Settings" subtitle="Manage your account and alerts" />}>
      <div className="mx-auto w-full max-w-3xl space-y-4 pb-2">
        {error ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            {message}
          </p>
        ) : null}

        <Tabs.Root defaultValue="account">
          <Tabs.List className="mb-4 flex w-fit flex-wrap gap-1 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-subtle)] p-1">
            <Tabs.Trigger value="account" className={tabTrigger}>
              Account
            </Tabs.Trigger>
            <Tabs.Trigger value="notifications" className={tabTrigger}>
              Notifications
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="account" className="outline-none">
            <GlassCard className="space-y-6 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-4 border-b border-[var(--panel-divider)] pb-5">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#f0d08a] via-[#c9a84c] to-[#8a6420] text-xl font-bold text-[#1a1408] shadow-md shadow-[#c9a84c]/25">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  {!isGoogle ? (
                    <button
                      type="button"
                      aria-label="Upload profile photo"
                      disabled={uploading}
                      onClick={() => fileRef.current?.click()}
                      className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--surface-solid)] text-[#e2b96f] shadow-sm transition hover:bg-[var(--panel-hover)] disabled:opacity-60"
                    >
                      {uploading ? (
                        <span className="h-3.5 w-3.5 animate-pulse rounded-full bg-[#c9a84c]" />
                      ) : (
                        <Camera className="h-3.5 w-3.5" />
                      )}
                    </button>
                  ) : null}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => void onAvatarSelected(e.target.files?.[0])}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold">{name || user?.name || "Your profile"}</h2>
                  <p className="truncate text-sm text-muted">{user?.email}</p>
                  <p className="mt-1 text-xs text-muted">
                    {isGoogle
                      ? "Signed in with Google — profile photo synced from your Google account."
                      : avatarUrl
                        ? "Custom profile photo"
                        : "Add a profile photo to personalize your account."}
                  </p>
                  {!isGoogle ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="mt-2"
                      disabled={uploading}
                      onClick={() => fileRef.current?.click()}
                    >
                      <Camera className="h-3.5 w-3.5" />
                      {uploading ? "Uploading…" : avatarUrl ? "Change photo" : "Add photo"}
                    </Button>
                  ) : (
                    <span className="mt-2 inline-flex items-center rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-2.5 py-1 text-[11px] font-medium text-[#e2b96f]">
                      Google account
                    </span>
                  )}
                </div>
              </div>

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-[#c9a84c]" />
                  <h3 className="text-sm font-semibold">Personal details</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <label className="mb-1.5 block text-xs font-medium text-muted">Full name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="mb-1.5 block text-xs font-medium text-muted">Email</label>
                    <Input value={user?.email || ""} disabled />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-muted">Bio</label>
                    <Input
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="A short line about your study goals"
                    />
                  </div>
                </div>
              </section>

              {isGoogle ? (
                <section className="space-y-2 border-t border-[var(--panel-divider)] pt-5">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-[#c9a84c]" />
                    <h3 className="text-sm font-semibold">Password</h3>
                  </div>
                  <p className="text-xs leading-relaxed text-muted">
                    You signed in with Google, so password changes are managed in your Google account.
                  </p>
                </section>
              ) : (
                <section className="space-y-4 border-t border-[var(--panel-divider)] pt-5">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-[#c9a84c]" />
                    <div>
                      <h3 className="text-sm font-semibold">Password</h3>
                      <p className="text-xs text-muted">Leave blank if you don&apos;t want to change it.</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <PasswordField
                      label="Current password"
                      value={password}
                      onChange={setPassword}
                      placeholder="Enter current password"
                    />
                    <PasswordField
                      label="New password"
                      value={newPassword}
                      onChange={setNewPassword}
                      placeholder="Enter new password"
                    />
                  </div>
                </section>
              )}

              <div className="flex justify-end border-t border-[var(--panel-divider)] pt-5">
                <Button onClick={() => void saveAccount()} disabled={saving || !name.trim()}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </GlassCard>
          </Tabs.Content>

          <Tabs.Content value="notifications" className="outline-none">
            <GlassCard className="space-y-1 p-5 sm:p-6">
              <div className="mb-4 border-b border-[var(--panel-divider)] pb-4">
                <h2 className="text-sm font-semibold text-foreground">Notification preferences</h2>
                <p className="mt-1 text-xs text-muted">
                  Choose which alerts StudyMind can send you. You can change these anytime.
                </p>
              </div>
              {(
                [
                  {
                    key: "studyReminders" as const,
                    title: "Study reminders",
                    description:
                      "Get notified when a planner task is due so you stay on track with your schedule.",
                  },
                  {
                    key: "quizResults" as const,
                    title: "Quiz results",
                    description:
                      "Receive updates when a quiz is completed, including your score and weak topics.",
                  },
                  {
                    key: "groupMessages" as const,
                    title: "Group messages",
                    description:
                      "Stay informed about new messages, announcements, and activity in your study groups.",
                  },
                  {
                    key: "weeklyReport" as const,
                    title: "Weekly progress report",
                    description:
                      "A summary of your study activity, progress, and goals at the end of each week.",
                  },
                ]
              ).map((item) => {
                const on = notifPrefs[item.key];
                return (
                  <div
                    key={item.key}
                    className="flex items-start justify-between gap-4 rounded-xl px-2 py-3.5 transition hover:bg-[var(--panel-subtle)] sm:px-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.description}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      aria-label={`${item.title}: ${on ? "On" : "Off"}`}
                      onClick={() => toggleNotif(item.key)}
                      className={cn(
                        "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition",
                        on ? "bg-[#c9a84c]" : "bg-white/15"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 rounded-full bg-white shadow transition",
                          on ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                );
              })}
            </GlassCard>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </PageShell>
  );
}
