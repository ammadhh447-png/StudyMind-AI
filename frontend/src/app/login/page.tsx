"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Lock, Mail } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { AuthField, AuthPrimaryButton } from "@/components/auth/auth-field";
import {
  AuthCard,
  AuthDivider,
  AuthFooterLink,
  AuthSecureNote,
  AuthShell,
} from "@/components/auth/auth-shell";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { safeAuthRedirect } from "@/lib/auth-redirect";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeAuthRedirect(searchParams.get("next"));
  const signupHref =
    next === "/dashboard"
      ? "/signup"
      : `/signup?next=${encodeURIComponent(next)}`;
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      await login(email, password);
      if (remember && typeof window !== "undefined") {
        window.localStorage.setItem("studymind_remember_email", email);
      }
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard>
      <h2 className="text-[length:var(--auth-title-size)] font-bold leading-tight text-[var(--auth-text)]">
        Login to <span className="text-[var(--auth-accent)]">StudyMind AI</span>
      </h2>

      <form className="space-y-[var(--auth-stack)]" onSubmit={onSubmit}>
        <AuthField
          id="login-email"
          label="Email Address"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="you@university.edu"
          value={email}
          onChange={setEmail}
          required
        />
        <AuthField
          id="login-password"
          label="Password"
          type="password"
          icon={Lock}
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={setPassword}
          required
        />

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--auth-text-secondary)]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--auth-input-border)] accent-[#c9a84c]"
            />
            Remember me
          </label>
          <Link href="/login" className="text-sm font-medium text-[var(--auth-accent)] hover:underline">
            Forgot password?
          </Link>
        </div>

        {error ? (
          <div className="rounded-lg border border-[var(--auth-error-border)] bg-[var(--auth-error-bg)] px-3 py-2.5 text-sm text-[var(--auth-error-text)]">
            {error}
          </div>
        ) : null}

        <AuthPrimaryButton pending={pending}>{pending ? "Signing in..." : "Login"}</AuthPrimaryButton>
      </form>

      <AuthDivider />
      <GoogleSignInButton variant="light" onSuccess={() => router.push(next)} onError={setError} />

      <AuthFooterLink prompt="Don't have an account?" linkHref={signupHref} linkLabel="Sign up" />
      <AuthSecureNote />
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <AuthCard>
            <p className="text-center text-sm text-gray-500">Loading...</p>
          </AuthCard>
        </AuthShell>
      }
    >
      <AuthShell>
        <LoginForm />
      </AuthShell>
    </Suspense>
  );
}
