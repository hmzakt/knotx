"use client";

import PixelHero from "../components/PixelHero";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Home() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
    <div className="bg-zinc-950">
      <PixelHero/>
    </div>
    </>
  );
}
