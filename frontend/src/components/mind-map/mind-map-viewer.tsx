"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, GitBranch, Layers } from "lucide-react";
import type { MindMapRecord } from "@/lib/api";
import {
  MindMapCanvas,
  MindMapOutline,
  buildMindMapTree,
} from "@/components/mind-map/mind-map-canvas";
import { cn } from "@/lib/utils";

export { MindMapCardPreview } from "@/components/mind-map/mind-map-canvas";

export function MindMapViewer({ map: initialMap }: { map: MindMapRecord }) {
  const [map, setMap] = useState(initialMap);

  useEffect(() => {
    setMap(initialMap);
  }, [initialMap]);

  const root = useMemo(() => buildMindMapTree(map.nodes), [map.nodes]);
  const [selectedId, setSelectedId] = useState<string | null>(root?.id ?? null);

  useEffect(() => {
    if (root && selectedId && !map.nodes.some((n) => n.id === selectedId)) {
      setSelectedId(root.id);
    }
  }, [map.nodes, root, selectedId]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return map.nodes.find((n) => n.id === selectedId) ?? null;
  }, [map.nodes, selectedId]);

  const parentLabel = useMemo(() => {
    if (!selected?.parentId) return null;
    return map.nodes.find((n) => n.id === selected.parentId)?.label ?? null;
  }, [map.nodes, selected]);

  const branchCount = root?.children?.length ?? 0;
  const nodeCount = map.nodes.length;

  if (!root) {
    return <p className="text-sm text-muted">This mind map has no nodes yet.</p>;
  }

  const role =
    !selected?.parentId || selected.id === root.id
      ? "Central topic"
      : root.children?.some((c) => c.id === selected.id)
        ? "Main branch"
        : "Subtopic";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden px-1 sm:px-2">
      <header className="mb-3 flex shrink-0 flex-wrap items-end justify-between gap-3 border-b border-white/8 pb-3">
        <div>
          <Link
            href="/mind-maps"
            className="mb-1.5 inline-flex items-center gap-1 text-xs text-[#e2b96f] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All mind maps
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">{map.title}</h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1">
              <GitBranch className="h-3.5 w-3.5" />
              {branchCount} branches
            </span>
            <span className="inline-flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              {nodeCount} nodes
            </span>
          </p>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_min(320px,30%)] lg:gap-8">
        <section className="glass-panel flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5">
            <p className="text-sm font-medium">Concept map</p>
          </div>
          <div className="min-h-0 flex-1 p-3 sm:p-4">
            <MindMapCanvas
              map={map}
              selectedId={selectedId}
              onSelect={setSelectedId}
              className="h-full"
            />
          </div>
        </section>

        <aside className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:border-l lg:border-white/8 lg:pl-6">
          <section className="glass-panel flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
            <div className="shrink-0 border-b border-white/8 px-4 py-2.5">
              <p className="text-sm font-medium">Topics</p>
              <p className="text-[11px] text-muted">Structured outline of this map</p>
            </div>
            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-3">
              <MindMapOutline map={map} selectedId={selectedId} onSelect={setSelectedId} />
            </div>
          </section>

          <section className="glass-panel shrink-0 rounded-2xl p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Selected node</p>
            {selected ? (
              <>
                <div className="mt-2 flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold leading-snug text-foreground">
                    {selected.label}
                  </h2>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                      role === "Central topic"
                        ? "border-violet-400/40 bg-[#c9a84c]/15 text-[#f0d08a]"
                        : role === "Main branch"
                          ? "border-white/15 bg-white/5 text-foreground/80"
                          : "border-white/10 bg-white/[0.03] text-muted"
                    )}
                  >
                    {role}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                  {selected.detail?.trim()
                    ? selected.detail
                    : role === "Central topic"
                      ? "Main theme of this mind map. Explore the colored branches around it."
                      : role === "Main branch"
                        ? "Key category linked to the central topic."
                        : "Supporting idea under its parent branch."}
                </p>
                {parentLabel ? (
                  <p className="mt-3 text-xs text-muted">
                    Parent:{" "}
                    <button
                      type="button"
                      className="text-[#e2b96f] hover:underline"
                      onClick={() => selected.parentId && setSelectedId(selected.parentId)}
                    >
                      {parentLabel}
                    </button>
                  </p>
                ) : null}
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">Select a node to see details.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
