import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  glow?: boolean;
};

export function GlassCard({
  className,
  glow,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-panel rounded-2xl p-5",
        glow && "ring-1 ring-[#c9a84c]/25 shadow-[0_0_40px_-12px_var(--primary-glow)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
