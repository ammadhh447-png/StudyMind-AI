"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type PageHeaderContextValue = {
  pageHeader: ReactNode;
  setPageHeader: (node: ReactNode) => void;
};

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [pageHeader, setPageHeaderState] = useState<ReactNode>(null);

  const setPageHeader = useCallback((node: ReactNode) => {
    setPageHeaderState(node);
  }, []);

  const value = useMemo(
    () => ({ pageHeader, setPageHeader }),
    [pageHeader, setPageHeader]
  );

  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>;
}

export function usePageHeader() {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) {
    throw new Error("usePageHeader must be used within PageHeaderProvider");
  }
  return ctx;
}

export function useOptionalPageHeader() {
  return useContext(PageHeaderContext);
}
