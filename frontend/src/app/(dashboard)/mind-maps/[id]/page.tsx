"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { MindMapViewer } from "@/components/mind-map/mind-map-viewer";
import { mindMapsApi, type MindMapRecord } from "@/lib/api";

export default function MindMapDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [map, setMap] = useState<MindMapRecord | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    mindMapsApi
      .get(id)
      .then(({ map: data }) => setMap(data))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load mind map"));
  }, [id]);

  if (error) {
    return (
      <PageShell inset header={<TopBarMini title="Mind map" />}>
        <Link href="/mind-maps" className="text-sm text-violet-300 hover:underline">
          ← Back to mind maps
        </Link>
        <p className="mt-3 text-sm text-red-400">{error}</p>
      </PageShell>
    );
  }

  if (!map) {
    return (
      <PageShell inset>
        <p className="text-sm text-muted">Loading mind map...</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      scrollBody={false}
      inset
      bodyClassName="min-h-0"
      header={<TopBarMini title={map.title} />}
    >
      <MindMapViewer map={map} />
    </PageShell>
  );
}

function TopBarMini({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Link href="/mind-maps" className="text-xs text-violet-300 hover:underline">
        <ArrowLeft className="mr-1 inline h-3.5 w-3.5" />
        Mind maps
      </Link>
      <span className="text-muted">/</span>
      <span className="text-sm font-medium">{title}</span>
    </div>
  );
}
