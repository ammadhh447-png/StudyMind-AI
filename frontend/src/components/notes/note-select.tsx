"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NoteRecord } from "@/lib/api";

type NoteSelectProps = {
  notes: NoteRecord[];
  value: string;
  onChange: (noteId: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
};

export function NoteSelect({
  notes,
  value,
  onChange,
  placeholder = "Select",
  className,
  triggerClassName,
}: NoteSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = notes.find((n) => n._id === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative min-w-0", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-9 w-full max-w-md items-center justify-between gap-2 truncate rounded-lg border border-[#c9a84c]/25 bg-white/[0.04] px-3 text-left text-sm outline-none transition hover:border-[#c9a84c]/40 focus:border-[#c9a84c]/50 focus:ring-2 focus:ring-[#c9a84c]/25",
          triggerClassName
        )}
      >
        <span className={cn("truncate", selected ? "text-foreground" : "text-muted")}>
          {selected ? selected.title : placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition", open && "rotate-180")} />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-40 mt-1 max-h-56 overflow-y-auto rounded-lg border border-[var(--dropdown-border)] bg-[var(--dropdown-bg)] py-1 shadow-xl"
        >
          <li>
            <button
              type="button"
              role="option"
              aria-selected={!value}
              className={cn(
                "flex w-full px-3 py-2 text-left text-sm transition hover:bg-[var(--panel-hover)]",
                !value ? "text-foreground" : "text-muted"
              )}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              {placeholder}
            </button>
          </li>
          {notes.map((n) => (
            <li key={n._id}>
              <button
                type="button"
                role="option"
                aria-selected={value === n._id}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition hover:bg-[var(--panel-hover)]",
                  value === n._id ? "bg-[#c9a84c]/15 text-[var(--accent-text-strong)]" : "text-foreground"
                )}
                onClick={() => {
                  onChange(n._id);
                  setOpen(false);
                }}
              >
                <span className="truncate">{n.title}</span>
                <span className="shrink-0 text-[10px] text-muted">{n.fileType}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
