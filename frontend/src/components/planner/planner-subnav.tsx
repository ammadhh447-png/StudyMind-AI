"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { label: "Today's plan", href: "/planner", match: (p: string) => p === "/planner" || p === "/planner/today" },
  { label: "This week", href: "/planner/week", match: (p: string) => p === "/planner/week" },
];

export function PlannerSubNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-white/10 pb-3"
      aria-label="Study planner views"
    >
      {links.map((link) => {
        const active = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition",
              active
                ? "bg-gradient-to-r from-[#f0d08a] via-[#c9a84c] to-[#a07830] text-[#1a1408] shadow-md shadow-[#c9a84c]/40"
                : "text-muted hover:bg-[var(--panel-hover)] hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
