"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { GroupDashboard } from "@/components/groups/group-dashboard";

export default function GroupDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <PageShell
      inset
      scrollBody
      header={
        <Link
          href="/groups"
          className="inline-flex items-center gap-1 text-xs text-violet-300/90 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All study groups
        </Link>
      }
    >
      <GroupDashboard groupId={id} />
    </PageShell>
  );
}
