"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/components/providers/auth-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  const tree = <AuthProvider>{children}</AuthProvider>;

  if (!clientId) {
    return tree;
  }

  return <GoogleOAuthProvider clientId={clientId}>{tree}</GoogleOAuthProvider>;
}
