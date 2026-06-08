"use client";

import React, { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";

type ScrollOffset = `${"start" | "center" | "end"} ${"start" | "center" | "end"}`;

interface ParallaxProps {
  children: React.ReactNode;
  className?: string;
  /** Negative = moves up on scroll into view; positive range in % */
  yRange?: [string, string];
  offset?: [ScrollOffset, ScrollOffset];
  style?: React.CSSProperties;
}

/** Wraps content and shifts it vertically based on section scroll progress. */
export function Parallax({
  children,
  className,
  yRange = ["-12%", "12%"],
  offset = ["start end", "end start"],
  style,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset });
  const y = useTransform(scrollYProgress, [0, 1], yRange);

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduceMotion ? undefined : { y, ...style }}>{children}</motion.div>
    </div>
  );
}

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}

/** Fade-up reveal when element enters the viewport. */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 36,
  once = true,
}: ScrollRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2, margin: "-40px" }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

interface UseSectionParallaxOptions {
  yRange?: [string, string];
  scaleRange?: [number, number];
  opacityRange?: [number, number];
  offset?: [ScrollOffset, ScrollOffset];
}

/** Returns motion values tied to a section ref for layered parallax. */
export function useSectionParallax(
  ref: React.RefObject<HTMLElement | null>,
  {
    yRange = ["0%", "25%"],
    scaleRange,
    opacityRange,
    offset = ["start start", "end start"],
  }: UseSectionParallaxOptions = {}
) {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset });

  const y = useTransform(scrollYProgress, [0, 1], yRange);
  const scale = scaleRange
    ? useTransform(scrollYProgress, [0, 1], scaleRange)
    : undefined;
  const opacity = opacityRange
    ? useTransform(scrollYProgress, [0, 1], opacityRange)
    : undefined;

  if (reduceMotion) {
    return { scrollYProgress, y: undefined, scale: undefined, opacity: undefined };
  }

  return { scrollYProgress, y, scale, opacity };
}

interface ParallaxBgProps {
  scrollYProgress: MotionValue<number>;
  className?: string;
  yRange?: [string, string];
  scaleRange?: [number, number];
}

/** Background layer that scales / shifts with parent section scroll. */
export function ParallaxBg({
  scrollYProgress,
  className,
  yRange = ["-6%", "6%"],
  scaleRange = [1.06, 1],
}: ParallaxBgProps) {
  const reduceMotion = useReducedMotion();
  const y = useTransform(scrollYProgress, [0, 1], yRange);
  const scale = useTransform(scrollYProgress, [0, 1], scaleRange);

  if (reduceMotion) {
    return <div className={className} />;
  }

  return (
    <motion.div
      className={className}
      style={{ y, scale }}
    />
  );
}
