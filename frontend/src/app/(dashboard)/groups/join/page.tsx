"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import { groupsApi } from "@/lib/api";
import { PageShell } from "@/components/layout/page-shell";
import { TopBar } from "@/components/layout/top-bar";

function JoinForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [code, setCode] = useState(params.get("code")?.toUpperCase() ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const autoJoinStarted = useRef(false);

  useEffect(() => {
    const c = params.get("code");
    if (c) setCode(c.toUpperCase());
  }, [params]);

  const joinWithCode = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim().toUpperCase();
      if (!trimmed) return;
      setLoading(true);
      setError("");
      try {
        const { group } = await groupsApi.join(trimmed);
        router.push(`/groups/${group._id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not join");
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    const fromLink = params.get("code")?.trim();
    if (authLoading || !user || !fromLink || autoJoinStarted.current) return;
    autoJoinStarted.current = true;
    void joinWithCode(fromLink);
  }, [authLoading, user, params, joinWithCode]);

  return (
    <GlassCard className="mx-auto max-w-md">
      <h1 className="text-lg font-semibold">Join study group</h1>
      <p className="mt-1 text-sm text-muted">
        {params.get("code")
          ? "Confirm the invite code below or wait while we add you to the group."
          : "Enter the invite code shared by your group admin."}
      </p>
      <Input
        className="mt-4 font-mono uppercase tracking-widest"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="INVITE CODE"
      />
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
      <Button
        className="mt-4 w-full"
        disabled={loading || !code.trim()}
        onClick={() => void joinWithCode(code)}
      >
        {loading ? "Joining..." : "Join group"}
      </Button>
      <Link href="/groups" className="mt-4 block text-center text-sm text-[#e2b96f] hover:underline">
        Back to groups
      </Link>
    </GlassCard>
  );
}

export default function JoinGroupPage() {
  return (
    <Suspense fallback={<PageShell inset><p className="text-sm text-muted">Loading...</p></PageShell>}>
      <PageShell
        inset
        header={<TopBar title="Join group" subtitle="Enter an invite code from your study group" />}
      >
        <div className="flex justify-center py-2 sm:py-4">
          <JoinForm />
        </div>
      </PageShell>
    </Suspense>
  );
}
