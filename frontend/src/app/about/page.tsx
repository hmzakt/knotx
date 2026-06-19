"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouteLoading } from "@/contexts/RouteLoadingContext";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/home/scroll-motion";
import {
  Target, Users, BookOpen, Brain, Trophy, ArrowRight,
  CheckCircle, Star, MessageCircle, BarChart3, Zap,
  PlaneTakeoff, Gauge, Wind,
} from "lucide-react";

// ─── Theme hook ───────────────────────────────────────────────────────────────
function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

function RunwayLines({ color = "currentColor" }: { color?: string }) {
  return (
    <svg className="absolute bottom-0 left-0 w-full" style={{ opacity: 0.07 }} viewBox="0 0 1200 60" preserveAspectRatio="none">
      <line x1="0" y1="30" x2="1200" y2="30" stroke={color} strokeWidth="1.5" strokeDasharray="60 20" />
      <line x1="0" y1="48" x2="1200" y2="48" stroke={color} strokeWidth="1" strokeDasharray="40 30" />
      <line x1="0" y1="12" x2="1200" y2="12" stroke={color} strokeWidth="1" strokeDasharray="40 30" />
    </svg>
  );
}

function PlaneSVG({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <g transform="rotate(-20,40,40)">
        <path d="M10 40 L60 20 L70 40 L60 60 Z" fill="currentColor" opacity="0.9" />
        <path d="M30 30 L20 8 L38 28 Z" fill="currentColor" opacity="0.7" />
        <path d="M32 52 L22 72 L40 54 Z" fill="currentColor" opacity="0.7" />
        <path d="M55 38 L72 32 L68 40 L72 48 L55 42 Z" fill="currentColor" opacity="0.6" />
      </g>
    </svg>
  );
}

const tickerItems = ["ABOUT KNOTX", "DGCA EXAM PREP", "STUDENT-FIRST", "BUILT FOR PILOTS", "CLEARED FOR TAKEOFF", "CPL · PPL · ATPL", "ALTITUDE IS EARNED", "FLY THE EXAM"];

export default function About() {
  const { start } = useRouteLoading();
  const isDark = useIsDark();

  const values = [
    { icon: <Target className="w-7 h-7" />, title: "Student-First Approach", description: "Every feature is designed with DGCA students' needs at the forefront, ensuring maximum relevance and effectiveness.", num: "01" },
    { icon: <Zap className="w-7 h-7" />, title: "Innovation & Excellence", description: "We continuously innovate to provide cutting-edge tools and resources that give students a competitive edge.", num: "02" },
    { icon: <Users className="w-7 h-7" />, title: "Community Support", description: "Building a supportive community where students can learn, grow, and succeed together in their aviation journey.", num: "03" },
  ];

  const currentFeatures = [
    { icon: <BookOpen className="w-5 h-5" />, title: "Structured Test Series", description: "Comprehensive test series designed to mirror real DGCA exam conditions" },
    { icon: <CheckCircle className="w-5 h-5" />, title: "Practice Papers", description: "Curated practice papers with detailed explanations and analytics" },
    { icon: <BarChart3 className="w-5 h-5" />, title: "Video Courses", description: "Expert-led video lessons covering every DGCA syllabus topic" },
  ];

  const upcomingFeatures = [
    { icon: <Brain className="w-5 h-5" />, title: "AI Help Chat", description: "24/7 AI-powered assistance for instant doubt resolution" },
    { icon: <Trophy className="w-5 h-5" />, title: "Leaderboard", description: "Compete with peers and track your progress" },
    { icon: <MessageCircle className="w-5 h-5" />, title: "Community Forums", description: "Connect with fellow students and share knowledge" },
    { icon: <Gauge className="w-5 h-5" />, title: "Advanced Analytics", description: "Detailed performance insights and personalized study recommendations" },
  ];

  const stats = [
    { number: "1,200+", label: "Students Helped" },
    { number: "50+", label: "Practice Papers" },
    { number: "10+", label: "Test Series" },
    { number: "98%", label: "Success Rate" },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--av-bg)", color: "var(--av-ink)" }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-[60px]" style={{ minHeight: "55vh" }}>
        <div className={`absolute inset-0 ${isDark ? "hero-bg-dark" : "hero-bg-light"}`} />
        <div className={`absolute inset-0 ${isDark ? "hero-grid-dark" : "hero-grid-light"}`} />
        <div className="hero-orb hero-orb-amber" />
        <div className="hero-orb hero-orb-cobalt" />
        <div className="hero-grain" />
        <RunwayLines color={isDark ? "#f0b429" : "#0a2a5e"} />
        <div className="plane-animate pointer-events-none hidden md:block" style={{ top: "28%", color: "var(--av-amber)", zIndex: 10 }}>
          <PlaneSVG size={48} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div>
            <motion.p className="text-xs font-bold uppercase tracking-[0.35em] mb-4" style={{ color: "var(--av-amber)" }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              ✦ About KnotX
            </motion.p>
            <motion.h1 className="font-display-black uppercase leading-none mb-5"
              style={{ fontSize: "clamp(2.2rem, 8vw, 5.5rem)", letterSpacing: "-0.04em", color: "var(--av-ink)" }}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}>
              EMPOWERING{" "}
              <span className="relative inline-block px-2">
                <span className="absolute inset-0 -skew-x-2" style={{ background: "var(--av-amber)", zIndex: -1 }} />
                <span style={{ color: "#0d1117" }}>PILOTS.</span>
              </span>
            </motion.h1>
            <motion.p className="text-sm sm:text-base leading-relaxed mb-8 max-w-lg" style={{ color: "var(--av-ink-muted)" }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.28 }}>
              KnotX was born from a simple observation — DGCA exam preparation lacked structured, effective practice resources. We built KnotX with one clear mission: make practice easier and more effective for every DGCA student.
            </motion.p>
            <motion.div className="flex flex-col sm:flex-row gap-3"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.38 }}>
              <Link href="/explore" onClick={() => start("nav")}>
                <button className="btn-amber-glow flex items-center gap-2 px-7 py-3.5 rounded-lg font-bold uppercase tracking-widest text-sm transition-all hover:scale-[1.03]"
                  style={{ background: "var(--av-amber)", color: "#0d1117" }}>
                  Explore Platform <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/" onClick={() => start("nav")}>
                <button className="flex items-center gap-2 px-7 py-3.5 rounded-lg font-semibold uppercase tracking-widest text-sm transition-all hover:scale-[1.02]"
                  style={{ border: "2px solid var(--av-border)", color: "var(--av-ink)" }}>
                  Back to Home
                </button>
              </Link>
            </motion.div>
          </div>

          {/* Right — stats cluster */}
          <motion.div className="hidden lg:grid grid-cols-2 gap-4"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            {stats.map((s, i) => (
              <div key={i} className="rounded-xl p-6 flex flex-col items-center text-center border-2 transition-all"
                style={{ background: "var(--av-card-bg)", borderColor: i === 0 ? "var(--av-amber)" : "var(--av-card-border)" }}>
                <div className="font-display-black text-4xl mb-1" style={{ color: "var(--av-amber)" }}>{s.number}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--av-ink-muted)" }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Ticker ───────────────────────────────────────────────────────── */}
      <div className="w-full overflow-hidden py-3 border-y" style={{ background: "var(--av-cobalt)", borderColor: "var(--av-cobalt)" }}>
        <div className="ticker-track whitespace-nowrap">
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-4 px-4">
              <span className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "#fff" }}>{item}</span>
              <span style={{ color: "var(--av-amber)", fontSize: "1.1rem" }}>✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Mission & Vision ─────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 border-b" style={{ borderColor: "var(--av-border)", background: "var(--av-bg-alt)" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <ScrollReveal className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.35em] mb-4" style={{ color: "var(--av-amber)" }}>✦ Mission & Vision</p>
            <h2 className="font-display-black uppercase leading-none" style={{ fontSize: "clamp(2rem, 5.5vw, 4.5rem)", letterSpacing: "-0.03em" }}>
              OUR <span style={{ color: "var(--av-cobalt)" }}>FLIGHT PLAN.</span>
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: <Target className="w-8 h-8" />, title: "Our Mission", body: "To provide DGCA students with comprehensive, structured practice resources that bridge the gap between theoretical knowledge and exam success. With the right tools, every student can achieve their aviation dreams." },
              { icon: <Star className="w-8 h-8" />, title: "Our Vision", body: "To become the leading platform for DGCA exam preparation, empowering thousands of students through innovative technology, personalized learning, and a supportive aviation community." },
            ].map((card, i) => (
              <ScrollReveal key={i} delay={i * 0.1} y={24}>
                <div className="group relative p-8 rounded-xl border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl h-full"
                  style={{ background: "var(--av-card-bg)", borderColor: i === 0 ? "var(--av-amber)" : "var(--av-cobalt)" }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                    style={{ background: i === 0 ? "var(--av-amber)" : "var(--av-cobalt)" }} />
                  <div className="w-14 h-14 rounded-lg flex items-center justify-center mb-5"
                    style={{ background: i === 0 ? "rgba(240,180,41,0.1)" : "rgba(10,42,94,0.08)", color: i === 0 ? "var(--av-amber)" : "var(--av-cobalt)", border: `1.5px solid ${i === 0 ? "var(--av-amber)" : "var(--av-cobalt)"}` }}>
                    {card.icon}
                  </div>
                  <h3 className="font-display uppercase text-xl mb-3" style={{ color: "var(--av-ink)" }}>{card.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--av-ink-muted)" }}>{card.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Core Values ──────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24" style={{ background: "var(--av-bg)" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <ScrollReveal className="mb-12 sm:mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.35em] mb-4" style={{ color: "var(--av-amber)" }}>Core Values</p>
            <h2 className="font-display-black uppercase leading-none mb-5" style={{ fontSize: "clamp(2rem, 5.5vw, 4.5rem)", letterSpacing: "-0.03em" }}>
              HOW WE <span style={{ color: "var(--av-cobalt)" }}>OPERATE.</span>
            </h2>
            <div className="h-0.5 w-full line-grow" style={{ background: "var(--av-border)" }} />
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px rounded-lg overflow-hidden" style={{ background: "var(--av-border)" }}>
            {values.map((v, i) => (
              <ScrollReveal key={i} delay={i * 0.08} y={28}>
                <div className="group relative p-7 flex flex-col gap-4 h-full transition-all duration-300 hover:-translate-y-0.5"
                  style={{ background: "var(--av-card-bg)" }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" style={{ background: "var(--av-amber)" }} />
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "rgba(240,180,41,0.1)", color: "var(--av-amber)", border: "1.5px solid rgba(240,180,41,0.2)" }}>
                      {v.icon}
                    </div>
                    <span className="font-mono text-xs" style={{ color: "var(--av-ink-muted)" }}>{v.num} / 03</span>
                  </div>
                  <h3 className="font-display uppercase text-base" style={{ color: "var(--av-ink)" }}>{v.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--av-ink-muted)" }}>{v.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 border-y" style={{ background: "var(--av-bg-alt)", borderColor: "var(--av-border)" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <ScrollReveal className="mb-12 sm:mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.35em] mb-4" style={{ color: "var(--av-amber)" }}>What We Offer</p>
            <h2 className="font-display-black uppercase leading-none" style={{ fontSize: "clamp(2rem, 5.5vw, 4.5rem)", letterSpacing: "-0.03em" }}>
              THE FULL <span style={{ color: "var(--av-amber)" }}>LOADOUT.</span>
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <ScrollReveal>
              <p className="text-xs font-bold uppercase tracking-[0.25em] mb-4" style={{ color: "var(--av-cobalt)" }}>Currently Available</p>
              <div className="space-y-3">
                {currentFeatures.map((f, i) => (
                  <div key={i} className="flex items-start gap-4 p-5 rounded-xl border transition-all hover:shadow-md"
                    style={{ background: "var(--av-card-bg)", borderColor: "var(--av-card-border)" }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--av-amber)", color: "#0d1117" }}>{f.icon}</div>
                    <div>
                      <h4 className="font-display uppercase text-sm mb-1" style={{ color: "var(--av-ink)" }}>{f.title}</h4>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--av-ink-muted)" }}>{f.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <p className="text-xs font-bold uppercase tracking-[0.25em] mb-4" style={{ color: "var(--av-ink-muted)" }}>Coming Soon</p>
              <div className="space-y-3">
                {upcomingFeatures.map((f, i) => (
                  <div key={i} className="flex items-start gap-4 p-5 rounded-xl border transition-all opacity-70"
                    style={{ background: "var(--av-card-bg)", borderColor: "var(--av-border)", borderStyle: "dashed" }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(240,180,41,0.08)", color: "var(--av-amber)", border: "1.5px dashed rgba(240,180,41,0.3)" }}>{f.icon}</div>
                    <div>
                      <h4 className="font-display uppercase text-sm mb-1" style={{ color: "var(--av-ink)" }}>{f.title}</h4>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--av-ink-muted)" }}>{f.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Stats Band ───────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 border-y overflow-hidden" style={{ background: "#07080f", borderColor: "#07080f" }}>
        <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
          <ScrollReveal y={40}>
            <p className="text-xs font-bold uppercase tracking-[0.35em] mb-4" style={{ color: "var(--av-amber)" }}>✦ Impact in Numbers</p>
            <h2 className="font-display-black uppercase leading-none mb-12" style={{ fontSize: "clamp(1.8rem, 5vw, 4rem)", letterSpacing: "-0.03em", color: "#f4f1eb" }}>
              THE NUMBERS <span style={{ color: "var(--av-amber)" }}>SPEAK.</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="font-display-black text-4xl sm:text-5xl" style={{ color: "var(--av-amber)" }}>{s.number}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(244,241,235,0.5)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24" style={{ background: "var(--av-bg)" }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <ScrollReveal y={32}>
            <p className="text-xs font-bold uppercase tracking-[0.35em] mb-4" style={{ color: "var(--av-amber)" }}>✦ Ready to Fly?</p>
            <h2 className="font-display-black uppercase leading-none mb-5" style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)", letterSpacing: "-0.03em" }}>
              START YOUR <span style={{ color: "var(--av-cobalt)" }}>MISSION.</span>
            </h2>
            <p className="text-sm sm:text-base leading-relaxed mb-10 max-w-xl mx-auto" style={{ color: "var(--av-ink-muted)" }}>
              Join thousands of students already using KnotX to achieve their DGCA exam goals. Start practicing today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/explore" onClick={() => start("nav")}>
                <button className="btn-amber-glow flex items-center gap-2 px-8 py-3.5 rounded-lg font-bold uppercase tracking-widest text-sm transition-all hover:scale-[1.03]"
                  style={{ background: "var(--av-amber)", color: "#0d1117" }}>
                  Start Practicing <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/" onClick={() => start("nav")}>
                <button className="flex items-center gap-2 px-8 py-3.5 rounded-lg font-semibold uppercase tracking-widest text-sm transition-all hover:opacity-80"
                  style={{ border: "2px solid var(--av-border)", color: "var(--av-ink)" }}>
                  Learn More
                </button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
