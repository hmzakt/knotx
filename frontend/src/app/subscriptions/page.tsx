"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRouteLoading } from "@/contexts/RouteLoadingContext";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useContent } from "@/hooks/useContent";
import { useAttempts } from "@/hooks/useAttempts";
import apiClient from "@/lib/api";
import {
  CrownIcon, Search, FileText, Layers, Video,
  ArrowRight, CheckCircle2, Radio, BarChart2,
  PlayCircle, ChevronDown, ChevronUp, AlertTriangle,
} from "lucide-react";
import { useCourses, Course } from "@/hooks/useCourses";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollReveal } from "@/components/home/scroll-motion";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Paper {
  _id: string;
  title: string;
  subject: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

interface TestSeries {
  _id: string;
  title: string;
  description: string;
  price: number;
  papers?: Paper[];
  papersCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

type TabType = "papers" | "test-series" | "courses";

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

// ─── Decorative SVGs ─────────────────────────────────────────────────────────

function PlaneSVG({ size = 36 }: { size?: number }) {
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

// ─── Status Badge ─────────────────────────────────────────────────────────────

function AttemptStatusBadge({ status }: { status: string }) {
  if (status === "in-progress") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest"
      style={{ background: "rgba(240,180,41,0.15)", color: "var(--av-amber)", border: "1px solid rgba(240,180,41,0.3)" }}>
      <Radio className="w-3 h-3" /> In Progress
    </span>
  );
  if (status === "completed") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest"
      style={{ background: isDarkBadge("rgba(74,143,239,0.12)", "rgba(10,42,94,0.08)"), color: "var(--av-cobalt)", border: "1px solid var(--av-cobalt)" }}>
      <CheckCircle2 className="w-3 h-3" /> Completed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest"
      style={{ background: "rgba(138,155,181,0.08)", color: "var(--av-ink-muted)", border: "1px solid var(--av-border)" }}>
      Not Started
    </span>
  );
}

// helper for badge bg (used outside hook context)
const isDarkBadge = (dark: string, light: string) => {
  if (typeof document === "undefined") return light;
  return document.documentElement.classList.contains("dark") ? dark : light;
};

const tickerItems = ["MY FLIGHT DECK", "SUBSCRIBED CONTENT", "PAPERS", "TEST SERIES", "VIDEO COURSES", "CLEARED FOR TAKEOFF", "TRACK YOUR PROGRESS", "FLY THE EXAM"];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("papers");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);
  const [testSeriesWithPapers, setTestSeriesWithPapers] = useState<TestSeries[]>([]);
  const [loadingSeriesDetails, setLoadingSeriesDetails] = useState(false);
  const isDark = useIsDark();

  const router = useRouter();
  const { start } = useRouteLoading();
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const { subscriptions, loading: loadingSubscriptions, error: subscriptionError, initialized } = useSubscription();
  const { papers, testSeries, loading: loadingContent, error: contentError } = useContent();
  const { courses, loading: loadingCourses } = useCourses();
  const { attempts, loading: loadingAttempts, getAttemptStatus, getAttemptForPaper } = useAttempts();

  const [startConflicts, setStartConflicts] = useState<Record<string, { attemptId?: string; message?: string }>>({});
  const [rulesDialog, setRulesDialog] = useState<{ isOpen: boolean; paperId: string | null }>({ isOpen: false, paperId: null });
  const [rulesAccepted, setRulesAccepted] = useState(false);

  const fetchTestSeriesWithPapers = async (seriesId: string) => {
    try {
      setLoadingSeriesDetails(true);
      const response = await apiClient.get<ApiResponse<TestSeries>>(`/private/test-series/${seriesId}`);
      return response.data.data;
    } catch { return null; }
    finally { setLoadingSeriesDetails(false); }
  };

  const handleExpandSeries = async (seriesId: string) => {
    if (expandedSeries === seriesId) { setExpandedSeries(null); return; }
    const existing = testSeriesWithPapers.find((s) => s._id === seriesId);
    if (existing) { setExpandedSeries(seriesId); return; }
    const details = await fetchTestSeriesWithPapers(seriesId);
    if (details) { setTestSeriesWithPapers((prev) => [...prev, details]); setExpandedSeries(seriesId); }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(price);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });

  const getFilteredPapers = () => {
    if (!subscriptions) return [];
    let available: Paper[] = subscriptions.hasAllAccess
      ? papers
      : papers.filter((p) => subscriptions.subscriptions.singlePapers.some((sub: any) => (sub.itemId?._id || sub.itemId) === p._id));
    return available.filter(p =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredTestSeries = () => {
    if (!subscriptions) return [];
    let available: TestSeries[] = subscriptions.hasAllAccess
      ? testSeries
      : testSeries.filter((s) => subscriptions.subscriptions.testSeries.some((sub: any) => (sub.itemId?._id || sub.itemId) === s._id));
    return available.filter(s =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredCourses = () => {
    if (!subscriptions) return [];
    const subs = subscriptions as any;
    let available: Course[] = subs.hasAllCourses
      ? courses
      : courses.filter((c) => (subs.subscriptions?.singleCourses || []).some((sub: any) => (sub.itemId?._id || sub.itemId) === c._id));
    return available.filter(c =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.shortDescription || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleStartAttemptInline = async (paperId: string) => {
    const status = getAttemptStatus(paperId);
    if (status.status === "not-attempted") { setRulesDialog({ isOpen: true, paperId }); setRulesAccepted(false); return; }
    start('nav'); setNavigatingId(paperId);
    try {
      const res = await apiClient.post(`/attempts/start/${paperId}`);
      const payload = res.data?.data ?? res.data;
      const attemptId = payload.attemptId || payload._id || payload.id;
      if (attemptId) { router.push(`/subscriptions/attempts/attempt-paper?attemptId=${attemptId}`); return; }
      router.push(`/subscriptions/attempts/attempt-paper?paperId=${paperId}`);
    } catch (err: any) {
      const status = err?.response?.status;
      const respData = err?.response?.data;
      if (status === 409) {
        const attemptIdFromResp = respData?.data?.attemptId || respData?.attemptId || respData?.existingAttemptId || respData?.data?.id;
        setStartConflicts(prev => ({ ...prev, [paperId]: { attemptId: attemptIdFromResp, message: respData?.message } }));
      } else {
        alert(err?.response?.data?.message || err?.message || 'Failed to start attempt');
      }
    } finally { setNavigatingId(null); }
  };

  const handleRulesAcceptance = async () => {
    if (!rulesAccepted || !rulesDialog.paperId) return;
    const paperId = rulesDialog.paperId;
    setRulesDialog({ isOpen: false, paperId: null });
    setRulesAccepted(false);
    // Call the API directly — bypasses the rules-dialog check in handleStartAttemptInline
    start('nav'); setNavigatingId(paperId);
    try {
      const res = await apiClient.post(`/attempts/start/${paperId}`);
      const payload = res.data?.data ?? res.data;
      const attemptId = payload.attemptId || payload._id || payload.id;
      if (attemptId) { router.push(`/subscriptions/attempts/attempt-paper?attemptId=${attemptId}`); return; }
      router.push(`/subscriptions/attempts/attempt-paper?paperId=${paperId}`);
    } catch (err: any) {
      const status = err?.response?.status;
      const respData = err?.response?.data;
      if (status === 409) {
        const attemptIdFromResp = respData?.data?.attemptId || respData?.attemptId || respData?.existingAttemptId || respData?.data?.id;
        setStartConflicts(prev => ({ ...prev, [paperId]: { attemptId: attemptIdFromResp, message: respData?.message } }));
      } else {
        alert(respData?.message || err?.message || 'Failed to start attempt');
      }
    } finally { setNavigatingId(null); }
  };

  // ── Loading/Error gates ───────────────────────────────────────────────────

  if (loadingSubscriptions || !initialized || loadingContent || loadingAttempts || loadingCourses) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--av-bg)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12" style={{ color: "var(--av-amber)" }}>
            <PlaneSVG size={48} />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: "var(--av-ink-muted)" }}>Loading Flight Deck…</p>
        </div>
      </div>
    );
  }

  if (subscriptionError || contentError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--av-bg)", color: "var(--av-ink)" }}>
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--av-signal)" }} />
          <h2 className="font-display-black text-2xl uppercase mb-3" style={{ color: "var(--av-signal)" }}>System Error</h2>
          <p className="text-sm mb-6" style={{ color: "var(--av-ink-muted)" }}>{subscriptionError || contentError}</p>
          <button onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-lg font-bold uppercase tracking-widest text-sm"
            style={{ background: "var(--av-amber)", color: "#0d1117" }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!subscriptions || !subscriptions.hasAnySubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-16" style={{ background: "var(--av-bg)" }}>
        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(240,180,41,0.08)", border: "2px dashed var(--av-border)" }}>
            <div className="w-12 h-12" style={{ color: "var(--av-ink-muted)" }}>
              <PlaneSVG size={48} />
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] mb-3" style={{ color: "var(--av-amber)" }}>✦ No Active Flight Plans</p>
          <h2 className="font-display-black uppercase text-3xl sm:text-4xl mb-3" style={{ letterSpacing: "-0.03em", color: "var(--av-ink)" }}>
            Nothing Subscribed.
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--av-ink-muted)" }}>
            You haven&apos;t subscribed to any papers, test series, or courses yet.
            Head to the explore page to file your first flight plan.
          </p>
          <button
            className="btn-amber-glow w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-bold uppercase tracking-widest text-sm transition-all duration-200 hover:scale-[1.02]"
            style={{ background: "var(--av-amber)", color: "#0d1117" }}
            onClick={() => { start("nav"); router.push("/explore"); }}
          >
            Explore Content <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  const filteredPapers = getFilteredPapers();
  const filteredTestSeries = getFilteredTestSeries();
  const filteredCourses = getFilteredCourses();

  const tabs = [
    { id: "papers" as TabType, label: "Papers", count: filteredPapers.length, num: "01", icon: <FileText className="w-4 h-4" /> },
    { id: "test-series" as TabType, label: "Test Series", count: filteredTestSeries.length, num: "02", icon: <Layers className="w-4 h-4" /> },
    { id: "courses" as TabType, label: "Courses", count: filteredCourses.length, num: "03", icon: <Video className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--av-bg)", color: "var(--av-ink)" }}>

      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-[60px]" style={{ minHeight: "38vh" }}>
        <div className={`absolute inset-0 ${isDark ? "hero-bg-dark" : "hero-bg-light"}`} />
        <div className={`absolute inset-0 ${isDark ? "hero-grid-dark" : "hero-grid-light"}`} />
        <div className="hero-orb hero-orb-amber" />
        <div className="hero-orb hero-orb-cobalt" />
        <div className="hero-grain" />
        <RunwayLines color={isDark ? "#f0b429" : "#0a2a5e"} />

        {/* Plane animation */}
        <div className="plane-animate pointer-events-none hidden md:block"
          style={{ top: "35%", color: "var(--av-amber)", zIndex: 10 }}>
          <PlaneSVG size={40} />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-5 sm:px-8 py-14 sm:py-18">
          <motion.p className="text-xs font-bold uppercase tracking-[0.35em] mb-4" style={{ color: "var(--av-amber)" }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            ✦ My Flight Deck
          </motion.p>
          <motion.h1 className="font-display-black uppercase leading-none mb-4"
            style={{ fontSize: "clamp(2rem, 8vw, 5.5rem)", letterSpacing: "-0.04em", color: "var(--av-ink)" }}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}>
            MY{" "}
            <span className="relative inline-block px-2">
              <span className="absolute inset-0 -skew-x-2" style={{ background: "var(--av-amber)", zIndex: -1 }} />
              <span style={{ color: "#0d1117" }}>SUBSCRIPTIONS.</span>
            </span>
          </motion.h1>
          <motion.p className="text-sm sm:text-base max-w-lg leading-relaxed mb-8" style={{ color: "var(--av-ink-muted)" }}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.28 }}>
            Access your subscribed content and track your learning progress across every subject.
          </motion.p>

          {/* All-access Pro card */}
          {subscriptions?.hasAllAccess && (
            <motion.div
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl"
              style={{ background: "rgba(240,180,41,0.12)", border: "2px solid var(--av-amber)" }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--av-amber)" }}>
                <CrownIcon className="w-4 h-4 text-[#0d1117]" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--av-amber)" }}>Pro — All Access</p>
                <p className="text-xs" style={{ color: "var(--av-ink-muted)" }}>Cleared for all content · Unlimited access</p>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Cobalt Ticker ───────────────────────────────────────────────── */}
      <div className="w-full overflow-hidden py-3 border-y" style={{ background: "var(--av-cobalt)", borderColor: "var(--av-cobalt)" }}>
        <div className="ticker-track whitespace-nowrap" style={{ animationDuration: "22s", animationDirection: "reverse" }}>
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-4 px-4">
              <span className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "#ffffff" }}>{item}</span>
              <span style={{ color: "var(--av-amber)", fontSize: "1.1rem" }}>✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Content Area ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Search */}
        <ScrollReveal y={20}>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--av-ink-muted)" }} />
            <input
              type="text"
              placeholder="Search your subscribed content…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-5 py-3 rounded-lg text-sm focus:outline-none transition-all"
              style={{
                background: "var(--av-card-bg)",
                border: "1.5px solid var(--av-border)",
                color: "var(--av-ink)",
              }}
              onFocus={e => (e.target.style.borderColor = "var(--av-amber)")}
              onBlur={e => (e.target.style.borderColor = "var(--av-border)")}
            />
          </div>
        </ScrollReveal>

        {/* Tabs */}
        <ScrollReveal y={16} delay={0.05}>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="relative flex items-center gap-2.5 px-5 py-2.5 transition-all duration-200 rounded-lg"
                style={{
                  background: activeTab === tab.id ? "var(--av-amber)" : "var(--av-card-bg)",
                  color: activeTab === tab.id ? "#0d1117" : "var(--av-ink-muted)",
                  border: activeTab === tab.id ? "2px solid var(--av-amber)" : "1.5px solid var(--av-border)",
                  fontWeight: 700,
                }}>
                <span className="font-mono text-xs opacity-60">{tab.num}</span>
                {tab.icon}
                <span className="text-xs uppercase tracking-widest">{tab.label}</span>
                <span className="ml-1 text-xs font-mono px-1.5 py-0.5 rounded"
                  style={{
                    background: activeTab === tab.id ? "rgba(13,17,23,0.15)" : "rgba(240,180,41,0.1)",
                    color: activeTab === tab.id ? "#0d1117" : "var(--av-amber)",
                  }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Divider */}
        <div className="h-px line-grow" style={{ background: "var(--av-border)" }} />

        {/* ── Grid ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* COURSES */}
          {activeTab === "courses" && (
            filteredCourses.length === 0 ? (
              <div className="col-span-full flex flex-col items-center py-16 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                  style={{ background: "rgba(240,180,41,0.06)", border: "1.5px solid var(--av-border)" }}>
                  <Video className="w-6 h-6" style={{ color: "var(--av-ink-muted)" }} />
                </div>
                <p className="font-display uppercase text-base mb-2" style={{ color: "var(--av-ink)" }}>No Courses Subscribed</p>
                <p className="text-sm mb-5" style={{ color: "var(--av-ink-muted)" }}>
                  Browse video courses and subscribe to start learning.
                </p>
                <button onClick={() => { start('nav'); router.push('/explore'); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm uppercase tracking-widest"
                  style={{ background: "var(--av-amber)", color: "#0d1117" }}>
                  Browse Courses <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : filteredCourses.map((course, idx) => (
              <ScrollReveal key={course._id} delay={idx * 0.05} y={24}>
                <div className="group relative rounded-xl overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col h-full"
                  style={{ background: "var(--av-card-bg)", borderColor: "var(--av-cobalt)" }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 z-10" style={{ background: "var(--av-amber)" }} />

                  {course.thumbnail?.url && (
                    <div className="aspect-video relative">
                      <img src={course.thumbnail.url} alt={course.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--av-amber)" }}>{course.level}</span>
                    <h3 className="font-display uppercase text-base leading-tight mb-2" style={{ color: "var(--av-ink)" }}>{course.title}</h3>
                    {course.shortDescription && (
                      <p className="text-xs leading-relaxed mb-4 line-clamp-2" style={{ color: "var(--av-ink-muted)" }}>{course.shortDescription}</p>
                    )}
                    <div className="mt-auto pt-3 border-t" style={{ borderColor: "var(--av-border)" }}>
                      <button onClick={() => { start('nav'); router.push(`/courses/${course._id}`); }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold uppercase tracking-widest text-sm transition-all hover:opacity-90"
                        style={{ background: "var(--av-cobalt)", color: "#ffffff" }}>
                        <PlayCircle className="w-4 h-4" /> Continue Watching
                      </button>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))
          )}

          {/* PAPERS */}
          {activeTab === "papers" && (
            filteredPapers.length === 0 ? (
              <div className="col-span-full flex flex-col items-center py-16 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                  style={{ background: "rgba(240,180,41,0.06)", border: "1.5px solid var(--av-border)" }}>
                  <FileText className="w-6 h-6" style={{ color: "var(--av-ink-muted)" }} />
                </div>
                <p className="font-display uppercase text-base mb-2" style={{ color: "var(--av-ink)" }}>No Papers Found</p>
                <p className="text-sm mb-5" style={{ color: "var(--av-ink-muted)" }}>Try a different search term or explore more content.</p>
                <button onClick={() => { start('nav'); router.push('/explore'); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm uppercase tracking-widest"
                  style={{ background: "var(--av-amber)", color: "#0d1117" }}>
                  Explore Papers <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : filteredPapers.map((paper, idx) => {
              const attemptStatus = getAttemptStatus(paper._id);
              const attemptForPaper = getAttemptForPaper(paper._id);
              return (
                <ScrollReveal key={paper._id} delay={idx * 0.05} y={24}>
                  <div className="group relative rounded-xl border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    style={{ background: "var(--av-card-bg)", borderColor: "var(--av-card-border)" }}>
                    <div className="absolute top-0 left-0 right-0 h-0.5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                      style={{ background: "var(--av-amber)" }} />
                    <div className="p-6">
                      {/* Subject + Status row */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: "var(--av-amber)" }}>
                          {paper.subject}
                        </span>
                        <AttemptStatusBadge status={attemptStatus.status} />
                      </div>

                      <h3 className="font-display uppercase text-base leading-tight mb-1" style={{ color: "var(--av-ink)" }}>{paper.title}</h3>
                      <p className="text-xs mb-4" style={{ color: "var(--av-ink-muted)" }}>Added {formatDate(paper.createdAt)}</p>

                      {/* Conflict banner */}
                      {startConflicts[paper._id] && (
                        <div className="mb-4 p-3 rounded-lg" style={{ background: "rgba(240,180,41,0.08)", border: "1px solid rgba(240,180,41,0.25)" }}>
                          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--av-amber)" }}>Active Attempt Detected</p>
                          <p className="text-xs mb-2" style={{ color: "var(--av-ink-muted)" }}>{startConflicts[paper._id].message || 'You cannot start a new attempt right now.'}</p>
                          <div className="flex gap-2">
                            {startConflicts[paper._id].attemptId && (
                              <button className="text-xs font-bold px-3 py-1.5 rounded"
                                style={{ background: "var(--av-amber)", color: "#0d1117" }}
                                onClick={() => router.push(`/subscriptions/attempts/attempt-paper?attemptId=${startConflicts[paper._id].attemptId}`)}>
                                Resume
                              </button>
                            )}
                            <button className="text-xs font-semibold px-3 py-1.5 rounded"
                              style={{ border: "1.5px solid var(--av-border)", color: "var(--av-ink-muted)" }}
                              onClick={() => setStartConflicts(prev => { const c = { ...prev }; delete c[paper._id]; return c; })}>
                              Dismiss
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Price + CTA */}
                      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "var(--av-border)" }}>
                        <span className="font-display-black text-lg" style={{ color: "var(--av-ink)" }}>
                          {formatPrice(paper.price)}
                        </span>
                        <button
                          onClick={() => {
                            if (attemptStatus.status === 'not-attempted') return handleStartAttemptInline(paper._id);
                            start('nav'); setNavigatingId(paper._id);
                            if (attemptStatus.status === 'in-progress') router.push(`/subscriptions/attempts/attempt-paper?attemptId=${attemptForPaper?._id}`);
                            else router.push(`/subscriptions/attempts/attempt-reviews?attemptId=${attemptForPaper?._id}`);
                          }}
                          disabled={navigatingId === paper._id}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200 hover:scale-[1.03] disabled:opacity-50"
                          style={{ background: "var(--av-amber)", color: "#0d1117" }}
                        >
                          {navigatingId === paper._id ? "Loading…"
                            : attemptStatus.status === 'not-attempted' ? "Start"
                            : attemptStatus.status === 'in-progress'
                              ? <><Radio className="w-3.5 h-3.5" />Resume</>
                              : <><BarChart2 className="w-3.5 h-3.5" />Results</>}
                        </button>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })
          )}

          {/* TEST SERIES */}
          {activeTab === "test-series" && (
            filteredTestSeries.length === 0 ? (
              <div className="col-span-full flex flex-col items-center py-16 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                  style={{ background: "rgba(240,180,41,0.06)", border: "1.5px solid var(--av-border)" }}>
                  <Layers className="w-6 h-6" style={{ color: "var(--av-ink-muted)" }} />
                </div>
                <p className="font-display uppercase text-base mb-2" style={{ color: "var(--av-ink)" }}>No Test Series Found</p>
                <p className="text-sm mb-5" style={{ color: "var(--av-ink-muted)" }}>Subscribe to a structured test series to get started.</p>
                <button onClick={() => { start('nav'); router.push('/explore'); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm uppercase tracking-widest"
                  style={{ background: "var(--av-amber)", color: "#0d1117" }}>
                  Explore Test Series <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : filteredTestSeries.map((series, idx) => {
              const seriesDetails = testSeriesWithPapers.find((s) => s._id === series._id) || series;
              const isExpanded = expandedSeries === series._id;
              return (
                <ScrollReveal key={series._id} delay={idx * 0.05} y={24}>
                  <div className="group relative rounded-xl border-2 transition-all duration-300 hover:shadow-xl"
                    style={{ background: "var(--av-card-bg)", borderColor: isExpanded ? "var(--av-cobalt)" : "var(--av-card-border)" }}>
                    <div className="absolute top-0 left-0 right-0 h-0.5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                      style={{ background: "var(--av-cobalt)" }} />
                    <div className="p-6">
                      <span className="text-[10px] font-bold uppercase tracking-[0.25em] mb-2 block" style={{ color: "var(--av-cobalt)" }}>
                        Test Series
                      </span>
                      <h3 className="font-display uppercase text-base leading-tight mb-1" style={{ color: "var(--av-ink)" }}>{series.title}</h3>
                      <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--av-ink-muted)" }}>{series.description}</p>

                      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "var(--av-border)" }}>
                        <span className="font-display-black text-lg" style={{ color: "var(--av-ink)" }}>
                          {formatPrice(series.price)}
                        </span>
                        <button onClick={() => handleExpandSeries(series._id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200 hover:scale-[1.03]"
                          style={{ background: "var(--av-cobalt)", color: "#ffffff" }}>
                          {isExpanded ? <><ChevronUp className="w-3.5 h-3.5" /> Collapse</> : <><ChevronDown className="w-3.5 h-3.5" /> View Papers</>}
                        </button>
                      </div>
                    </div>

                    {/* Accordion */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                          <div className="px-6 pb-6 space-y-3 border-t pt-4" style={{ borderColor: "var(--av-cobalt)" }}>
                            {loadingSeriesDetails ? (
                              <div className="flex justify-center py-4"><LoadingSpinner size="sm" /></div>
                            ) : seriesDetails?.papers?.length ? (
                              seriesDetails.papers.map((paper, pi) => {
                                const paperStatus = getAttemptStatus(paper._id);
                                const paperAttempt = getAttemptForPaper(paper._id);

                                return (
                                  <div key={paper._id} className="rounded-lg p-4 border transition-all"
                                    style={{ background: isDark ? "rgba(7,12,24,0.5)" : "rgba(244,241,235,0.6)", borderColor: "var(--av-border)" }}>
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                      <div>
                                        <span className="text-[10px] font-mono" style={{ color: "var(--av-ink-muted)" }}>{String(pi + 1).padStart(2, "0")} / {seriesDetails.papers!.length.toString().padStart(2, "0")}</span>
                                        <h4 className="font-display uppercase text-sm mt-0.5" style={{ color: "var(--av-ink)" }}>{paper.title}</h4>
                                        <p className="text-xs mt-0.5" style={{ color: "var(--av-ink-muted)" }}>{paper.subject}</p>
                                      </div>
                                      <AttemptStatusBadge status={paperStatus.status} />
                                    </div>

                                    {/* Conflict banner for series paper */}
                                    {startConflicts[paper._id] && (
                                      <div className="mb-3 p-2 rounded" style={{ background: "rgba(240,180,41,0.08)", border: "1px solid rgba(240,180,41,0.2)" }}>
                                        <p className="text-xs font-bold" style={{ color: "var(--av-amber)" }}>Active Attempt Detected</p>
                                        <div className="flex gap-2 mt-1.5">
                                          {startConflicts[paper._id].attemptId && (
                                            <button className="text-xs font-bold px-2 py-1 rounded" style={{ background: "var(--av-amber)", color: "#0d1117" }}
                                              onClick={() => router.push(`/subscriptions/attempts/attempt-paper?attemptId=${startConflicts[paper._id].attemptId}`)}>
                                              Resume
                                            </button>
                                          )}
                                          <button className="text-xs px-2 py-1 rounded" style={{ border: "1px solid var(--av-border)", color: "var(--av-ink-muted)" }}
                                            onClick={() => setStartConflicts(prev => { const c = { ...prev }; delete c[paper._id]; return c; })}>
                                            Dismiss
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                    <button
                                      onClick={() => {
                                        if (paperStatus.status === 'not-attempted') { return handleStartAttemptInline(paper._id); }
                                        start('nav'); setNavigatingId(paper._id);
                                        if (paperStatus.status === 'in-progress') router.push(`/subscriptions/attempts/attempt-paper?attemptId=${paperAttempt?._id}`);
                                        else router.push(`/subscriptions/attempts/attempt-reviews?attemptId=${paperAttempt?._id}`);
                                      }}
                                      disabled={navigatingId === paper._id}
                                      className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                                      style={{ background: "var(--av-amber)", color: "#0d1117" }}
                                    >
                                      {navigatingId === paper._id ? "Loading…"
                                        : paperStatus.status === "not-attempted" ? "Start"
                                        : paperStatus.status === "in-progress" ? "Resume"
                                        : "View Results"}
                                    </button>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-xs text-center py-3" style={{ color: "var(--av-ink-muted)" }}>No papers in this series yet.</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </ScrollReveal>
              );
            })
          )}
        </div>
      </div>

      {/* ── Pre-flight Rules Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {rulesDialog.isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(2,5,16,0.75)", backdropFilter: "blur(8px)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-xl overflow-hidden"
              style={{ background: "var(--av-card-bg)", border: "2px solid var(--av-amber)" }}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="px-6 py-4 border-b" style={{ background: "var(--av-amber)" }}>
                <p className="text-xs font-bold uppercase tracking-[0.25em] mb-1" style={{ color: "#0d1117", opacity: 0.6 }}>Pre-flight Checklist</p>
                <h2 className="font-display-black uppercase text-xl" style={{ color: "#0d1117", letterSpacing: "-0.02em" }}>
                  Rules & Guidelines
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3 mb-6">
                  {[
                    "You get +1 score for correct answers, 0 for wrong answers",
                    "You can run only one active attempt at a time",
                    "You cannot start another attempt without submitting the current one",
                    "Be fair — avoid cheating so every pilot gets an equal platform",
                  ].map((rule, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: "var(--av-amber)" }}>
                        <span className="text-[10px] font-bold" style={{ color: "#0d1117" }}>{i + 1}</span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--av-ink)" }}>{rule}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 mb-6 cursor-pointer" onClick={() => setRulesAccepted(!rulesAccepted)}>
                  <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: rulesAccepted ? "var(--av-amber)" : "transparent", border: `2px solid ${rulesAccepted ? "var(--av-amber)" : "var(--av-border)"}` }}>
                    {rulesAccepted && <span style={{ color: "#0d1117", fontSize: 11, fontWeight: 900 }}>✓</span>}
                  </div>
                  <span className="text-sm" style={{ color: "var(--av-ink)" }}>I have read and agree to follow these rules</span>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => { setRulesDialog({ isOpen: false, paperId: null }); setRulesAccepted(false); }}
                    className="flex-1 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest transition-all"
                    style={{ border: "1.5px solid var(--av-border)", color: "var(--av-ink-muted)" }}>
                    Cancel
                  </button>
                  <button onClick={handleRulesAcceptance} disabled={!rulesAccepted}
                    className="flex-1 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-40"
                    style={{ background: rulesAccepted ? "var(--av-amber)" : "var(--av-border)", color: rulesAccepted ? "#0d1117" : "var(--av-ink-muted)" }}>
                    Cleared for Takeoff
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
