"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { usePageHeader } from "@/components/layout/page-header-context";

type PageShellProps = {
  header?: React.ReactNode;
  children: React.ReactNode;
  scrollBody?: boolean;
  inset?: boolean;
  className?: string;
  bodyClassName?: string;
};

export function PageShell({
  header,
  children,
  scrollBody = true,
  inset = false,
  className,
  bodyClassName,
}: PageShellProps) {
  const { setPageHeader } = usePageHeader();

  useEffect(() => {
    setPageHeader(header ?? null);
    return () => setPageHeader(null);
  }, [header, setPageHeader]);

  return (
    <div className={cn("flex h-full min-h-0 w-full flex-col", className)}>
      <div
        className={cn(
          "min-h-0 w-full flex-1",
          scrollBody ? "scrollbar-thin overflow-y-auto overscroll-contain" : "flex flex-col overflow-hidden",
          inset && "px-4 py-3 sm:px-6 sm:py-4",
          bodyClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
