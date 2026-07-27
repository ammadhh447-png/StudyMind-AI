"use client";

import { useState } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthFieldProps = {
  id: string;
  label: string;
  type?: string;
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
};

export function AuthField({
  id,
  label,
  type = "text",
  icon: Icon,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  minLength,
}: AuthFieldProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && show ? "text" : type;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-[var(--auth-label-gap)] block text-[length:var(--auth-label-size)] font-semibold text-[var(--auth-text)]"
      >
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--auth-input-icon)]" />
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className={cn(
            "h-[var(--auth-field-h)] w-full rounded-lg border pl-10 text-[length:var(--auth-label-size)]",
            "border-[var(--auth-input-border)] bg-[var(--auth-input-bg)] text-[var(--auth-input-text)]",
            "placeholder:text-[var(--auth-input-placeholder)]",
            "focus:border-[var(--auth-accent)] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/25",
            isPassword ? "pr-10" : "pr-3"
          )}
        />
        {isPassword ? (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--auth-input-icon)] hover:text-[var(--auth-text)]"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function AuthPrimaryButton({
  children,
  pending,
  type = "submit",
}: {
  children: React.ReactNode;
  pending?: boolean;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      disabled={pending}
      className="btn-gold flex h-[var(--auth-field-h)] w-full items-center justify-center gap-2 rounded-lg text-[length:var(--auth-button-text-size)] font-semibold text-[#1a1408] transition disabled:opacity-60"
    >
      {children}
      {!pending ? <span aria-hidden>→</span> : null}
    </button>
  );
}
