"use client";
import { useEffect, useState } from "react";
import { useRouteLoading } from "@/contexts/RouteLoadingContext";

export default function RouteLoadingOverlay() {
  const { isLoading } = useRouteLoading();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer: any;
    if (isLoading) {
      setVisible(true);
      setProgress(10);
      // Simulate top progress bar
      timer = setInterval(() => {
        setProgress((p) => (p < 90 ? p + Math.random() * 10 : p));
      }, 200);
    } else {
      setProgress(100);
      const t = setTimeout(() => setVisible(false), 250);
      return () => clearTimeout(t);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Top progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600/20">
        <div
          className="h-full bg-emerald-500 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}
