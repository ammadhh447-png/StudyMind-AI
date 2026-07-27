"use client";

import Link from "next/link";
import {
  Brain,
  CalendarCheck,
  LineChart,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const AUTH_FIT_MIN_SCALE = 0.72;

function AuthFitPanel({ children }: { children: React.ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    const box = boxRef.current;
    if (!viewport || !content || !box) return;

    content.style.transform = "none";
    box.style.height = "";

    const needH = content.offsetHeight;
    const needW = content.offsetWidth;
    const availH = viewport.clientHeight;
    const availW = viewport.clientWidth;

    let scale = 1;
    if (needH > availH && availH > 0) scale = Math.min(scale, availH / needH);
    if (needW > availW && availW > 0) scale = Math.min(scale, availW / needW);
    scale = Math.max(AUTH_FIT_MIN_SCALE, Math.min(1, scale));

    if (scale < 1) {
      box.style.height = `${needH * scale}px`;
      content.style.transform = `scale(${scale})`;
      content.style.transformOrigin = "top center";
    }
  }, []);

  useLayoutEffect(() => {
    measure();
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(viewport);
    ro.observe(content);
    return () => ro.disconnect();
  }, [measure]);

  return (
    <div
      ref={viewportRef}
      className="flex min-h-0 w-full flex-1 flex-col items-center justify-center overflow-hidden px-4 py-3 sm:px-6 sm:py-4"
    >
      <div ref={boxRef} className="w-full max-w-[520px] shrink-0">
        <div ref={contentRef} className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
}

const sidebarFeatures: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Sparkles,
    title: "AI Powered",
    description: "Smart summaries, quizzes, and tutoring from your notes.",
  },
  {
    icon: Users,
    title: "Study Together",
    description: "Groups, shared files, chat, and collaborative planning.",
  },
  {
    icon: LineChart,
    title: "Track Progress",
    description: "Analytics, weak topics, and streaks to stay on target.",
  },
  {
    icon: CalendarCheck,
    title: "Plan & Achieve",
    description: "Planner, tasks, and exam-ready revision workflows.",
  },
];

type AuthShellProps = {
  children: React.ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div data-auth-page className="flex h-dvh max-h-dvh w-full overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
        <aside className="relative hidden h-full min-h-0 w-full max-w-[400px] shrink-0 flex-col justify-between overflow-hidden bg-gradient-to-b from-[#14110c] via-[#1c1812] to-[#0f0d0a] px-8 py-8 text-white lg:flex xl:max-w-[440px]">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(rgba(201,168,76,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.08) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="pointer-events-none absolute -right-20 top-1/3 h-64 w-64 rounded-full bg-[#c9a84c]/20 blur-[80px]" />

          <div className="relative min-h-0 overflow-hidden">
            <Link href="/login" className="inline-flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9a84c] shadow-lg shadow-black/40">
                <Brain className="h-5 w-5 text-[#1a1408]" />
              </div>
              <span className="text-lg font-semibold tracking-tight">StudyMind AI</span>
            </Link>

            <h1 className="mt-8 text-2xl font-bold leading-tight xl:text-[1.85rem]">
              Smarter Learning
              <br />
              <span className="bg-gradient-to-r from-[#e2b96f] to-[#c9a84c] bg-clip-text text-transparent">
                Better Tomorrow
              </span>
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#f0d08a]/75">
              Your AI-powered study partner — upload materials, get instant help, and master every
              subject with confidence.
            </p>

            <ul className="mt-6 space-y-3">
              {sidebarFeatures.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
                    <item.icon className="h-4 w-4 text-[#f0d08a]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs leading-relaxed text-[#f0d08a]/70">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative shrink-0 pt-4 text-center font-serif text-xs italic text-[#f0d08a]/90">
            &ldquo;The beautiful thing about learning is that no one can take it away from you.&rdquo;
          </p>
        </aside>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <AuthFitPanel>
            <div className="mb-[var(--auth-mobile-logo-gap)] flex w-full shrink-0 items-center lg:hidden">
              <Link href="/login" className="inline-flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c9a84c] sm:h-9 sm:w-9">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-[var(--auth-text)] sm:text-base">
                  StudyMind AI
                </span>
              </Link>
            </div>
            {children}
          </AuthFitPanel>
        </main>
      </div>
    </div>
  );
}

export function AuthCard({
  children,
  className,
  compact,
}: {
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      data-auth-form={compact ? "signup" : undefined}
      className={cn(
        "flex flex-col gap-[var(--auth-section-gap)]",
        "rounded-[var(--auth-card-radius)] border shadow-[0_8px_40px_-12px_rgba(15,23,42,0.12)]",
        "border-[var(--auth-card-border)] bg-[var(--auth-card)]",
        "px-[var(--auth-card-px)] py-[var(--auth-card-py)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="relative my-[var(--auth-divider-my)]">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-[var(--auth-divider)]" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-[var(--auth-card)] px-3 text-xs font-medium text-[var(--auth-muted)]">
          or continue with
        </span>
      </div>
    </div>
  );
}

export function AuthFooterLink({
  prompt,
  linkHref,
  linkLabel,
}: {
  prompt: string;
  linkHref: string;
  linkLabel: string;
}) {
  return (
    <p className="mt-[var(--auth-footer-mt)] text-center text-[var(--auth-footer-size)] text-[var(--auth-text-secondary)]">
      {prompt}{" "}
      <Link href={linkHref} className="text-[length:var(--auth-button-text-size)] font-semibold text-[var(--auth-accent)] hover:underline">
        {linkLabel}
      </Link>
    </p>
  );
}

export function AuthSecureNote() {
  return (
    <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-[var(--auth-muted)]">
      Secure login · Your data is protected
    </p>
  );
}

export function passwordStrengthMeta(password: string) {
  if (!password) return { label: "", pct: 0, color: "bg-gray-400", text: "text-[var(--auth-muted)]" };
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  const pct = Math.min(100, (score / 5) * 100);
  if (score <= 2) return { label: "Weak", pct, color: "bg-red-400", text: "text-red-500" };
  if (score <= 3) return { label: "Fair", pct, color: "bg-amber-400", text: "text-amber-600" };
  if (score <= 4) return { label: "Good", pct, color: "bg-lime-500", text: "text-lime-600" };
  return { label: "Strong", pct, color: "bg-emerald-500", text: "text-emerald-600" };
}
