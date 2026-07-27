"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { label: "Analytics", href: "/progress" },
  { label: "Weak topic analysis", href: "/progress/weak-topics" },
];

type ActivitySubNavProps = {
  embedded?: boolean;
};

export function ActivitySubNav({ embedded }: ActivitySubNavProps = {}) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex flex-wrap gap-2 border-b border-white/10 pb-3",
        embedded ? "mb-4" : undefined
      )}
      aria-label="Progress and activity"
    >
      {links.map((link) => {
        const active = pathname === link.href;
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
