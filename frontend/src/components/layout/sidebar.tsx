"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain } from "lucide-react";
import { mainNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 w-[232px] shrink-0 flex-col overflow-hidden",
        "border-r border-[var(--border)] bg-[var(--surface-solid)]/80",
        "sm:w-[240px] lg:w-[252px]"
      )}
    >
      <div className="flex h-full min-h-0 flex-col px-2.5 py-3 sm:px-3 sm:py-3.5 lg:px-3.5">
        <Link
          href="/dashboard"
          prefetch={false}
          className="mb-3 flex shrink-0 items-center gap-2.5 rounded-xl px-2 py-1.5 sm:mb-4"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#f0d08a] via-[#c9a84c] to-[#8a6420] shadow-lg shadow-[#c9a84c]/45 sm:h-10 sm:w-10">
            <Brain className="h-4 w-4 text-white sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">StudyMind AI</p>
            <p className="truncate text-[10px] text-muted sm:text-[11px]">Learning Assistant</p>
          </div>
        </Link>

        <nav
          className="flex min-h-0 flex-1 flex-col gap-px overflow-hidden sm:gap-0.5"
          aria-label="Main navigation"
        >
          {mainNav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} prefetch={false} className="flex min-h-0 flex-1">
                <span
                  className={cn(
                    "flex w-full min-h-[2rem] items-center gap-2.5 rounded-lg px-2.5 text-[13px] leading-tight transition-colors sm:min-h-[2.25rem] sm:gap-3 sm:rounded-xl sm:px-3 sm:text-sm",
                    active
                      ? "bg-gradient-to-r from-[#f0d08a]/95 via-[#c9a84c]/90 to-[#a07830]/85 font-medium text-[#1a1408] shadow-md shadow-[#c9a84c]/40"
                      : "text-muted hover:bg-[var(--panel-hover)] hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" />
                  <span className="truncate">{item.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
