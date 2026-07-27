"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Lock, Mail, User } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { AuthField, AuthPrimaryButton } from "@/components/auth/auth-field";
import {
  AuthCard,
  AuthDivider,
  AuthFooterLink,
  AuthShell,
  passwordStrengthMeta,
} from "@/components/auth/auth-shell";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { safeAuthRedirect } from "@/lib/auth-redirect";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeAuthRedirect(searchParams.get("next"));
  const loginHref =
    next === "/dashboard" ? "/login" : `/login?next=${encodeURIComponent(next)}`;
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const strength = passwordStrengthMeta(password);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }
    setPending(true);
    try {
      await register(name, email, password);
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard compact>
      <h2 className="text-[length:var(--auth-title-size)] font-bold leading-tight text-[var(--auth-text)]">
        Sign up for <span className="text-[var(--auth-accent)]">StudyMind AI</span>
      </h2>

      <form className="space-y-[var(--auth-stack)]" onSubmit={onSubmit}>
        <AuthField
          id="signup-name"
          label="Full Name"
          icon={User}
          autoComplete="name"
          placeholder="Jane Doe"
          value={name}
          onChange={setName}
          required
        />
        <AuthField
          id="signup-email"
          label="Email Address"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="you@university.edu"
          value={email}
          onChange={setEmail}
          required
        />
        <div>
          <AuthField
            id="signup-password"
            label="Password"
            type="password"
            icon={Lock}
            autoComplete="new-password"
            placeholder="Create a strong password"
            value={password}
            onChange={setPassword}
            required
            minLength={6}
          />
          {password ? (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--auth-muted)]">Password strength</span>
                <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--auth-strength-track)]">
                <div
                  className={`h-full rounded-full transition-all ${strength.color}`}
                  style={{ width: `${strength.pct}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
        <AuthField
          id="signup-confirm"
          label="Confirm Password"
          type="password"
          icon={Lock}
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          required
          minLength={6}
        />

        <label className="flex cursor-pointer items-start gap-2 text-[length:var(--auth-label-size)] leading-snug text-[var(--auth-text-secondary)]">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--auth-input-border)] accent-[#c9a84c]"
          />
          <span>
            I agree to the{" "}
            <Link href="/login" className="font-medium text-[var(--auth-accent)] hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/login" className="font-medium text-[var(--auth-accent)] hover:underline">
              Privacy Policy
            </Link>
          </span>
        </label>

        {error ? (
          <div className="rounded-lg border border-[var(--auth-error-border)] bg-[var(--auth-error-bg)] px-3 py-2.5 text-sm text-[var(--auth-error-text)]">
            {error}
          </div>
        ) : null}

        <AuthPrimaryButton pending={pending}>
          {pending ? "Creating account..." : "Create Account"}
        </AuthPrimaryButton>
      </form>

      <AuthDivider />
      <GoogleSignInButton variant="light" onSuccess={() => router.push(next)} onError={setError} />

      <AuthFooterLink prompt="Already have an account?" linkHref={loginHref} linkLabel="Login" />
    </AuthCard>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <AuthCard>
            <p className="text-center text-sm text-[var(--auth-muted)]">Loading...</p>
          </AuthCard>
        </AuthShell>
      }
    >
      <AuthShell>
        <SignupForm />
      </AuthShell>
    </Suspense>
  );
}
