export function safeAuthRedirect(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  return next;
}

export function buildInviteJoinUrl(inviteCode: string): string {
  if (typeof window === "undefined") return "";
  const code = inviteCode.trim().toUpperCase();
  return `${window.location.origin}/groups/join?code=${encodeURIComponent(code)}`;
}
