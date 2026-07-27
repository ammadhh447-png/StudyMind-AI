"use client";

type TopBarProps = {
  title: string;
  subtitle?: string;
};

export function TopBar({ title, subtitle }: TopBarProps) {
  return (
    <div className="min-w-0 py-0.5">
      <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">{title}</h1>
      {subtitle ? (
        <p className="mt-0.5 truncate text-[11px] text-muted sm:text-xs">{subtitle}</p>
      ) : null}
    </div>
  );
}
