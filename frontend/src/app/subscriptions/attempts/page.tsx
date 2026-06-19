"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAttempts } from "@/hooks/useAttempts";
import { useContent } from "@/hooks/useContent";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollReveal } from "@/components/home/scroll-motion";
import {
  Clock, CheckCircle, Play, Eye, Trophy, Calendar,
  Search, BarChart3, Target, Radio, ArrowRight, AlertTriangle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type FilterType = "all" | "in-progress" | "completed";
type SortType = "newest" | "oldest" | "score-high" | "score-low";

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

const tickerItems = ["FLIGHT LOG", "ATTEMPT HISTORY", "PERFORMANCE TRACKING", "SCORE ANALYTICS", "PAPERS", "DGCA PREP", "ALTITUDE IS EARNED"];

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const formatDuration = (start: string, end?: string) => {
  const diffMs = (end ? new Date(end) : new Date()).getTime() - new Date(start).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ${hrs % 24}h`;
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  return `${mins}m`;
};

export default function AttemptsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("newest");
  const isDark = useIsDark();

  const router = useRouter();
  const { attempts, loading, error } = useAttempts();
  const { papers } = useContent();

  const getAttemptWithPaper = (attempt: any) => {
    const paper = papers.find((p) => p._id === attempt.paperId);
    return { ...attempt, paper: paper ? { title: paper.title, subject: paper.subject, price: paper.price } : null };
  };

  const filteredAttempts = (() => {
    if (!attempts) return [];
    let list = attempts.map(getAttemptWithPaper);
    if (searchQuery) list = list.filter((a) => a.paper?.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.paper?.subject.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filter !== "all") list = list.filter((a) => filter === "completed" ? a.status === "submitted" : a.status === filter);
    list.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "score-high") return (b.score || 0) - (a.score || 0);
      if (sortBy === "score-low") return (a.score || 0) - (b.score || 0);
      return 0;
    });
    return list;
  })();

  const stats = {
    total: attempts?.length || 0,
    completed: attempts?.filter((a) => a.status === "submitted").length || 0,
    inProgress: attempts?.filter((a) => a.status === "in-progress").length || 0,
    avgScore: (() => {
      const done = attempts?.filter((a) => a.status === "submitted" && a.score !== undefined) || [];
      return done.length ? done.reduce((s, a) => s + (a.score || 0), 0) / done.length : 0;
    })(),
  };

  const statCards = [
    { label: "Total Attempts", value: stats.total, icon: <Target className="w-5 h-5" />, accent: "var(--av-amber)" },
    { label: "Completed", value: stats.completed, icon: <CheckCircle className="w-5 h-5" />, accent: "var(--av-cobalt)" },
    { label: "In Progress", value: stats.inProgress, icon: <Radio className="w-5 h-5" />, accent: "var(--av-amber)" },
    { label: "Avg Score", value: stats.avgScore.toFixed(1), icon: <Trophy className="w-5 h-5" />, accent: "var(--av-cobalt)" },
  ];

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--av-bg)" }}>
        <div className="flex flex-col items-center gap-4">
          <div style={{ color: "var(--av-amber)" }}><PlaneSVG size={48} /></div>
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: "var(--av-ink-muted)" }}>Loading Flight Log…</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--av-bg)", color: "var(--av-ink)" }}>
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--av-signal)" }} />
          <p className="text-lg mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2.5 rounded-lg font-bold uppercase tracking-widest text-sm"
            style={{ background: "var(--av-amber)", color: "#0d1117" }}>Try Again</button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--av-bg)", color: "var(--av-ink)" }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-[60px]" style={{ minHeight: "38vh" }}>
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
            ✦ Flight Log
          </motion.p>
          <motion.h1 className="font-display-black uppercase leading-none mb-4"
            style={{ fontSize: "clamp(2rem, 8vw, 5.5rem)", letterSpacing: "-0.04em", color: "var(--av-ink)" }}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}>
            MY{" "}
            <span className="relative inline-block px-2">
              <span className="absolute inset-0 -skew-x-2" style={{ background: "var(--av-amber)", zIndex: -1 }} />
              <span style={{ color: "#0d1117" }}>ATTEMPTS.</span>
            </span>
          </motion.h1>
          <motion.p className="text-sm sm:text-base max-w-lg leading-relaxed" style={{ color: "var(--av-ink-muted)" }}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.28 }}>
            Track your progress and review your performance across all exam attempts.
          </motion.p>
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

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Stat cards */}
        <ScrollReveal y={24}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((s, i) => (
              <div key={i} className="relative group rounded-xl p-5 border-2 overflow-hidden transition-all hover:-translate-y-0.5"
                style={{ background: "var(--av-card-bg)", borderColor: i % 2 === 0 ? "var(--av-amber)" : "var(--av-card-border)" }}>
                <div className="absolute top-0 left-0 right-0 h-0.5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                  style={{ background: s.accent }} />
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: i % 2 === 0 ? "rgba(240,180,41,0.1)" : "rgba(10,42,94,0.08)", color: s.accent }}>
                    {s.icon}
                  </div>
                </div>
                <div className="font-display-black text-3xl mb-1" style={{ color: s.accent }}>{s.value}</div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--av-ink-muted)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Search + Filters */}
        <ScrollReveal y={20}>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--av-ink-muted)" }} />
              <input type="text" placeholder="Search by paper title or subject…"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-5 py-3 rounded-lg text-sm focus:outline-none transition-all"
                style={{ background: "var(--av-card-bg)", border: "1.5px solid var(--av-border)", color: "var(--av-ink)" }}
                onFocus={e => (e.target.style.borderColor = "var(--av-amber)")}
                onBlur={e => (e.target.style.borderColor = "var(--av-border)")} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["all", "in-progress", "completed"] as FilterType[]).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                  style={{
                    background: filter === f ? "var(--av-amber)" : "var(--av-card-bg)",
                    color: filter === f ? "#0d1117" : "var(--av-ink-muted)",
                    border: filter === f ? "1.5px solid var(--av-amber)" : "1.5px solid var(--av-border)",
                  }}>
                  {f === "all" ? "All" : f === "in-progress" ? "In Progress" : "Completed"}
                </button>
              ))}
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortType)}
                className="px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all focus:outline-none"
                style={{ background: "var(--av-card-bg)", border: "1.5px solid var(--av-border)", color: "var(--av-ink-muted)" }}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="score-high">Score: High → Low</option>
                <option value="score-low">Score: Low → High</option>
              </select>
            </div>
          </div>
        </ScrollReveal>

        <div className="h-px line-grow" style={{ background: "var(--av-border)" }} />

        {/* Attempts list */}
        {filteredAttempts.length > 0 ? (
          <div className="space-y-4">
            {filteredAttempts.map((attempt, idx) => {
              const isCompleted = attempt.status === "submitted";
              const scorePercent = isCompleted && attempt.totalQuestions > 0
                ? ((attempt.score || 0) / attempt.totalQuestions) * 100 : 0;
              return (
                <ScrollReveal key={attempt._id} delay={idx * 0.04} y={16}>
                  <div className="group relative rounded-xl border-2 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                    style={{ background: "var(--av-card-bg)", borderColor: isCompleted ? "var(--av-cobalt)" : "var(--av-card-border)" }}>
                    <div className="absolute top-0 left-0 right-0 h-0.5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                      style={{ background: isCompleted ? "var(--av-cobalt)" : "var(--av-amber)" }} />

                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-display uppercase text-base" style={{ color: "var(--av-ink)" }}>
                              {attempt.paper?.title || "Unknown Paper"}
                            </h3>
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                              style={{ background: "rgba(240,180,41,0.1)", color: "var(--av-amber)" }}>
                              {attempt.paper?.subject || "—"}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded inline-flex items-center gap-1 ${isCompleted ? "" : ""}`}
                              style={{
                                background: isCompleted ? isDark ? "rgba(74,143,239,0.12)" : "rgba(10,42,94,0.06)" : "rgba(240,180,41,0.1)",
                                color: isCompleted ? "var(--av-cobalt)" : "var(--av-amber)",
                                border: `1px solid ${isCompleted ? "var(--av-cobalt)" : "rgba(240,180,41,0.3)"}`,
                              }}>
                              {isCompleted ? <CheckCircle className="w-2.5 h-2.5" /> : <Radio className="w-2.5 h-2.5" />}
                              {isCompleted ? "Completed" : "In Progress"}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "var(--av-ink-muted)" }}>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Started: {formatDate(attempt.createdAt)}</span>
                            {attempt.submittedAt && (
                              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" />Completed: {formatDate(attempt.submittedAt)}</span>
                            )}
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Duration: {formatDuration(attempt.createdAt, attempt.submittedAt)}</span>
                          </div>

                          {/* Score bar */}
                          {isCompleted && attempt.totalQuestions > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs mb-1" style={{ color: "var(--av-ink-muted)" }}>
                                <span>{attempt.score || 0} / {attempt.totalQuestions} correct</span>
                                <span className="font-bold" style={{ color: scorePercent >= 60 ? "var(--av-cobalt)" : "var(--av-amber)" }}>
                                  {scorePercent.toFixed(0)}%
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--av-border)" }}>
                                <motion.div className="h-full rounded-full"
                                  initial={{ width: 0 }} animate={{ width: `${scorePercent}%` }} transition={{ duration: 0.8, delay: idx * 0.04 + 0.2 }}
                                  style={{ background: scorePercent >= 60 ? "var(--av-cobalt)" : "var(--av-amber)" }} />
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            if (attempt.status === "in-progress") router.push(`/subscriptions/attempts/attempt-paper?attemptId=${attempt._id}`);
                            else router.push(`/subscriptions/attempts/attempt-reviews?attemptId=${attempt._id}`);
                          }}
                          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.03] flex-shrink-0"
                          style={{ background: isCompleted ? "var(--av-cobalt)" : "var(--av-amber)", color: isCompleted ? "#fff" : "#0d1117" }}>
                          {attempt.status === "in-progress"
                            ? <><Play className="w-3.5 h-3.5" /> Resume</>
                            : <><Eye className="w-3.5 h-3.5" /> View Results</>}
                        </button>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: "rgba(240,180,41,0.06)", border: "1.5px solid var(--av-border)" }}>
              <BarChart3 className="w-7 h-7" style={{ color: "var(--av-ink-muted)" }} />
            </div>
            <p className="font-display uppercase text-lg mb-2" style={{ color: "var(--av-ink)" }}>
              {searchQuery || filter !== "all" ? "No Attempts Found" : "No Attempts Yet"}
            </p>
            <p className="text-sm mb-6" style={{ color: "var(--av-ink-muted)" }}>
              {searchQuery || filter !== "all" ? "Adjust your search or filter." : "Start attempting papers to see your flight log here."}
            </p>
            {!searchQuery && filter === "all" && (
              <button onClick={() => router.push("/subscriptions")}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm uppercase tracking-widest"
                style={{ background: "var(--av-amber)", color: "#0d1117" }}>
                Go to Subscriptions <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
