"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Copy, Download, Focus, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import type { MindMapRecord } from "@/lib/api";
import { cn } from "@/lib/utils";

export type MindMapNode = MindMapRecord["nodes"][number] & {
  detail?: string;
  children?: MindMapNode[];
};

export const BRANCH_COLORS = [
  { fill: "#3d2414", stroke: "#f97316", line: "#f97316", name: "Orange" },
  { fill: "#3b1420", stroke: "#ef4444", line: "#ef4444", name: "Red" },
  { fill: "#14301f", stroke: "#22c55e", line: "#22c55e", name: "Green" },
  { fill: "#12283a", stroke: "#38bdf8", line: "#38bdf8", name: "Blue" },
] as const;

export function buildMindMapTree(nodes: MindMapRecord["nodes"]): MindMapNode | null {
  if (!nodes.length) return null;

  const enriched: MindMapNode[] = nodes.map((n) => ({ ...n, children: [] }));
  const byId = new Map(enriched.map((n) => [n.id, n]));

  let root: MindMapNode | null =
    enriched.find((n) => n.id === "root") ?? enriched.find((n) => !n.parentId) ?? null;

  for (const node of enriched) {
    if (node === root) continue;
    if (!node.parentId) {
      if (!root) root = node;
      continue;
    }
    const parent = byId.get(node.parentId);
    if (parent) parent.children!.push(node);
    else if (root) root.children!.push(node);
  }

  return root ?? enriched[0];
}

type PlacedNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  role: "root" | "branch" | "leaf";
  colorIndex: number;
  order?: string;
};

type Edge = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  colorIndex: number;
};

type LayoutResult = {
  placed: PlacedNode[];
  edges: Edge[];
  width: number;
  height: number;
};

function shortLabel(text: string, max: number) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function measure(label: string, role: PlacedNode["role"], compact: boolean) {
  const maxChars = compact ? (role === "root" ? 12 : 10) : role === "root" ? 28 : role === "branch" ? 18 : 20;
  const shown = shortLabel(label, maxChars);
  const charW = compact ? 5.5 : 6.4;
  const pad = compact ? 16 : 28;
  const minW = compact ? (role === "root" ? 64 : 54) : role === "root" ? 140 : role === "branch" ? 110 : 100;
  const maxW = compact ? 80 : role === "root" ? 220 : 160;
  const w = Math.min(maxW, Math.max(minW, shown.length * charW + pad));
  const h = compact ? (role === "root" ? 26 : 20) : role === "root" ? 44 : 40;
  return { w, h, shown };
}

function computeLayout(root: MindMapNode, compact: boolean): LayoutResult {
  const W = compact ? 340 : 960;
  const H = compact ? 170 : 480;
  const pad = compact ? 10 : 36;
  const leafGap = compact ? 22 : 42;
  const cx = W / 2;
  const cy = H / 2;

  const branches = (root.children ?? []).slice(0, 4);

  const placed: PlacedNode[] = [];
  const edges: Edge[] = [];

  const rootM = measure(root.label, "root", compact);
  placed.push({
    id: root.id,
    label: rootM.shown,
    x: cx,
    y: cy,
    w: rootM.w,
    h: rootM.h,
    role: "root",
    colorIndex: -1,
  });

  const quadrants: Array<{
    side: "left" | "right";
    vertical: "top" | "bottom";
    branchX: number;
    leafX: number;
  }> = [
    {
      side: "left",
      vertical: "top",
      branchX: compact ? 110 : 300,
      leafX: compact ? 48 : 132,
    },
    {
      side: "right",
      vertical: "top",
      branchX: compact ? W - 110 : W - 300,
      leafX: compact ? W - 48 : W - 120,
    },
    {
      side: "left",
      vertical: "bottom",
      branchX: compact ? 110 : 300,
      leafX: compact ? 48 : 132,
    },
    {
      side: "right",
      vertical: "bottom",
      branchX: compact ? W - 110 : W - 300,
      leafX: compact ? W - 48 : W - 120,
    },
  ];

  branches.forEach((branch, qi) => {
    const q = quadrants[qi];
    const colorIndex = qi % BRANCH_COLORS.length;
    const maxLeaves = compact ? 3 : 5;
    const leaves = (branch.children ?? []).slice(0, maxLeaves);
    const bm = measure(branch.label, "branch", compact);
    const leafBlockH = Math.max(leaves.length - 1, 0) * leafGap;
    const quadrantMidY =
      q.vertical === "top"
        ? pad + 48 + leafBlockH / 2
        : H - pad - 48 - leafBlockH / 2;

    const branchY = quadrantMidY;

    placed.push({
      id: branch.id,
      label: bm.shown,
      x: q.branchX,
      y: branchY,
      w: bm.w,
      h: bm.h,
      role: "branch",
      colorIndex,
      order: String(qi + 1),
    });

    const rootEdgeX = q.side === "left" ? cx - rootM.w / 2 : cx + rootM.w / 2;
    const branchInnerX = q.side === "left" ? q.branchX + bm.w / 2 : q.branchX - bm.w / 2;
    edges.push({
      id: `r-${branch.id}`,
      x1: rootEdgeX,
      y1: cy,
      x2: branchInnerX,
      y2: branchY,
      colorIndex,
    });

    if (leaves.length === 0) return;

    const startY = branchY - leafBlockH / 2;
    leaves.forEach((leaf, li) => {
      const lm = measure(leaf.label, "leaf", compact);
      const leafY = startY + li * leafGap;
      placed.push({
        id: leaf.id,
        label: lm.shown,
        x: q.leafX,
        y: leafY,
        w: lm.w,
        h: lm.h,
        role: "leaf",
        colorIndex,
        order: `${qi + 1}.${li + 1}`,
      });

      const branchOuterX = q.side === "left" ? q.branchX - bm.w / 2 : q.branchX + bm.w / 2;
      const leafInnerX = q.side === "left" ? q.leafX + lm.w / 2 : q.leafX - lm.w / 2;
      edges.push({
        id: `${branch.id}-${leaf.id}`,
        x1: branchOuterX,
        y1: branchY,
        x2: leafInnerX,
        y2: leafY,
        colorIndex,
      });
    });
  });

  return { placed, edges, width: W, height: H };
}

type MindMapCanvasProps = {
  map: MindMapRecord;
  compact?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  hideToolbar?: boolean;
  className?: string;
};

export function MindMapCanvas({
  map,
  compact = false,
  selectedId,
  onSelect,
  hideToolbar = false,
  className,
}: MindMapCanvasProps) {
  const root = useMemo(() => buildMindMapTree(map.nodes), [map.nodes]);
  const layout = useMemo(() => (root ? computeLayout(root, compact) : null), [root, compact]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [toolbarMsg, setToolbarMsg] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(null);

  const flashToolbarMsg = useCallback((msg: string) => {
    setToolbarMsg(msg);
    window.setTimeout(() => setToolbarMsg(""), 1800);
  }, []);

  const copyOutline = useCallback(async () => {
    const tree = buildMindMapTree(map.nodes);
    if (!tree) return;
    const lines: string[] = [map.title, ""];
    tree.children?.slice(0, 4).forEach((b, i) => {
      lines.push(`${i + 1}. ${b.label}`);
      b.children?.slice(0, 5).forEach((c, j) => lines.push(`   ${i + 1}.${j + 1} ${c.label}`));
    });
    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      flashToolbarMsg("Copied");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      flashToolbarMsg("Copied");
    }
  }, [map, flashToolbarMsg]);

  const downloadText = useCallback(() => {
    const tree = buildMindMapTree(map.nodes);
    const lines: string[] = [map.title, ""];
    if (tree) {
      tree.children?.slice(0, 4).forEach((b, i) => {
        lines.push(`${i + 1}. ${b.label}${b.detail ? ` — ${b.detail}` : ""}`);
        b.children?.slice(0, 5).forEach((c, j) => {
          lines.push(`   ${i + 1}.${j + 1} ${c.label}${c.detail ? ` — ${c.detail}` : ""}`);
        });
      });
    } else {
      map.nodes.forEach((n) => lines.push(`${n.label}${n.detail ? `: ${n.detail}` : ""}`));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(map.title || "mindmap").replace(/\s+/g, "-").toLowerCase()}-mindmap.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    flashToolbarMsg("Downloaded");
  }, [map, flashToolbarMsg]);

  const fitView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = stageRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
        flashToolbarMsg("Fullscreen");
      } else {
        await document.exitFullscreen();
        flashToolbarMsg("Exit fullscreen");
      }
    } catch {
      flashToolbarMsg("Fullscreen unavailable");
    }
  }, [flashToolbarMsg]);

  if (!root || !layout) {
    return (
      <div className={cn("flex h-32 items-center justify-center text-xs text-muted", className)}>
        No nodes
      </div>
    );
  }

  const { placed, edges, width, height } = layout;
  const uid = compact ? "mmc" : "mm";
  const stageScale = compact ? Math.min(1, 300 / width, 120 / height) : zoom;

  return (
    <div className={cn("relative flex h-full min-h-0 flex-col", className)}>
      <div
        ref={stageRef}
        className={cn(
          "relative min-h-0 overflow-hidden rounded-xl",
          compact ? "h-[140px] bg-transparent" : "flex-1 bg-[var(--canvas-bg)]"
        )}
        onPointerDown={(e) => {
          if (compact) return;
          const target = e.target as HTMLElement;
          if (target.closest("[data-map-node], button")) return;
          dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, moved: false };
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!dragRef.current || compact) return;
          const dx = e.clientX - dragRef.current.x;
          const dy = e.clientY - dragRef.current.y;
          if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
          setPan({
            x: dragRef.current.px + dx,
            y: dragRef.current.py + dy,
          });
        }}
        onPointerUp={() => {
          dragRef.current = null;
        }}
      >
        {!compact && !hideToolbar ? (
          <div className="absolute right-3 top-3 z-30 flex items-center gap-0.5 rounded-lg border border-[var(--panel-border)] bg-[var(--surface-solid)] p-0.5 shadow-lg">
            {[
              {
                icon: ZoomIn,
                label: "Zoom in",
                onClick: () => setZoom((z) => Math.min(1.4, +(z + 0.1).toFixed(2))),
              },
              {
                icon: ZoomOut,
                label: "Zoom out",
                onClick: () => setZoom((z) => Math.max(0.7, +(z - 0.1).toFixed(2))),
              },
              { icon: Focus, label: "Fit view", onClick: fitView },
              {
                icon: Maximize2,
                label: "Full page",
                onClick: () => {
                  void toggleFullscreen();
                },
              },
              {
                icon: Copy,
                label: "Copy",
                onClick: () => {
                  void copyOutline();
                },
              },
              { icon: Download, label: "Download", onClick: downloadText },
            ].map(({ icon: Icon, label, onClick }) => (
              <button
                key={label}
                type="button"
                title={label}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClick();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="rounded-md p-1.5 text-muted transition hover:bg-[var(--panel-hover)] hover:text-foreground"
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        ) : null}
        {!compact && toolbarMsg ? (
          <div className="pointer-events-none absolute left-3 top-3 z-30 rounded-md border border-[var(--panel-border)] bg-[var(--surface-solid)] px-2 py-1 text-[11px] text-[#e2b96f]">
            {toolbarMsg}
          </div>
        ) : null}

        <div
          className={cn(
            "absolute left-1/2 top-1/2 origin-center",
            !compact && "cursor-grab active:cursor-grabbing"
          )}
          style={{
            width,
            height,
            transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${stageScale})`,
          }}
        >
          <svg
            width={width}
            height={height}
            className="absolute inset-0 pointer-events-none"
            role="img"
            aria-label={`Mind map: ${map.title}`}
          >
            <defs>
              {BRANCH_COLORS.map((c, i) => (
                <marker
                  key={i}
                  id={`${uid}-arrow-${i}`}
                  markerWidth="7"
                  markerHeight="7"
                  refX="6"
                  refY="3.5"
                  orient="auto"
                >
                  <path d="M0,0 L7,3.5 L0,7 Z" fill={c.line} />
                </marker>
              ))}
            </defs>
            {edges.map((e) => {
              const color = BRANCH_COLORS[e.colorIndex] ?? BRANCH_COLORS[0];
              const midX = (e.x1 + e.x2) / 2;
              const d = `M ${e.x1} ${e.y1} L ${midX} ${e.y1} L ${midX} ${e.y2} L ${e.x2} ${e.y2}`;
              return (
                <path
                  key={e.id}
                  d={d}
                  fill="none"
                  stroke={color.line}
                  strokeWidth={compact ? 1.2 : 1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.9}
                  markerEnd={`url(#${uid}-arrow-${e.colorIndex})`}
                />
              );
            })}
          </svg>

          {placed.map((p) => {
            const selected = selectedId === p.id;
            const isRoot = p.role === "root";
            const color = isRoot
              ? { fill: "#1e1635", stroke: "#c4b5fd" }
              : BRANCH_COLORS[p.colorIndex] ?? BRANCH_COLORS[0];

            return (
              <div
                key={p.id}
                data-map-node={p.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (dragRef.current?.moved) return;
                  onSelect?.(p.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelect?.(p.id);
                }}
                className={cn(
                  "absolute flex items-center justify-center rounded-lg px-2.5 text-slate-50",
                  onSelect && !compact ? "cursor-pointer" : "cursor-default",
                  selected && "ring-1 ring-white/70"
                )}
                style={{
                  left: p.x - p.w / 2,
                  top: p.y - p.h / 2,
                  width: p.w,
                  height: p.h,
                  background: color.fill,
                  fontSize: compact ? (isRoot ? 8 : 7) : isRoot ? 13 : 11,
                  fontWeight: isRoot ? 600 : 500,
                }}
              >
                <span className="min-w-0 truncate text-center leading-none">{p.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function flattenTree(root: MindMapNode): MindMapRecord["nodes"] {
  const out: MindMapRecord["nodes"] = [];
  function walk(n: MindMapNode, parentId: string | null) {
    out.push({ id: n.id, label: n.label, parentId, detail: n.detail });
    n.children?.forEach((c) => walk(c, n.id));
  }
  walk(root, null);
  return out;
}

export function MindMapCardPreview({ map }: { map: MindMapRecord }) {
  const root = buildMindMapTree(map.nodes);
  if (!root) return null;
  const previewRoot: MindMapNode = {
    ...root,
    children: (root.children ?? []).slice(0, 4).map((c) => ({
      ...c,
      children: (c.children ?? []).slice(0, 3),
    })),
  };
  return (
    <div className="pointer-events-none select-none">
      <MindMapCanvas map={{ ...map, nodes: flattenTree(previewRoot) }} compact className="h-[132px]" />
    </div>
  );
}

export function MindMapOutline({
  map,
  selectedId,
  onSelect,
}: {
  map: MindMapRecord;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const root = useMemo(() => buildMindMapTree(map.nodes), [map.nodes]);
  if (!root) return null;

  return (
    <div className="space-y-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => onSelect?.(root.id)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition",
            selectedId === root.id
              ? "border-violet-400/50 bg-[#c9a84c]/15"
              : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
          )}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#c9a84c]/20 text-[10px] font-bold text-[#f0d08a]">
            ●
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{root.label}</p>
            <p className="text-[11px] text-muted">Central topic</p>
          </div>
        </button>
      </div>

      {root.children?.slice(0, 4).map((branch, i) => {
        const color = BRANCH_COLORS[i % BRANCH_COLORS.length];
        const leaves = branch.children?.slice(0, 5) ?? [];
        return (
          <div
            key={branch.id}
            className="relative overflow-visible rounded-xl border border-white/8 bg-white/[0.02]"
            style={{ borderLeftWidth: 3, borderLeftColor: color.stroke }}
          >
            <button
              type="button"
              onClick={() => onSelect?.(branch.id)}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition",
                selectedId === branch.id ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"
              )}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold"
                style={{ background: `${color.stroke}22`, color: color.stroke }}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{branch.label}</p>
                <p className="text-[11px] text-muted">
                  {leaves.length} subtopic{leaves.length === 1 ? "" : "s"}
                </p>
              </div>
            </button>
            {leaves.length > 0 ? (
              <ul className="space-y-0.5 border-t border-white/5 px-2 py-1.5">
                {leaves.map((leaf, j) => (
                  <li key={leaf.id}>
                    <button
                      type="button"
                      onClick={() => onSelect?.(leaf.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition",
                        selectedId === leaf.id
                          ? "bg-white/10 text-foreground"
                          : "text-muted hover:bg-white/[0.04] hover:text-foreground/90"
                      )}
                    >
                      <span className="w-7 shrink-0 font-medium tabular-nums" style={{ color: color.stroke }}>
                        {i + 1}.{j + 1}
                      </span>
                      <span className="truncate">{leaf.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
