"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type MindMapNodeMenuProps = {
  onDelete: () => void;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
};

const menuButtonClass =
  "inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/30 bg-black/50 text-white shadow-sm transition hover:bg-black/70";

export function MindMapNodeMenu({
  onDelete,
  disabled,
  className,
  buttonClassName,
}: MindMapNodeMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const box = buttonRef.current.getBoundingClientRect();
    setPos({ top: box.bottom + 4, left: box.right });
  }, [open]);

  if (disabled) return null;

  return (
    <div className={cn("relative shrink-0", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Node options"
        data-node-menu
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className={cn(menuButtonClass, buttonClassName)}
      >
        <MoreVertical className="h-4 w-4" strokeWidth={2.5} />
      </button>
      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[80] overflow-hidden rounded-lg border border-[var(--dropdown-border)] bg-[var(--dropdown-bg)] p-1 shadow-xl"
              style={{ top: pos.top, left: pos.left, transform: "translateX(-100%)" }}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Delete"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-red-400 transition hover:bg-red-500/10"
                onClick={() => {
                  setOpen(false);
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4" strokeWidth={2.25} />
              </button>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

export function removeMindMapNode(
  nodes: { id: string; parentId: string | null }[],
  nodeId: string
): { id: string; label: string; parentId: string | null; detail?: string }[] {
  const toRemove = new Set<string>();
  function collect(id: string) {
    toRemove.add(id);
    nodes.filter((n) => n.parentId === id).forEach((n) => collect(n.id));
  }
  collect(nodeId);
  return nodes.filter((n) => !toRemove.has(n.id)) as {
    id: string;
    label: string;
    parentId: string | null;
    detail?: string;
  }[];
}
