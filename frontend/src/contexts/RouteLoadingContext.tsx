"use client";
import React, { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

type RouteLoadingContextType = {
  isLoading: boolean;
  start: (reason?: string) => void;
  stop: () => void;
};

const RouteLoadingContext = createContext<RouteLoadingContextType | undefined>(undefined);

export function RouteLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pendingCount = useRef(0);
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  const start = useCallback(() => {
    pendingCount.current += 1;
    setIsLoading(true);
  }, []);

  const stop = useCallback(() => {
    pendingCount.current = Math.max(0, pendingCount.current - 1);
    if (pendingCount.current === 0) {
      // small delay to avoid flicker on super-fast transitions
      const t = setTimeout(() => setIsLoading(false), 150);
      return () => clearTimeout(t);
    }
  }, []);

  // Auto-stop when route changes and paints
  useEffect(() => {
    if (lastPath.current !== null && lastPath.current !== pathname) {
      // route changed; allow paint then stop
      setTimeout(() => {
        pendingCount.current = 0;
        setIsLoading(false);
      }, 200);
    }
    lastPath.current = pathname;
  }, [pathname]);

  const value = useMemo(() => ({ isLoading, start, stop }), [isLoading, start, stop]);

  return (
    <RouteLoadingContext.Provider value={value}>{children}</RouteLoadingContext.Provider>
  );
}

export function useRouteLoading() {
  const ctx = useContext(RouteLoadingContext);
  if (!ctx) throw new Error("useRouteLoading must be used within RouteLoadingProvider");
  return ctx;
}
