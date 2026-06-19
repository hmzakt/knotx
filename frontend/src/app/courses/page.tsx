"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PaymentModal from "@/components/PaymentModal";
import { useCourses, Course } from "@/hooks/useCourses";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollReveal } from "@/components/home/scroll-motion";
import {
  Search, X, Lock, Play, Clock, BookOpen, ArrowRight,
  GraduationCap, CrownIcon, Star,
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

function PlaneSVG({ size = 40 }: { size?: number }) {
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

function RunwayLines({ color = "currentColor" }: { color?: string }) {
  return (
    <svg className="absolute bottom-0 left-0 w-full" style={{ opacity: 0.07 }} viewBox="0 0 1200 60" preserveAspectRatio="none">
      <line x1="0" y1="30" x2="1200" y2="30" stroke={color} strokeWidth="1.5" strokeDasharray="60 20" />
      <line x1="0" y1="48" x2="1200" y2="48" stroke={color} strokeWidth="1" strokeDasharray="40 30" />
      <line x1="0" y1="12" x2="1200" y2="12" stroke={color} strokeWidth="1" strokeDasharray="40 30" />
    </svg>
  );
}

const formatDuration = (seconds: number) => {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

const LEVELS = ["all", "beginner", "intermediate", "advanced"] as const;
type Level = typeof LEVELS[number];

const levelMeta: Record<Level, { label: string; color: string; bg: string }> = {
  all: { label: "All Levels", color: "var(--av-ink)", bg: "var(--av-card-bg)" },
  beginner: { label: "Beginner", color: "var(--av-amber)", bg: "rgba(240,180,41,0.1)" },
  intermediate: { label: "Intermediate", color: "var(--av-cobalt)", bg: "rgba(10,42,94,0.08)" },
  advanced: { label: "Advanced", color: "var(--av-signal)", bg: "rgba(230,57,70,0.08)" },
};

const tickerItems = ["VIDEO COURSES", "EXPERT-LED", "DGCA PREP", "CPL · PPL · ATPL", "LEARN THEN PRACTICE", "CLEARED FOR TAKEOFF", "ALTITUDE IS EARNED", "FLY THE EXAM"];

export default function CoursesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { subscriptions } = useSubscription();
  const { courses, loading, error } = useCourses();
  const isDark = useIsDark();

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<Level>("all");
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; data: any }>({ isOpen: false, data: null });

  const hasCourseAccess = (courseId: string) => {
    if (!subscriptions) return false;
    if ((subscriptions as any).hasAllCourses) return true;
    return (subscriptions.subscriptions?.singleCourses || []).some(
      (sub: any) => (sub.itemId?._id || sub.itemId) === courseId
    );
  };

  const buildCoursePayment = (course: Course) => ({
    type: "single-course" as const,
    itemId: course._id,
    itemName: course.title,
    itemDescription: course.shortDescription || `${course.level} • ${course.language}`,
    baseAmount: Math.max(Math.round((course.price || 0) * 100), 100),
    currency: "INR",
    durationDays: 365,
  });

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.shortDescription || "").toLowerCase().includes(search.toLowerCase()) ||
        c.instructor?.fullname?.toLowerCase().includes(search.toLowerCase());
      const matchLevel = levelFilter === "all" || c.level === levelFilter;
      return matchSearch && matchLevel;
    });
  }, [courses, search, levelFilter]);

  // ── Auth / Loading gates ──────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-16" style={{ background: "var(--av-bg)", color: "var(--av-ink)" }}>
        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(240,180,41,0.1)", border: "2px solid var(--av-amber)" }}>
            <Lock className="w-9 h-9" style={{ color: "var(--av-amber)" }} />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] mb-3" style={{ color: "var(--av-amber)" }}>✦ Restricted Airspace</p>
          <h2 className="font-display-black uppercase text-3xl sm:text-4xl mb-3" style={{ letterSpacing: "-0.03em" }}>Login Required.</h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--av-ink-muted)" }}>
            Log in to browse and enroll in video courses.
          </p>
          <button className="btn-amber-glow w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-bold uppercase tracking-widest text-sm"
            style={{ background: "var(--av-amber)", color: "#0d1117" }}
            onClick={() => router.push("/login")}>
            Login <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--av-bg)" }}>
        <div className="flex flex-col items-center gap-4">
          <div style={{ color: "var(--av-amber)" }}><PlaneSVG size={48} /></div>
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: "var(--av-ink-muted)" }}>Loading Flight Deck…</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--av-bg)", color: "var(--av-ink)" }}>
        <p>{error}</p>
      </div>
    );

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--av-bg)", color: "var(--av-ink)" }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-[60px]" style={{ minHeight: "40vh" }}>
        <div className={`absolute inset-0 ${isDark ? "hero-bg-dark" : "hero-bg-light"}`} />
        <div className={`absolute inset-0 ${isDark ? "hero-grid-dark" : "hero-grid-light"}`} />
        <div className="hero-orb hero-orb-amber" />
        <div className="hero-orb hero-orb-cobalt" />
        <div className="hero-grain" />
        <RunwayLines color={isDark ? "#f0b429" : "#0a2a5e"} />
        <div className="plane-animate pointer-events-none hidden md:block" style={{ top: "30%", color: "var(--av-amber)", zIndex: 10 }}>
          <PlaneSVG size={40} />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-5 sm:px-8 py-14 sm:py-20">
          <motion.p className="text-xs font-bold uppercase tracking-[0.35em] mb-4" style={{ color: "var(--av-amber)" }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            ✦ Flight School
          </motion.p>
          <motion.h1 className="font-display-black uppercase leading-none mb-4"
            style={{ fontSize: "clamp(2.2rem, 9vw, 6rem)", letterSpacing: "-0.04em", color: "var(--av-ink)" }}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}>
            VIDEO{" "}
            <span className="relative inline-block px-2">
              <span className="absolute inset-0 -skew-x-2" style={{ background: "var(--av-amber)", zIndex: -1 }} />
              <span style={{ color: "#0d1117" }}>COURSES.</span>
            </span>
          </motion.h1>
          <motion.p className="text-sm sm:text-base max-w-lg leading-relaxed mb-8" style={{ color: "var(--av-ink-muted)" }}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.28 }}>
            Learn with structured video lectures from expert DGCA instructors. Pick your subject, set your pace.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.38 }}>
            {(subscriptions as any)?.hasAllCourses ? (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm uppercase tracking-widest"
                style={{ background: "rgba(240,180,41,0.12)", border: "1.5px solid var(--av-amber)", color: "var(--av-amber)" }}>
                <CrownIcon className="w-4 h-4" /> All-Courses Access Active
              </div>
            ) : (
              <button
                className="btn-amber-glow flex items-center gap-2 px-7 py-3 rounded-lg font-bold uppercase tracking-widest text-sm transition-all hover:scale-[1.03]"
                style={{ background: "var(--av-amber)", color: "#0d1117" }}
                onClick={() => setPaymentModal({
                  isOpen: true,
                  data: { type: "all-courses", itemName: "KnotX All Courses", itemDescription: "Unlimited access to all video courses", baseAmount: Number(process.env.NEXT_PUBLIC_ALL_COURSES_PRICE_PAISE || 99900), currency: "INR", durationDays: 365 },
                })}>
                <CrownIcon className="w-4 h-4" /> Get All Courses
              </button>
            )}
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

      {/* ── Filters + Grid ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Search + Level */}
        <ScrollReveal y={20}>
          <div className="flex flex-col sm:flex-row gap-4 max-w-3xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--av-ink-muted)" }} />
              <input type="text" placeholder="Search courses, instructors…"
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-3 rounded-lg text-sm focus:outline-none transition-all"
                style={{ background: "var(--av-card-bg)", border: "1.5px solid var(--av-border)", color: "var(--av-ink)" }}
                onFocus={e => (e.target.style.borderColor = "var(--av-amber)")}
                onBlur={e => (e.target.style.borderColor = "var(--av-border)")} />
              <AnimatePresence>
                {search && (
                  <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--av-ink-muted)" }}>
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            <div className="flex gap-2 flex-wrap">
              {LEVELS.map((l) => (
                <button key={l} onClick={() => setLevelFilter(l)}
                  className="px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200"
                  style={{
                    background: levelFilter === l ? levelMeta[l].bg : "var(--av-card-bg)",
                    color: levelFilter === l ? levelMeta[l].color : "var(--av-ink-muted)",
                    border: levelFilter === l ? `1.5px solid ${levelMeta[l].color}` : "1.5px solid var(--av-border)",
                  }}>
                  {levelMeta[l].label}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <p className="text-xs text-center font-mono" style={{ color: "var(--av-ink-muted)" }}>
          {filtered.length} course{filtered.length !== 1 ? "s" : ""} found
        </p>

        <div className="h-px line-grow" style={{ background: "var(--av-border)" }} />

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(240,180,41,0.06)", border: "1.5px solid var(--av-border)" }}>
              <BookOpen className="w-6 h-6" style={{ color: "var(--av-ink-muted)" }} />
            </div>
            <p className="font-display uppercase text-base" style={{ color: "var(--av-ink)" }}>No Courses Found</p>
            <p className="text-sm mt-1" style={{ color: "var(--av-ink-muted)" }}>Try a different search or level filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((course, idx) => {
              const hasAccess = hasCourseAccess(course._id);
              const lv = (course.level || "beginner") as Level;
              const lvMeta = levelMeta[lv] || levelMeta.beginner;
              return (
                <ScrollReveal key={course._id} delay={idx * 0.04} y={24}>
                  <div className="group relative rounded-xl overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col h-full"
                    style={{ background: "var(--av-card-bg)", borderColor: hasAccess ? "var(--av-cobalt)" : "var(--av-card-border)" }}>
                    <div className="absolute top-0 left-0 right-0 h-0.5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 z-10" style={{ background: "var(--av-amber)" }} />

                    {/* Thumbnail */}
                    <div className="relative aspect-video" style={{ background: isDark ? "#0d1525" : "#eae6dc" }}>
                      {course.thumbnail?.url ? (
                        <img src={course.thumbnail.url} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-10 h-10" style={{ color: "var(--av-ink-muted)" }} />
                        </div>
                      )}
                      {!hasAccess && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(7,12,24,0.4)" }}>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(240,180,41,0.15)", border: "1.5px solid var(--av-amber)" }}>
                            <Lock className="w-5 h-5" style={{ color: "var(--av-amber)" }} />
                          </div>
                        </div>
                      )}
                      {hasAccess && (
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest"
                            style={{ background: isDark ? "rgba(74,143,239,0.2)" : "rgba(10,42,94,0.1)", color: "var(--av-cobalt)", border: "1px solid var(--av-cobalt)" }}>
                            Enrolled
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                          style={{ background: lvMeta.bg, color: lvMeta.color }}>
                          {course.level}
                        </span>
                      </div>
                      <h3 className="font-display uppercase text-base leading-tight mb-1 line-clamp-2" style={{ color: "var(--av-ink)" }}>{course.title}</h3>
                      {course.shortDescription && (
                        <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: "var(--av-ink-muted)" }}>{course.shortDescription}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs mb-2 mt-auto" style={{ color: "var(--av-ink-muted)" }}>
                        {course.totalDuration > 0 && (
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(course.totalDuration)}</span>
                        )}
                        {course.ratingsAverage > 0 && (
                          <span className="flex items-center gap-1"><Star className="w-3 h-3" style={{ color: "var(--av-amber)" }} />{course.ratingsAverage.toFixed(1)}</span>
                        )}
                      </div>
                      <p className="text-xs mb-4" style={{ color: "var(--av-ink-muted)" }}>by {course.instructor?.fullname}</p>
                      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--av-border)" }}>
                        <span className="font-display-black text-lg" style={{ color: "var(--av-ink)" }}>
                          {course.isFree || course.price === 0 ? "Free" : formatPrice(course.price)}
                        </span>
                        <button
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.03]"
                          style={{ background: hasAccess ? "var(--av-cobalt)" : "var(--av-amber)", color: hasAccess ? "#fff" : "#0d1117" }}
                          onClick={() => { if (hasAccess) router.push(`/courses/${course._id}`); else setPaymentModal({ isOpen: true, data: buildCoursePayment(course) }); }}>
                          {hasAccess ? <><Play className="w-3.5 h-3.5" /> Watch</> : "Buy"}
                        </button>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </div>

      {paymentModal.isOpen && (
        <PaymentModal isOpen={paymentModal.isOpen} onClose={() => setPaymentModal({ isOpen: false, data: null })} paymentData={paymentModal.data} />
      )}
    </div>
  );
}
