"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Check, X, Mail, Phone, MapPin, Plus,
  PlaneTakeoff, CrownIcon, Instagram, Linkedin,
  BookOpenCheck, FileText, Users, BarChart, PlayCircle,
  ArrowRight, ChevronDown, ChevronUp, Wind, Gauge, Award,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouteLoading } from "@/contexts/RouteLoadingContext";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import PaymentModal from "../components/PaymentModal";
import { Parallax, ParallaxBg, ScrollReveal, useSectionParallax } from "@/components/home/scroll-motion";

// ─── Data ────────────────────────────────────────────────────────────────────

const offers = [
  { id: 1, num: "01", title: "Expert Video Courses",      tag: "LEARN",    icon: <PlayCircle    className="w-7 h-7" />, details: "In-depth video lessons led by DGCA subject experts. Watch, rewind, and master every topic at your own pace." },
  { id: 2, num: "02", title: "Structured Test Series",    tag: "PRACTICE", icon: <BookOpenCheck className="w-7 h-7" />, details: "Carefully structured modules that mimic real exam conditions and sharpen your performance step by step." },
  { id: 3, num: "03", title: "Strictly Prepared Papers",  tag: "QUALITY",  icon: <FileText      className="w-7 h-7" />, details: "Exam-ready papers curated by subject experts following the latest DGCA guidelines for maximum relevance." },
  { id: 4, num: "04", title: "Detailed Analytics",        tag: "INSIGHTS", icon: <BarChart      className="w-7 h-7" />, details: "Track progress across video lessons, papers, and test attempts. Spot weak zones and improve with clarity." },
];

const stats = [
  { value: "1,200+", label: "Students Enrolled",  icon: <Users className="w-6 h-6" /> },
  { value: "98%",    label: "Pass Rate",           icon: <Award className="w-6 h-6" /> },
  { value: "—",      label: "Video Courses",       icon: <PlayCircle className="w-6 h-6" /> },
  { value: "₹300",   label: "Starting Price",       icon: <Wind  className="w-6 h-6" /> },
];

const tickerItems  = ["DGCA EXAM PREP","VIDEO COURSES","STRUCTURED TEST SERIES","PRACTICE PAPERS","EXPERT-LED LESSONS","DEEP ANALYTICS","CPL · PPL · ATPL","CLEARED FOR TAKEOFF"];
const tickerItems2 = ["LEARN THEN PRACTICE","VIDEO + TEST PAPERS","BUILT FOR DGCA","NO DROP SHADOWS","NO SOFT CORNERS","HARD RULES EVERYWHERE","CLEARED FOR TAKEOFF","ALTITUDE IS EARNED"];

const faqs = [
  { question: "Can I purchase video courses, papers, or test series separately?", answer: "Yes. You can buy video courses, individual papers, and test series on their own — or bundle everything with a Pro subscription." },
  { question: "What kind of support can I expect with a Pro subscription?",       answer: "Pro unlocks all video courses, papers, and test series, plus community forums and direct mentor guidance when you need it." },
  { question: "Are video courses and tests self-paced?",                          answer: "Yes. Watch lessons and attempt papers on your own schedule. Progress is saved so you can pick up exactly where you left off." },
  { question: "Are there any prerequisites for the courses or tests?",          answer: "No formal prerequisites. A basic grasp of aviation concepts is enough — our content suits beginners and working professionals alike." },
  { question: "Can I download videos or course materials for offline access?",  answer: "No. Video lessons and course materials are available for online streaming and access only." },
];

// ─── SVG helpers ─────────────────────────────────────────────────────────────

function PlaneSVG({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <g transform="rotate(-20,40,40)">
        <path d="M10 40 L60 20 L70 40 L60 60 Z"  fill="currentColor" opacity="0.9" />
        <path d="M30 30 L20 8 L38 28 Z"           fill="currentColor" opacity="0.7" />
        <path d="M32 52 L22 72 L40 54 Z"           fill="currentColor" opacity="0.7" />
        <path d="M55 38 L72 32 L68 40 L72 48 L55 42 Z" fill="currentColor" opacity="0.6" />
      </g>
    </svg>
  );
}

function CloudLayer() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg className="cloud-layer absolute" style={{ top: "18%", left: "-4%", opacity: 0.06, width: 380 }} viewBox="0 0 380 100" fill="white">
        <ellipse cx="120" cy="60" rx="120" ry="40" /><ellipse cx="200" cy="50" rx="100" ry="35" />
        <ellipse cx="280" cy="58" rx="90"  ry="30" /><ellipse cx="160" cy="40" rx="80"  ry="30" />
      </svg>
      <svg className="absolute" style={{ top: "54%", right: "-2%", opacity: 0.04, width: 300, animation: "cloud-drift 26s ease-in-out infinite alternate-reverse" }} viewBox="0 0 300 80" fill="white">
        <ellipse cx="100" cy="50" rx="100" ry="32" /><ellipse cx="180" cy="42" rx="90" ry="28" />
        <ellipse cx="250" cy="50" rx="70"  ry="24" />
      </svg>
      <svg className="cloud-layer absolute" style={{ top: "72%", left: "18%", opacity: 0.05, width: 260, animationDuration: "22s" }} viewBox="0 0 260 70" fill="white">
        <ellipse cx="80"  cy="45" rx="80" ry="26" /><ellipse cx="150" cy="38" rx="70" ry="22" />
        <ellipse cx="210" cy="45" rx="55" ry="20" />
      </svg>
    </div>
  );
}

function RunwayLines({ color = "currentColor" }: { color?: string }) {
  return (
    <svg className="absolute bottom-0 left-0 w-full" style={{ opacity: 0.07 }} viewBox="0 0 1200 60" preserveAspectRatio="none">
      <line x1="0" y1="30" x2="1200" y2="30" stroke={color} strokeWidth="1.5" strokeDasharray="60 20" />
      <line x1="0" y1="48" x2="1200" y2="48" stroke={color} strokeWidth="1"   strokeDasharray="40 30" />
      <line x1="0" y1="12" x2="1200" y2="12" stroke={color} strokeWidth="1"   strokeDasharray="40 30" />
    </svg>
  );
}

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

// ─── Feature rows ─────────────────────────────────────────────────────────────

const paperFeatures  = [
  { text: "Multiple attempts for each paper",         included: true  },
  { text: "Analytics for each attempt",               included: true  },
  { text: "Each paper valid for 1 month*",            included: true  },
  { text: "Community support",                        included: false },
  { text: "Mentor guidance",                          included: false },
];
const seriesFeatures = [
  { text: "Structured set of papers",                 included: true  },
  { text: "Detailed analytics for each attempt",      included: true  },
  { text: "Each series valid for 6 months*",          included: true  },
  { text: "Basic community support",                  included: true  },
  { text: "Mentor guidance",                          included: false },
];
const videoFeatures  = [
  { text: "Access to purchased video courses",        included: true  },
  { text: "Expert-led DGCA syllabus coverage",        included: true  },
  { text: "Lesson progress tracking",                 included: true  },
  { text: "Community support",                        included: false },
  { text: "Mentor guidance",                          included: false },
];
const proFeatures    = [
  { text: "Unlimited access to all video courses",    included: true },
  { text: "All papers & test series included",        included: true },
  { text: "Analytics across videos & attempts",       included: true },
  { text: "Community Support",                        included: true },
  { text: "Mentor guidance",                          included: true },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function Home() {
  const { start }                     = useRouteLoading();
  const contactEmail                  = "mail2knotx@gmail.com";
  const contactPhone                  = "+917488830684";
  const [openFAQ, setOpenFAQ]         = useState<number | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; data: any }>({ isOpen: false, data: null });
  const isDark                        = useIsDark();

  const heroRef    = useRef<HTMLDivElement>(null);
  const cockpitRef = useRef<HTMLElement>(null);

  const { scrollYProgress: heroProgress, y: heroBgY, opacity: heroBgFade } = useSectionParallax(heroRef, {
    yRange: ["0%", "35%"],
    opacityRange: [1, 0.4],
    offset: ["start start", "end start"],
  });
  const heroContentY = useTransform(heroProgress, [0, 1], ["0%", "18%"]);
  const heroOpacity  = useTransform(heroProgress, [0, 0.8], [1, 0]);
  const heroImageY   = useTransform(heroProgress, [0, 1], ["0%", "10%"]);
  const decorY       = useTransform(heroProgress, [0, 1], ["0%", "12%"]);

  const { scrollYProgress: cockpitProgress } = useSectionParallax(cockpitRef, {
    offset: ["start end", "end start"],
  });

  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--av-bg)", color: "var(--av-ink)" }}>

      <section
        ref={heroRef}
        id="hero"
        className="relative min-h-[100dvh] flex flex-col overflow-hidden pt-[60px]"
      >
        {/* Parallax background stack */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ y: heroBgY, opacity: heroBgFade }}
          aria-hidden
        >
          <div className={isDark ? "hero-bg-dark absolute inset-0" : "hero-bg-light absolute inset-0"} />
          <div className={`absolute inset-0 ${isDark ? "hero-grid-dark" : "hero-grid-light"}`} />
          <div className="hero-orb hero-orb-amber" />
          <div className="hero-orb hero-orb-cobalt" />
          {isDark && <div className="hero-stars-twinkle" />}
          <div className="hero-grain" />
        </motion.div>

        {/* Decorative layers — slower parallax */}
        <motion.div className="absolute inset-0 pointer-events-none" style={{ y: decorY }} aria-hidden>
          {isDark && <CloudLayer />}
          <RunwayLines color={isDark ? "#f0b429" : "#0a2a5e"} />
        </motion.div>

        {/* Plane — desktop/tablet only */}
        <div
          className="plane-animate pointer-events-none hidden md:block"
          style={{ top: "28%", color: "var(--av-amber)", zIndex: 10 }}
        >
          <PlaneSVG size={52} />
        </div>

        {/* Hero content — two-column grid on large screens */}
        <motion.div
          style={{ y: heroContentY, opacity: heroOpacity }}
          className="relative z-20 flex-1 w-full flex items-center px-5 sm:px-8 md:px-10 lg:px-14 xl:px-16 pb-16 lg:pb-10"
        >
          <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 lg:gap-x-8 xl:gap-x-12 items-center">
            {/* Text column */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
          <motion.h1
            className="font-display-black leading-[0.95] uppercase mb-0"
            style={{ fontSize: "clamp(2.4rem, 11vw, 8rem)", letterSpacing: "-0.04em", color: "var(--av-ink)" }}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            FLY THE{" "}
            <span className="relative inline-block px-2 sm:px-3" style={{ color: "#0d1117" }}>
              <span className="absolute inset-0 -skew-x-2" style={{ background: "var(--av-amber)", zIndex: -1 }} />
              <span className="relative">EXAM.</span>
            </span>
          </motion.h1>

          <motion.h1
            className="font-display-black leading-[0.95] uppercase mb-5 mt-1"
            style={{ fontSize: "clamp(2.4rem, 11vw, 8rem)", letterSpacing: "-0.04em", color: "var(--av-ink)" }}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            CLEAR THE{" "}
            <span style={{ color: "var(--av-cobalt)" }}>SKY.</span>
          </motion.h1>

          <motion.p
            className="text-sm sm:text-base md:text-lg leading-relaxed mb-7 max-w-md mx-auto lg:mx-0"
            style={{ color: "var(--av-ink-muted)" }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            Video courses, practice papers, and test series for DGCA exams — built with learner feedback, guided by experts.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 mb-8 w-full sm:w-auto"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href="/explore" onClick={() => start("nav")} onMouseDown={() => start("nav")} className="w-full sm:w-auto">
              <button
                id="hero-explore-btn"
                className="group w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg text-sm font-bold uppercase tracking-widest transition-all duration-200 hover:scale-[1.03] hover:shadow-2xl btn-amber-glow"
                style={{ background: "var(--av-amber)", color: "#0d1117" }}
              >
                Explore Courses
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <button
              id="hero-pricing-btn"
              onClick={scrollToPricing}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold uppercase tracking-widest transition-all duration-200 hover:scale-[1.02]"
              style={{ border: "2px solid var(--av-ink)", color: "var(--av-ink)", background: "transparent" }}
            >
              View Pricing <ChevronDown className="w-4 h-4" />
            </button>
          </motion.div>
            </div>

            {/* Instrument cluster — large screens only, in-flow beside text */}
            <motion.div
              className="hidden lg:flex items-center justify-center pointer-events-none relative"
              style={{ y: heroImageY }}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: isDark ? 0.9 : 0.78, x: 0 }}
              transition={{ duration: 1.1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="absolute inset-0 blur-3xl rounded-full"
                style={{ background: isDark ? "rgba(240,180,41,0.1)" : "rgba(10,42,94,0.07)", transform: "scale(0.75)" }}
              />
              <Image
                src="/herocover.png"
                alt="Cessna instrument cluster"
                width={640}
                height={500}
                priority
                className="relative w-full max-w-[min(100%,520px)] h-auto object-contain"
                style={{
                  filter: isDark
                    ? "drop-shadow(0 0 36px rgba(240,180,41,0.2)) drop-shadow(0 16px 50px rgba(0,0,0,0.65))"
                    : "drop-shadow(0 0 24px rgba(10,42,94,0.18)) drop-shadow(0 16px 40px rgba(0,0,0,0.14))",
                }}
              />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.7 }}
        >
      
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          COBALT TICKER BAND
          ══════════════════════════════════════════════ */}
      <div className="w-full overflow-hidden py-3 border-y" style={{ background: "var(--av-cobalt)", borderColor: "var(--av-cobalt)" }}>
        <div className="ticker-track whitespace-nowrap">
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-4 px-4">
              <span className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "#ffffff" }}>{item}</span>
              <span style={{ color: "var(--av-amber)", fontSize: "1.1rem" }}>✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          STATS
          ══════════════════════════════════════════════ */}
      {/* <section className="py-12 sm:py-16 border-b" style={{ borderColor: "var(--av-border)", background: "var(--av-bg-alt)" }}>
        <div className="container mx-auto px-5 sm:px-6 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((s, idx) => (
              <ScrollReveal key={idx} delay={idx * 0.08} y={24}>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-1" style={{ background: "rgba(240,180,41,0.12)", color: "var(--av-amber)" }}>{s.icon}</div>
                  <div className="font-display-black text-3xl sm:text-4xl md:text-5xl" style={{ color: "var(--av-amber)" }}>{s.value}</div>
                  <div className="text-[10px] sm:text-xs uppercase tracking-widest leading-snug" style={{ color: "var(--av-ink-muted)" }}>{s.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section> */}

      {/* ══════════════════════════════════════════════
          COCKPIT IMMERSIVE SECTION
          ══════════════════════════════════════════════ */}
      <section ref={cockpitRef} className="relative min-h-[48vh] sm:min-h-[55vh] flex items-center overflow-hidden">
        <ParallaxBg
          scrollYProgress={cockpitProgress}
          className="cockpit-img-overlay"
          yRange={["-10%", "10%"]}
          scaleRange={[1.12, 1.02]}
        />
        <div className={`absolute inset-0 ${isDark ? "cockpit-tint-dark" : "cockpit-tint-light"}`} />
        <div className="relative container mx-auto px-5 sm:px-6 max-w-6xl py-14 sm:py-20" style={{ zIndex: 10 }}>
          <div className="max-w-2xl">
            <ScrollReveal>
              <p className="text-xs font-bold uppercase tracking-[0.35em] mb-4" style={{ color: "var(--av-amber)" }}>
                ✦ Your DGCA Flight Deck
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.08}>
              <h2 className="font-display-black uppercase leading-none mb-6"
                style={{ fontSize: "clamp(1.9rem, 6.5vw, 5.5rem)", letterSpacing: "-0.03em", color: "var(--av-ink)" }}>
                EVERY QUESTION IS A{" "}
                <span style={{ color: "var(--av-amber)" }}>CHECKPOINT.</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.14}>
              <p className="text-base sm:text-lg mb-8 leading-relaxed" style={{ color: "var(--av-ink-muted)" }}>
                Learn from expert video lessons, then put knowledge to the test with papers and structured series — covering navigation, meteorology, air regulations, and every DGCA subject.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {["Air Navigation", "Meteorology", "Air Regulations", "Technical General", "Radio Telephony"].map((s) => (
                  <span key={s} className="px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest border"
                    style={{ background: isDark ? "rgba(240,180,41,0.1)" : "rgba(10,42,94,0.07)", borderColor: "var(--av-amber)", color: "var(--av-amber)" }}>
                    {s}
                  </span>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          WHAT WE OFFER
          ══════════════════════════════════════════════ */}
      <section id="offers" className="py-16 sm:py-24" style={{ background: "var(--av-bg)" }}>
        <div className="container mx-auto px-5 sm:px-6 max-w-6xl">
          <ScrollReveal className="mb-12 sm:mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.35em] mb-4" style={{ color: "var(--av-amber)" }}>What We Offer</p>
            <h2 className="font-display-black uppercase leading-none mb-6" style={{ fontSize: "clamp(2rem, 6.5vw, 5.5rem)", letterSpacing: "-0.03em", color: "var(--av-ink)" }}>
              A SYSTEM YOU CAN <span style={{ color: "var(--av-cobalt)" }}>TRUST.</span>
            </h2>
            <div className="h-0.5 w-full line-grow" style={{ background: "var(--av-border)" }} />
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px rounded-lg overflow-hidden" style={{ background: "var(--av-border)" }}>
            {offers.map((offer, idx) => (
              <ScrollReveal key={offer.id} delay={idx * 0.08} y={32}>
                <div className="group relative p-6 sm:p-8 flex flex-col gap-4 h-full transition-all duration-300 hover:-translate-y-0.5"
                  style={{ background: "var(--av-card-bg)" }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" style={{ background: "var(--av-amber)" }} />
                  <span className="text-xs font-mono" style={{ color: "var(--av-ink-muted)" }}>{offer.num} / 04</span>
                  <span className="inline-block self-start text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                    style={{ background: "rgba(240,180,41,0.12)", color: "var(--av-amber)", border: "1px solid rgba(240,180,41,0.25)" }}>{offer.tag}</span>
                  <div style={{ color: "var(--av-cobalt)" }}>{offer.icon}</div>
                  <h3 className="font-display uppercase text-base sm:text-lg leading-tight" style={{ color: "var(--av-ink)" }}>{offer.title}.</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--av-ink-muted)" }}>{offer.details}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          HOW IT WORKS
          ══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 border-y" style={{ background: "var(--av-bg-alt)", borderColor: "var(--av-border)" }}>
        <div className="container mx-auto px-5 sm:px-6 max-w-6xl">
          <ScrollReveal className="mb-12 sm:mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.35em] mb-4" style={{ color: "var(--av-amber)" }}>How It Works</p>
            <h2 className="font-display-black uppercase leading-none" style={{ fontSize: "clamp(2rem, 5.5vw, 4.5rem)", letterSpacing: "-0.03em", color: "var(--av-ink)" }}>
              YOUR FLIGHT PLAN.
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { step: "01", title: "Pick Your Path", desc: "Browse video courses, practice papers, and structured test series. Choose what fits your stage and subject.", icon: "" },
              { step: "02", title: "Learn & Practice", desc: "Watch expert-led lessons, then reinforce concepts with papers and timed modules built for the real DGCA exam.", icon: "" },
              { step: "03", title: "Test Under Real Conditions", desc: "Attempt tests in a clean, exam-like environment — focused, accurate, and true to DGCA standards.", icon: "" },
              { step: "04", title: "Analyse & Improve", desc: "Review analytics across videos and test attempts. Find weak zones, fix them, and fly higher.", icon: "" },
            ].map((item, idx) => (
              <Parallax key={idx} yRange={["-4%", "4%"]} className="h-full">
              <ScrollReveal delay={idx * 0.1} y={36} className="h-full">
              <div
                className="relative p-6 sm:p-8 rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full"
                style={{ background: "var(--av-card-bg)", borderColor: "var(--av-card-border)" }}>
                <div className="absolute -top-4 left-8 px-3 py-1 rounded font-mono text-xs font-bold" style={{ background: "var(--av-amber)", color: "#0d1117" }}>
                  STEP {item.step}
                </div>
                <div className="text-4xl mb-4 mt-2">{item.icon}</div>
                <h3 className="font-display uppercase text-lg mb-3 leading-tight" style={{ color: "var(--av-ink)" }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--av-ink-muted)" }}>{item.desc}</p>
                {idx < 3 && (
                  <div className="hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full items-center justify-center z-10 shadow"
                    style={{ background: "var(--av-amber)", color: "#0d1117" }}>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
              </ScrollReveal>
              </Parallax>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          AMBER TICKER BAND 2
          ══════════════════════════════════════════════ */}
      <div className="w-full overflow-hidden py-3 border-y" style={{ background: "var(--av-amber)", borderColor: "var(--av-amber-dark)" }}>
        <div className="ticker-track whitespace-nowrap" style={{ animationDuration: "22s", animationDirection: "reverse" }}>
          {[...tickerItems2, ...tickerItems2].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-4 px-4">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#0d1117]">{item}</span>
              <span className="text-[#0d1117] opacity-50 text-lg">+</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          PRICING
          ══════════════════════════════════════════════ */}
      <section id="pricing" className="py-16 sm:py-24" style={{ background: "var(--av-bg-alt)" }}>
        <div className="container mx-auto px-5 sm:px-6 max-w-6xl">
          <ScrollReveal className="mb-12 sm:mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.35em] mb-4" style={{ color: "var(--av-amber)" }}>Pricing</p>
            <h2 className="font-display-black uppercase leading-none mb-2" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", letterSpacing: "-0.03em", color: "var(--av-ink)" }}>
              FILE YOUR <span style={{ color: "var(--av-signal)" }}>SUBSCRIPTION.</span>
            </h2>
            <p className="text-base mt-3" style={{ color: "var(--av-ink-muted)" }}>Video courses, papers, test series, or all-access Pro — pick what fits your mission.</p>
            <div className="h-0.5 w-full mt-6 line-grow" style={{ background: "var(--av-border)" }} />
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
            {[
              { num: "01", title: "Papers",         price: "₹300",   suffix: "starting", features: paperFeatures,  highlighted: false, btnId: "pricing-papers-btn",  btnLabel: "Get Started →", btnAction: "link" },
              { num: "02", title: "Test Series",    price: "₹1,500", suffix: "starting", features: seriesFeatures, highlighted: false, btnId: "pricing-series-btn", btnLabel: "Get Started →", btnAction: "link" },
              { num: "03", title: "Video Courses",  price: "₹—",    suffix: "starting", features: videoFeatures,  highlighted: false, btnId: "pricing-video-btn",  btnLabel: "Get Started →", btnAction: "link" },
              { num: "04", title: "Pro",            price: "₹8,000", suffix: "/year",    features: proFeatures,    highlighted: true,  btnId: "pricing-pro-btn",    btnLabel: "Get Pro Access", btnAction: "pay"  },
            ].map((plan, pidx) => (
              <ScrollReveal key={pidx} delay={pidx * 0.1} y={28}>
              <div
                className="flex flex-col rounded-xl overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl relative h-full"
                style={{ background: "var(--av-card-bg)", borderColor: plan.highlighted ? "var(--av-amber)" : "var(--av-card-border)" }}>
                {plan.highlighted && (
                  <div className="absolute top-0 left-0 right-0 py-1.5 text-center" style={{ background: "var(--av-amber)" }}>
                    <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#0d1117]">✦ Recommended ✦</span>
                  </div>
                )}
                <div className={`p-8 flex-1 ${plan.highlighted ? "pt-12" : ""}`}>
                  <p className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: "var(--av-ink-muted)" }}>{plan.num} / 04</p>
                  <h3 className="font-display uppercase text-2xl mb-1" style={{ color: "var(--av-ink)" }}>{plan.title}</h3>
                  <div className="flex items-end gap-1 mt-4 mb-6">
                    <span className="text-4xl font-display-black" style={{ color: plan.highlighted ? "var(--av-amber)" : "var(--av-ink)" }}>{plan.price}</span>
                    <span className="text-sm mb-1" style={{ color: "var(--av-ink-muted)" }}>{plan.suffix}</span>
                  </div>
                  <div className="space-y-3">
                    {plan.features.map((f, fi) => (
                      <div key={fi} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                          style={{ background: f.included ? "var(--av-amber)" : "transparent", border: f.included ? "none" : "1.5px solid var(--av-border)" }}>
                          {f.included ? <Check className="w-3 h-3 text-[#0d1117]" /> : <X className="w-3 h-3" style={{ color: "var(--av-ink-muted)" }} />}
                        </div>
                        <span className="text-sm" style={{ color: f.included ? "var(--av-ink)" : "var(--av-ink-muted)" }}>{f.text}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mt-4" style={{ color: "var(--av-ink-muted)" }}>*from date of purchase</p>
                </div>
                <div className="p-6 border-t" style={{ borderColor: plan.highlighted ? "var(--av-amber)" : "var(--av-border)" }}>
                  {plan.btnAction === "link" ? (
                    <Link href="/explore" onClick={() => start("nav")} onMouseDown={() => start("nav")}>
                      <button id={plan.btnId} className="w-full py-3 rounded-lg font-bold uppercase tracking-widest text-sm transition-all duration-200 hover:opacity-90"
                        style={{ background: "var(--av-ink)", color: "var(--av-bg)" }}>{plan.btnLabel}</button>
                    </Link>
                  ) : (
                    <button id={plan.btnId}
                      className="w-full py-3 rounded-lg font-bold uppercase tracking-widest text-sm transition-all duration-200 hover:opacity-90 flex items-center justify-center gap-2 btn-amber-glow"
                      style={{ background: "var(--av-amber)", color: "#0d1117" }}
                      onClick={() => setPaymentModal({ isOpen: true, data: { type: "all-access", itemName: "KnotX Pro - All Access (1 Year)", itemDescription: "Unlimited access to all video courses, test series, papers, and premium features for 12 months.", baseAmount: 800000, currency: "INR", durationDays: 365 } })}>
                      <CrownIcon className="w-4 h-4" />{plan.btnLabel}
                    </button>
                  )}
                </div>
              </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          MANIFESTO BAND
          ══════════════════════════════════════════════ */}
      <Parallax yRange={["-6%", "6%"]}>
      <section className="py-14 sm:py-20 border-y overflow-hidden" style={{ background: "#07080f", borderColor: "#07080f" }}>
        <div className="container mx-auto px-5 sm:px-6 max-w-4xl text-center">
          <ScrollReveal y={40}>
            <p className="font-display-black leading-tight uppercase" style={{ fontSize: "clamp(1.5rem, 5vw, 4rem)", color: "#f4f1eb", letterSpacing: "-0.03em" }}>
              DGCA ISN&apos;T <span style={{ color: "var(--av-amber)" }}>HARD.</span><br />
              WITH <span style={{ color: "var(--av-signal)" }}>STRUCTURED PREPARATION.</span> <br />
            </p>
            <div className="flex items-center gap-4 justify-center mt-8">
              <div className="h-px w-12" style={{ background: "var(--av-amber)", opacity: 0.5 }} />
              <p className="text-xs uppercase tracking-[0.35em]" style={{ color: "#f4f1eb", opacity: 0.4 }}>Filed by the KnotX Desk</p>
              <div className="h-px w-12" style={{ background: "var(--av-amber)", opacity: 0.5 }} />
            </div>
          </ScrollReveal>
        </div>
      </section>
      </Parallax>

      {/* ══════════════════════════════════════════════
          FAQ
          ══════════════════════════════════════════════ */}
      <section id="faq" className="py-16 sm:py-24" style={{ background: "var(--av-bg)" }}>
        <div className="container mx-auto px-5 sm:px-6 max-w-4xl">
          <ScrollReveal className="mb-10 sm:mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.35em] mb-4" style={{ color: "var(--av-amber)" }}>FAQ</p>
            <h2 className="font-display-black uppercase leading-none" style={{ fontSize: "clamp(2.2rem, 5vw, 4.5rem)", letterSpacing: "-0.03em", color: "var(--av-ink)" }}>
              QUESTIONS. <span style={{ color: "var(--av-cobalt)" }}>ANSWERED.</span>
            </h2>
          </ScrollReveal>
          <div className="divide-y" style={{ borderColor: "var(--av-border)" }}>
            {faqs.map((f, i) => (
              <ScrollReveal key={i} delay={i * 0.05} y={16}>
                <button id={`faq-${i}-btn`} className="w-full flex justify-between items-center py-6 text-left group transition-all"
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}>
                  <h3 className="text-base md:text-lg font-semibold pr-6 group-hover:opacity-70 transition-opacity" style={{ color: "var(--av-ink)" }}>{f.question}</h3>
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: openFAQ === i ? "var(--av-amber)" : "transparent", border: "1.5px solid var(--av-border)" }}>
                    {openFAQ === i ? <ChevronUp className="w-4 h-4 text-[#0d1117]" /> : <Plus className="w-4 h-4" style={{ color: "var(--av-ink)" }} />}
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {openFAQ === i && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.28 }} className="overflow-hidden">
                      <p className="pb-6 text-base leading-relaxed" style={{ color: "var(--av-ink-muted)" }}>{f.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, data: null })}
        onPaymentSuccess={() => { console.log("Payment successful"); }}
        paymentData={paymentModal.data}
      />

      {/* ══════════════════════════════════════════════
          FOOTER — Always dark
          ══════════════════════════════════════════════ */}
      <footer style={{ background: "var(--av-footer-bg)", color: "var(--av-footer-text)", borderTop: "1px solid var(--av-footer-border)" }}>
        <div className="container mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-5">
              <Image src="/logo.png" alt="KnotX logo" width={90} height={90} className="h-12 w-auto brightness-0 invert" />
              <p className="text-sm leading-relaxed" style={{ color: "var(--av-footer-text)" }}>Video courses, test papers, and structured DGCA prep. No shortcuts. No fluff.</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" style={{ color: "var(--av-footer-heading)" }} /><a href={`mailto:${contactEmail}`} className="hover:text-white transition-colors" style={{ color: "var(--av-footer-text)" }}>{contactEmail}</a></div>
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" style={{ color: "var(--av-footer-heading)" }} /><a href={`tel:${contactPhone}`} className="hover:text-white transition-colors" style={{ color: "var(--av-footer-text)" }}>{contactPhone}</a></div>
                <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" style={{ color: "var(--av-footer-heading)" }} /><span>Noida, India</span></div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.25em] mb-5" style={{ color: "var(--av-footer-heading)" }}>Platform</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/explore" onClick={() => start("nav")} className="hover:text-white transition-colors" style={{ color: "var(--av-footer-text)" }}>Explore Courses</Link></li>
                <li><Link href="/courses" onClick={() => start("nav")} className="hover:text-white transition-colors" style={{ color: "var(--av-footer-text)" }}>Video Courses</Link></li>
                <li><button onClick={scrollToPricing} className="hover:text-white transition-colors" style={{ color: "var(--av-footer-text)" }}>Pricing</button></li>
                <li><Link href="/settings" onClick={() => start("nav")} className="hover:text-white transition-colors" style={{ color: "var(--av-footer-text)" }}>Settings</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.25em] mb-5" style={{ color: "var(--av-footer-heading)" }}>Company</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/about" onClick={() => start("nav")} className="hover:text-white transition-colors" style={{ color: "var(--av-footer-text)" }}>About Us</Link></li>
                <li><Link href="/contact" onClick={() => start("nav")} className="hover:text-white transition-colors" style={{ color: "var(--av-footer-text)" }}>Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.25em] mb-5" style={{ color: "var(--av-footer-heading)" }}>Connect</h4>
              <div className="flex gap-3">
                {[
                  { id: "footer-instagram-btn", icon: <Instagram className="w-4 h-4" />, url: "https://www.instagram.com/hmz_akt/",       label: "Instagram" },
                  { id: "footer-x-btn",         icon: <X         className="w-4 h-4" />, url: "https://x.com/hmz_akt",                    label: "X"         },
                  { id: "footer-linkedin-btn",  icon: <Linkedin  className="w-4 h-4" />, url: "https://www.linkedin.com/in/hmzakt/",       label: "LinkedIn"  },
                ].map((s) => (
                  <button key={s.id} id={s.id} onClick={() => window.open(s.url, "_blank")} aria-label={s.label}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                    style={{ background: "rgba(240,180,41,0.12)", color: "var(--av-footer-heading)", border: "1px solid rgba(240,180,41,0.2)" }}>
                    {s.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--av-footer-border)" }}>
          <div className="container mx-auto max-w-6xl px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-xs" style={{ color: "rgba(244,241,235,0.3)" }}>© 2025 KnotX · All rights reserved.</p>
            <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(244,241,235,0.2)" }}>Cleared For Takeoff ✦</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
