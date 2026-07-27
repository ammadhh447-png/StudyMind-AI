"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { PageHeaderProvider, usePageHeader } from "@/components/layout/page-header-context";
import { TopBarActions } from "@/components/layout/top-bar-actions";
import { AuthGuard } from "@/components/auth/auth-guard";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

function DashboardTopBar() {
  const { pageHeader } = usePageHeader();

  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface-solid)]/90 px-4 py-2.5 sm:px-5">
      <div className="min-w-0 flex-1">{pageHeader}</div>
      <div className="shrink-0">
        <TopBarActions />
      </div>
    </header>
  );
}

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <ThemeProvider>
        <NotificationProvider>
          <PageHeaderProvider>
          <div className="flex h-dvh max-h-dvh w-full overflow-hidden bg-[var(--background)]">
            <Sidebar />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--chrome-main)]">
              <DashboardTopBar />
              <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
            </div>
          </div>
        </PageHeaderProvider>
        </NotificationProvider>
      </ThemeProvider>
    </AuthGuard>
  );
}
