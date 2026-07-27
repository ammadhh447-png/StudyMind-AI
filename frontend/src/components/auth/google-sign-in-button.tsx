"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/components/providers/auth-provider";

function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type GoogleSignInButtonProps = {
  onSuccess?: () => void;
  onError?: (message: string) => void;
  variant?: "dark" | "light";
};

export function GoogleSignInButton({
  onSuccess,
  onError,
  variant = "light",
}: GoogleSignInButtonProps) {
  const { googleLogin } = useAuth();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const containerRef = useRef<HTMLDivElement>(null);
  const [buttonWidth, setButtonWidth] = useState(0);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const update = () => {
      const w = Math.floor(node.getBoundingClientRect().width);
      setButtonWidth(Math.min(Math.max(w, 280), 520));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  async function handleCredential(credential: string | undefined) {
    try {
      if (!credential) {
        onError?.("Google did not return a credential");
        return;
      }
      await googleLogin(credential);
      onSuccess?.();
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Google sign-in failed");
    }
  }

  if (!clientId) {
    return (
      <button
        type="button"
        disabled
        className="flex h-[var(--auth-field-h)] w-full items-center justify-center gap-2.5 rounded-lg border border-gray-200 bg-gray-50 text-[length:var(--auth-label-size)] text-gray-400"
      >
        <GoogleMark />
        Continue with Google
      </button>
    );
  }

  if (variant === "light") {
    return (
      <div ref={containerRef} className="relative h-[var(--auth-field-h)] w-full">
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2.5 rounded-lg border text-[length:var(--auth-button-text-size)] font-semibold shadow-sm"
          style={{
            borderColor: "var(--auth-google-border)",
            background: "var(--auth-google-bg)",
            color: "var(--auth-google-text)",
          }}
          aria-hidden
        >
          <GoogleMark />
          Continue with Google
        </div>
        {buttonWidth > 0 ? (
          <div className="absolute inset-0 z-10 overflow-hidden rounded-lg opacity-0 [&>div]:!h-full [&>div]:!w-full">
            <GoogleLogin
              size="large"
              width={buttonWidth}
              theme="outline"
              shape="rectangular"
              text="continue_with"
              onSuccess={(r) => void handleCredential(r.credential)}
              onError={() => onError?.("Google sign-in failed")}
            />
          </div>
        ) : (
          <div className="absolute inset-0 animate-pulse rounded-lg bg-gray-100" />
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex w-full justify-center">
      {buttonWidth > 0 ? (
        <GoogleLogin
          size="large"
          width={buttonWidth}
          theme="filled_black"
          shape="rectangular"
          text="continue_with"
          onSuccess={(r) => void handleCredential(r.credential)}
          onError={() => onError?.("Google sign-in failed")}
        />
      ) : (
        <div className="h-11 w-full animate-pulse rounded-lg bg-white/5" />
      )}
    </div>
  );
}
