/**
 * inspired by:
 * @author: @dorian_baffier
 * @description: Beams Background
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */
"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface AnimatedGradientBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  intensity?: "subtle" | "medium" | "strong";
}

interface Beam {
  x: number;
  y: number;
  width: number;
  length: number;
  angle: number;
  speed: number;
  opacity: number;
  hue: number;
  pulse: number;
  pulseSpeed: number;
}

function createBeam(width: number, height: number): Beam {
  const angle = -35 + Math.random() * 10;

  // ✅ Emerald tone
  const hueBase = 150;
  const hueRange = 20;

  return {
    x: Math.random() * width * 1.5 - width * 0.25,
    y: Math.random() * height * 1.5 - height * 0.25,
    width: 30 + Math.random() * 60,
    length: height * 2.5,
    angle,
    speed: 0.6 + Math.random() * 1.2,
    opacity: 0.12 + Math.random() * 0.16,
    hue: hueBase + Math.random() * hueRange,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.02 + Math.random() * 0.03,
  };
}

export default function BeamsBackground({
  className,
  intensity = "strong",
  children,
}: AnimatedGradientBackgroundProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beamsRef = useRef<Beam[]>([]);
  const animationFrameRef = useRef<number>(0);
  // Default number of beams for desktop; mobile will scale this down.
  const MINIMUM_BEAMS = 20;
  const runningRef = useRef<boolean>(true);

  const opacityMap = {
    subtle: 0.7,
    medium: 0.85,
    strong: 1,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isMobile = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
    const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const updateCanvasSize = () => {
      // Use the component container size when available so canvas matches the visible area
      const container = containerRef.current;
      const containerRect = container?.getBoundingClientRect();
      const targetWidth = containerRect ? Math.max(Math.floor(containerRect.width), 0) : window.innerWidth;
      const targetHeight = containerRect ? Math.max(Math.floor(containerRect.height), 0) : window.innerHeight;

      // Lower DPR on mobile to reduce fill-rate cost
      const dprCap = isMobile() ? 1 : 1.5;
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);

      canvas.width = Math.max(1, Math.floor(targetWidth * dpr));
      canvas.height = Math.max(1, Math.floor(targetHeight * dpr));
      canvas.style.width = `${targetWidth}px`;
      canvas.style.height = `${targetHeight}px`;
      // Reset transform before applying new scale to avoid accumulation across resizes
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Reduce beam count on mobile
      const baseBeams = isMobile() ? Math.ceil(MINIMUM_BEAMS * 0.4) : MINIMUM_BEAMS;
      const totalBeams = Math.max(8, Math.floor(baseBeams * 1.2));
      beamsRef.current = Array.from({ length: totalBeams }, () =>
        createBeam(canvas.width, canvas.height)
      );
    };

    updateCanvasSize();
    let resizeRaf = 0;
    const onResize = () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(updateCanvasSize);
    };
    window.addEventListener("resize", onResize);

    function resetBeam(beam: Beam, index: number, totalBeams: number) {
      if (!canvas) return beam;

      const column = index % 3;
      const spacing = canvas.width / 3;

      // ✅ Emerald tone
      const hueBase = 150;
      const hueRange = 20;

      beam.y = canvas.height + 100;
      beam.x =
        column * spacing +
        spacing / 2 +
        (Math.random() - 0.5) * spacing * 0.5;
      beam.width = 100 + Math.random() * 100;
      beam.speed = 0.5 + Math.random() * 0.4;
      beam.hue = hueBase + (index * hueRange) / totalBeams;
      beam.opacity = 0.2 + Math.random() * 0.1;
      return beam;
    }

    function drawBeam(ctx: CanvasRenderingContext2D, beam: Beam) {
      ctx.save();
      ctx.translate(beam.x, beam.y);
      ctx.rotate((beam.angle * Math.PI) / 180);

      const pulsingOpacity =
        beam.opacity *
        (0.8 + Math.sin(beam.pulse) * 0.2) *
        opacityMap[intensity];

      const gradient = ctx.createLinearGradient(0, 0, 0, beam.length);

      const saturation = "85%";
      const lightness = "55%";

      gradient.addColorStop(0, `hsla(${beam.hue}, ${saturation}, ${lightness}, 0)`);
      gradient.addColorStop(0.1, `hsla(${beam.hue}, ${saturation}, ${lightness}, ${pulsingOpacity * 0.5})`);
      gradient.addColorStop(0.4, `hsla(${beam.hue}, ${saturation}, ${lightness}, ${pulsingOpacity})`);
      gradient.addColorStop(0.6, `hsla(${beam.hue}, ${saturation}, ${lightness}, ${pulsingOpacity})`);
      gradient.addColorStop(0.9, `hsla(${beam.hue}, ${saturation}, ${lightness}, ${pulsingOpacity * 0.5})`);
      gradient.addColorStop(1, `hsla(${beam.hue}, ${saturation}, ${lightness}, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
      ctx.restore();
    }

    // Cap FPS especially on mobile devices to reduce jank
    const targetFPS = prefersReducedMotion() ? 20 : (isMobile() ? 30 : 60);
    const frameInterval = 1000 / targetFPS;
    let lastTime = performance.now();

    function animate() {
      if (!canvas || !ctx) return;
      if (!runningRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const now = performance.now();
      const delta = now - lastTime;
      if (delta < frameInterval) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      lastTime = now - (delta % frameInterval);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Lower blur to reduce GPU cost; canvas pixels are already softened by gradients
      ctx.filter = "blur(18px)";

      const totalBeams = beamsRef.current.length;
      beamsRef.current.forEach((beam, index) => {
        beam.y -= beam.speed;
        beam.pulse += beam.pulseSpeed;

        if (beam.y + beam.length < -100) {
          resetBeam(beam, index, totalBeams);
        }

        drawBeam(ctx, beam);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animate();

    // Pause animation when tab not visible to save battery/CPU
    const onVisibility = () => {
      runningRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
  window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [intensity]);

    return (
    <div
      ref={containerRef}
      className={cn(
        // On small screens let the container size itself and allow overflow (prevents clipping)
        // On md+ keep the original 80vh immersive background and hide overflow
        "relative h-auto md:h-[80vh] w-full overflow-visible md:overflow-hidden bg-black",
        className
      )}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      <motion.div
        className="absolute inset-0 bg-black/30"
        animate={{ opacity: [0.08, 0.16, 0.08] }}
        transition={{ duration: 10, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
      />

      {/* Hero or children content */}
      <div className="relative z-10 h-full flex items-center">
        {children}
      </div>
    </div>
  );
}
