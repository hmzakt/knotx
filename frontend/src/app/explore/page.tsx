"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SubscriptionStatus from "@/components/SubscriptionStatus";
import PaymentModal from "@/components/PaymentModal";
import { useContent } from "@/hooks/useContent";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAttempts } from "@/hooks/useAttempts";
import { useRouter } from "next/navigation";
import { useRouteLoading } from "@/contexts/RouteLoadingContext";
import apiClient from "@/lib/api";
import {
  Search, X, BookOpen, Layers, Lock, CrownIcon,
  Eye, EyeOff, ShoppingCart, GraduationCap, Play, Clock,
  ArrowRight, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, Radio,
} from "lucide-react";
import SortSelect from "@/components/SortSelect";
import CategorySelect from "@/components/CategorySelect";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses, Course } from "@/hooks/useCourses";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollReveal } from "@/components/home/scroll-motion";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Paper {
  _id: string;
  title: string;
  subject: string;
  price: number;
  createdAt: string;
}

interface TestSeries {
  _id: string;
  title: string;
  description?: string;
  price: number;
  createdAt: string;
  papers?: Paper[];
  papersCount?: number;
}

type TabType = "papers" | "test-series" | "courses";
type SortOption = "newest" | "oldest" | "priceLow" | "priceHigh";

const formatCourseDuration = (seconds: number) => {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// ─── Theme hook ──────────────────────────────────────────────────────────────

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

function RunwayLines() {
  return (
    <svg className="absolute bottom-0 left-0 w-full" style={{ opacity: 0.07 }} viewBox="0 0 1200 60" preserveAspectRatio="none">
      <line x1="0" y1="30" x2="1200" y2="30" stroke="currentColor" strokeWidth="1.5" strokeDasharray="60 20" />
      <line x1="0" y1="48" x2="1200" y2="48" stroke="currentColor" strokeWidth="1" strokeDasharray="40 30" />
      <line x1="0" y1="12" x2="1200" y2="12" stroke="currentColor" strokeWidth="1" strokeDasharray="40 30" />
    </svg>
  );
}

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

const tickerItems = ["PAPERS", "TEST SERIES", "VIDEO COURSES", "EXPERT-LED", "DGCA PREP", "CLEARED FOR TAKEOFF", "CPL · PPL · ATPL", "ALTITUDE IS EARNED"];

// ─── Status badge ────────────────────────────────────────────────────────────

function AttemptStatusBadge({ status }: { status: string }) {
  if (status === "in-progress") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest"
      style={{ background: "rgba(240,180,41,0.15)", color: "var(--av-amber)", border: "1px solid rgba(240,180,41,0.3)" }}>
      <Radio className="w-3 h-3" /> In Progress
    </span>
  );
  if (status === "completed") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest"
      style={{ background: "rgba(10,42,94,0.1)", color: "var(--av-cobalt)", border: "1px solid rgba(10,42,94,0.2)" }}>
      <CheckCircle2 className="w-3 h-3" /> Completed
    </span>
  );
  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ExplorePage() {
  const router = useRouter();
  const { start, stop } = useRouteLoading();
  const { user } = useAuth();
  const { subscriptions, loading: loadingSubscriptions } = useSubscription();
  const { papers, testSeries, loading: loadingContent, error: contentError } = useContent();
  const { courses, loading: loadingCourses, error: coursesError } = useCourses();
  const { getAttemptForPaper, getAttemptStatus } = useAttempts();
  const isDark = useIsDark();

  const [startConflicts, setStartConflicts] = useState<Record<string, { attemptId?: string; message?: string }>>({});
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("papers");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; data: any }>({ isOpen: false, data: null });
  const [rulesDialog, setRulesDialog] = useState<{ isOpen: boolean; paperId: string | null }>({ isOpen: false, paperId: null });
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);
  const [testSeriesWithPapers, setTestSeriesWithPapers] = useState<TestSeries[]>([]);
  const [loadingSeriesDetails, setLoadingSeriesDetails] = useState(false);

  const buildPaymentData = (args: { type: TabType | "all-access" | "single-course"; item?: Paper | TestSeries | Course }) => {
    if (args.type === "all-access") {
      return { type: 'all-access' as const, itemName: 'KnotX Pro — All Access', itemDescription: 'Unlimited access to all papers and test series', baseAmount: Number(process.env.NEXT_PUBLIC_ALL_ACCESS_PRICE_PAISE || 800000), currency: 'INR', durationDays: 365 };
    }
    if (args.type === "single-course") {
      const course = args.item as Course;
      return { type: "single-course" as const, itemId: course._id, itemName: course.title, itemDescription: course.shortDescription || `${course.level} • ${course.language}`, baseAmount: Math.max(Math.round((course.price ?? 0) * 100), 100), currency: "INR", durationDays: 365 };
    }
    const isPaper = args.type === "papers";
    const item = args.item!;
    const amountPaise = Math.max(Math.round(((item as any).price ?? 0) * 100), 100);
    return { type: (isPaper ? 'single-paper' : 'test-series') as 'single-paper' | 'test-series', itemId: item._id, itemName: item.title, itemDescription: isPaper ? (item as Paper).subject : (item as TestSeries).description || 'Test Series', baseAmount: amountPaise, currency: 'INR', durationDays: isPaper ? 30 : 180 };
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(price);

  const handleStartAttemptInline = async (paperId: string) => {
    start('nav');
    setNavigatingId(paperId);
    try {
      const res = await apiClient.post(`/attempts/start/${paperId}`);
      const data = res.data;
      const payload = data?.data ?? data;
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

  const categories = useMemo(() => {
    if (activeTab === "papers") return Array.from(new Set((papers || []).map((p) => p.subject)));
    if (activeTab === "courses") return Array.from(new Set((courses || []).map((c) => c.category).filter(Boolean) as string[]));
    return Array.from(new Set((testSeries || []).map((s) => s.description?.split(" ")[0] || "Other")));
  }, [activeTab, papers, testSeries, courses]);

  const filteredAndSortedPapers: Paper[] = useMemo(() => {
    let result = (papers || []).filter(p =>
      (p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.subject.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (categoryFilter === "all" || p.subject === categoryFilter)
    );
    if (sortBy === "newest") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sortBy === "oldest") result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (sortBy === "priceLow") result.sort((a, b) => a.price - b.price);
    else result.sort((a, b) => b.price - a.price);
    return result;
  }, [papers, searchQuery, categoryFilter, sortBy]);

  const filteredAndSortedSeries: TestSeries[] = useMemo(() => {
    let result = (testSeries || []).filter(s =>
      (s.title.toLowerCase().includes(searchQuery.toLowerCase()) || (s.description?.toLowerCase() || "").includes(searchQuery.toLowerCase())) &&
      (categoryFilter === "all" || (s.description?.includes(categoryFilter) || false))
    );
    if (sortBy === "newest") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sortBy === "oldest") result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (sortBy === "priceLow") result.sort((a, b) => a.price - b.price);
    else result.sort((a, b) => b.price - a.price);
    return result;
  }, [testSeries, searchQuery, categoryFilter, sortBy]);

  const filteredAndSortedCourses: Course[] = useMemo(() => {
    let result = (courses || []).filter(c =>
      (c.title.toLowerCase().includes(searchQuery.toLowerCase()) || (c.shortDescription || "").toLowerCase().includes(searchQuery.toLowerCase()) || (c.instructor?.fullname || "").toLowerCase().includes(searchQuery.toLowerCase())) &&
      (categoryFilter === "all" || c.category === categoryFilter)
    );
    if (sortBy === "newest") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sortBy === "oldest") result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (sortBy === "priceLow") result.sort((a, b) => a.price - b.price);
    else result.sort((a, b) => b.price - a.price);
    return result;
  }, [courses, searchQuery, categoryFilter, sortBy]);

  const userHasAccessToItem = useMemo(() => {
    const accessMap: Record<string, boolean> = {};
    if (subscriptions?.hasAllAccess) {
      (papers || []).forEach((p) => (accessMap[`paper-${p._id}`] = true));
      (testSeries || []).forEach((s) => (accessMap[`test-series-${s._id}`] = true));
    } else if (subscriptions) {
      subscriptions.subscriptions.singlePapers.forEach((sub: any) => { const id = sub.itemId?._id || sub.itemId; if (id) accessMap[`paper-${id}`] = true; });
      subscriptions.subscriptions.testSeries.forEach((sub: any) => { const id = sub.itemId?._id || sub.itemId; if (id) accessMap[`test-series-${id}`] = true; });
    }
    if ((subscriptions as any)?.hasAllCourses) {
      (courses || []).forEach((c) => (accessMap[`course-${c._id}`] = true));
    } else if (subscriptions) {
      (subscriptions.subscriptions.singleCourses || []).forEach((sub: any) => { const id = sub.itemId?._id || sub.itemId; if (id) accessMap[`course-${id}`] = true; });
    }
    return accessMap;
  }, [subscriptions, papers, testSeries, courses]);

  const fetchTestSeriesWithPapers = async (seriesId: string) => {
    try {
      setLoadingSeriesDetails(true);
      const response = await apiClient.get(`/private/test-series/${seriesId}`);
      return response.data.data;
    } catch (err) { return null; }
    finally { setLoadingSeriesDetails(false); }
  };

  const handleExpandSeries = async (seriesId: string) => {
    if (expandedSeries === seriesId) return setExpandedSeries(null);
    const existing = testSeriesWithPapers.find((s) => s._id === seriesId);
    if (existing) return setExpandedSeries(seriesId);
    const details = await fetchTestSeriesWithPapers(seriesId);
    if (details) { setTestSeriesWithPapers((prev) => [...prev, details]); setExpandedSeries(seriesId); }
  };

  const handleItemClick = (item: Paper | TestSeries, type: TabType, hasAccess: boolean) => {
    if (!hasAccess) { setPaymentModal({ isOpen: true, data: buildPaymentData({ type, item }) }); return; }
    if (type === "papers") {
      const status = getAttemptStatus((item as Paper)._id);
      const attempt = getAttemptForPaper((item as Paper)._id);
      start("nav"); setNavigatingId(item._id);
      if (status.status === "not-attempted") { setRulesDialog({ isOpen: true, paperId: item._id }); setRulesAccepted(false); }
      else if (status.status === "in-progress") router.push(`/subscriptions/attempts/attempt-paper?attemptId=${attempt?._id}`);
      else router.push(`/subscriptions/attempts/attempt-reviews?attemptId=${attempt?._id}`);
    } else { start("nav"); setNavigatingId(item._id); router.push(`/subscriptions`); }
  };

  const handleRulesAcceptance = () => {
    if (rulesAccepted && rulesDialog.paperId) {
      setRulesDialog({ isOpen: false, paperId: null });
      router.push(`/subscriptions/attempts/attempt-paper?paperId=${rulesDialog.paperId}`);
    }
  };

  const handleRulesDialogClose = () => {
    setRulesDialog({ isOpen: false, paperId: null });
    setRulesAccepted(false);
    setNavigatingId(null);
    stop();
  };

  // ── Auth/Loading gates ────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-16" style={{ background: "var(--av-bg)", color: "var(--av-ink)" }}>
        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative"
            style={{ background: "rgba(240,180,41,0.1)", border: "2px solid var(--av-amber)" }}>
            <Lock className="w-9 h-9" style={{ color: "var(--av-amber)" }} />
            <span className="absolute -top-2 -right-2 text-xs font-bold px-1.5 py-0.5 rounded"
              style={{ background: "var(--av-signal)", color: "#fff" }}>!</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] mb-3" style={{ color: "var(--av-amber)" }}>✦ Restricted Airspace</p>
          <h2 className="font-display-black text-3xl sm:text-4xl uppercase mb-3" style={{ letterSpacing: "-0.03em" }}>
            Clearance Required.
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--av-ink-muted)" }}>
            You need a pilot account to access premium DGCA content. Sign up or log in to continue.
          </p>
          <button
            className="btn-amber-glow w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-bold uppercase tracking-widest text-sm transition-all duration-200 hover:scale-[1.02]"
            style={{ background: "var(--av-amber)", color: "#0d1117" }}
            onClick={() => router.push("/register")}
          >
            Request Clearance <ArrowRight className="w-4 h-4" />
          </button>
          <button className="mt-3 w-full py-2 text-sm font-semibold uppercase tracking-widest rounded-lg transition hover:opacity-70"
            style={{ color: "var(--av-ink-muted)", border: "1.5px solid var(--av-border)" }}
            onClick={() => router.push("/login")}>
            Already have clearance? Log In
          </button>
        </motion.div>
      </div>
    );
  }

  if (loadingContent || loadingSubscriptions || loadingCourses)
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

  if (contentError || coursesError)
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--av-bg)", color: "var(--av-ink)" }}>
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--av-signal)" }} />
          <p>{contentError || coursesError}</p>
        </div>
      </div>
    );

  // ── Tab counts ────────────────────────────────────────────────────────────

  const tabs: { id: TabType; label: string; count: number; num: string; icon: React.ReactNode }[] = [
    { id: "papers", label: "Papers", count: filteredAndSortedPapers.length, num: "01", icon: <BookOpen className="w-4 h-4" /> },
    { id: "test-series", label: "Test Series", count: filteredAndSortedSeries.length, num: "02", icon: <Layers className="w-4 h-4" /> },
    { id: "courses", label: "Video Courses", count: filteredAndSortedCourses.length, num: "03", icon: <GraduationCap className="w-4 h-4" /> },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--av-bg)", color: "var(--av-ink)" }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-[60px]" style={{ minHeight: "42vh" }}>
        {/* Background */}
        <div className={`absolute inset-0 ${isDark ? "hero-bg-dark" : "hero-bg-light"}`} />
        <div className={`absolute inset-0 ${isDark ? "hero-grid-dark" : "hero-grid-light"}`} />
        <div className="hero-orb hero-orb-amber" />
        <div className="hero-orb hero-orb-cobalt" />
        <div className="hero-grain" />

        {/* Runway lines */}
        <div style={{ color: isDark ? "#f0b429" : "#0a2a5e" }}>
          <RunwayLines />
        </div>

        {/* Flying plane */}
        <div className="plane-animate pointer-events-none hidden md:block"
          style={{ top: "30%", color: "var(--av-amber)", zIndex: 10 }}>
          <PlaneSVG size={44} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-5 sm:px-8 py-16 sm:py-20">
          <motion.p
            className="text-xs font-bold uppercase tracking-[0.35em] mb-4"
            style={{ color: "var(--av-amber)" }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          >
            ✦ Flight Manifest
          </motion.p>
          <motion.h1
            className="font-display-black uppercase leading-none mb-4"
            style={{ fontSize: "clamp(2.2rem, 9vw, 6rem)", letterSpacing: "-0.04em", color: "var(--av-ink)" }}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            EXPLORE{" "}
            <span className="relative inline-block px-2">
              <span className="absolute inset-0 -skew-x-2" style={{ background: "var(--av-amber)", zIndex: -1 }} />
              <span style={{ color: "#0d1117" }}>CONTENT.</span>
            </span>
          </motion.h1>
          <motion.p
            className="text-sm sm:text-base max-w-lg leading-relaxed mb-8"
            style={{ color: "var(--av-ink-muted)" }}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.28 }}
          >
            Papers, test series, and expert-led video courses — all in one flight deck. Pick your mission.
          </motion.p>

          {/* Pro badge or CTA */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.38 }}>
            {subscriptions?.hasAllAccess ? (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm uppercase tracking-widest"
                style={{ background: "rgba(240,180,41,0.12)", border: "1.5px solid var(--av-amber)", color: "var(--av-amber)" }}>
                <CrownIcon className="w-4 h-4" /> Pro — Full Access Active
              </div>
            ) : (
              <button
                className="btn-amber-glow flex items-center gap-2 px-7 py-3 rounded-lg font-bold uppercase tracking-widest text-sm transition-all duration-200 hover:scale-[1.03]"
                style={{ background: "var(--av-amber)", color: "#0d1117" }}
                onClick={() => setPaymentModal({ isOpen: true, data: buildPaymentData({ type: 'all-access' }) })}
              >
                <CrownIcon className="w-4 h-4" /> Upgrade to Pro
              </button>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Amber Ticker ──────────────────────────────────────────────────── */}
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

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Search */}
        <ScrollReveal y={20}>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--av-ink-muted)" }} />
            <input
              type="text"
              placeholder="Search papers, test series, or courses…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-lg text-sm focus:outline-none transition-all"
              style={{
                background: "var(--av-card-bg)",
                border: "1.5px solid var(--av-border)",
                color: "var(--av-ink)",
                boxShadow: "none",
              }}
              onFocus={e => (e.target.style.borderColor = "var(--av-amber)")}
              onBlur={e => (e.target.style.borderColor = "var(--av-border)")}
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--av-ink-muted)" }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </ScrollReveal>

        {/* Tabs */}
        <ScrollReveal y={16} delay={0.05}>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setCategoryFilter("all"); }}
                className="relative flex items-center gap-2.5 px-5 py-2.5 transition-all duration-200 rounded-lg"
                style={{
                  background: activeTab === tab.id ? "var(--av-amber)" : "var(--av-card-bg)",
                  color: activeTab === tab.id ? "#0d1117" : "var(--av-ink-muted)",
                  border: activeTab === tab.id ? "2px solid var(--av-amber)" : "1.5px solid var(--av-border)",
                  fontWeight: 700,
                }}
              >
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

        {/* Filters */}
        <ScrollReveal y={12} delay={0.08}>
          <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 max-w-2xl mx-auto w-full">
            <CategorySelect value={categoryFilter} onChange={(v) => setCategoryFilter(v)} options={categories} />
            <SortSelect value={sortBy} onChange={(v) => setSortBy(v)} />
          </div>
        </ScrollReveal>

        {/* Divider */}
        <div className="h-px line-grow" style={{ background: "var(--av-border)" }} />

        {/* Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* ── Courses ─────────────────────────────────────────────────── */}
          {activeTab === "courses" && filteredAndSortedCourses.map((course, idx) => {
            const hasAccess = userHasAccessToItem[`course-${course._id}`] || (subscriptions as any)?.hasAllCourses;
            return (
              <ScrollReveal key={course._id} delay={idx * 0.05} y={28}>
                <div className="group relative rounded-xl overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col h-full"
                  style={{ background: "var(--av-card-bg)", borderColor: hasAccess ? "var(--av-cobalt)" : "var(--av-card-border)" }}>
                  {/* Amber hover strip */}
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
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(7,12,24,0.45)" }}>
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
                    <span className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
                      style={{ color: "var(--av-amber)" }}>{course.level}</span>
                    <h3 className="font-display uppercase text-base leading-tight mb-2 line-clamp-2"
                      style={{ color: "var(--av-ink)" }}>{course.title}</h3>
                    {course.shortDescription && (
                      <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: "var(--av-ink-muted)" }}>{course.shortDescription}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs mb-4 mt-auto" style={{ color: "var(--av-ink-muted)" }}>
                      {course.totalDuration > 0 && (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatCourseDuration(course.totalDuration)}</span>
                      )}
                      {course.instructor?.fullname && <span>by {course.instructor.fullname}</span>}
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: "var(--av-border)" }}>
                      <span className="font-display-black text-lg" style={{ color: hasAccess ? "var(--av-cobalt)" : "var(--av-ink)" }}>
                        {course.isFree || course.price === 0 ? "Free" : formatPrice(course.price)}
                      </span>
                      <button
                        disabled={navigatingId === course._id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200 hover:scale-[1.03]"
                        style={{ background: hasAccess ? "var(--av-cobalt)" : "var(--av-amber)", color: hasAccess ? "#ffffff" : "#0d1117" }}
                        onClick={() => {
                          if (hasAccess) { start("nav"); setNavigatingId(course._id); router.push(`/courses/${course._id}`); }
                          else setPaymentModal({ isOpen: true, data: buildPaymentData({ type: "single-course", item: course }) });
                        }}
                      >
                        {navigatingId === course._id ? "Loading…" : hasAccess
                          ? <><Eye className="w-3.5 h-3.5" /> View</>
                          : <><ShoppingCart className="w-3.5 h-3.5" /> Buy</>}
                      </button>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}

          {/* ── Papers & Test Series ─────────────────────────────────────── */}
          {activeTab !== "courses" &&
            (activeTab === "papers" ? filteredAndSortedPapers : filteredAndSortedSeries).map((item, idx) => {
              const itemType = activeTab === "papers" ? "paper" : "test-series";
              const hasAccess = userHasAccessToItem[`${itemType}-${item._id}`] || subscriptions?.hasAllAccess;
              const isPaper = "subject" in item;
              const attemptStatus = isPaper ? getAttemptStatus((item as Paper)._id) : null;
              const attempt = isPaper ? getAttemptForPaper((item as Paper)._id) : null;

              return (
                <ScrollReveal key={item._id} delay={idx * 0.05} y={28}>
                  <div className="group relative rounded-xl border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col h-full"
                    style={{ background: "var(--av-card-bg)", borderColor: hasAccess ? "var(--av-card-border)" : "var(--av-card-border)" }}>
                    {/* Top hover strip */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 z-10"
                      style={{ background: isPaper ? "var(--av-amber)" : "var(--av-cobalt)" }} />

                    <div className="p-6 flex flex-col flex-1">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.25em] mb-1.5 block"
                            style={{ color: isPaper ? "var(--av-amber)" : "var(--av-cobalt)" }}>
                            {isPaper ? (item as Paper).subject : "Test Series"}
                          </span>
                          <h3 className="font-display uppercase text-base leading-tight"
                            style={{ color: "var(--av-ink)" }}>{item.title}</h3>
                        </div>
                        {!hasAccess && (
                          <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                            style={{ background: "rgba(240,180,41,0.1)", border: "1px solid rgba(240,180,41,0.2)" }}>
                            <Lock className="w-3.5 h-3.5" style={{ color: "var(--av-amber)" }} />
                          </div>
                        )}
                      </div>

                      {!isPaper && (item as TestSeries).description && (
                        <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--av-ink-muted)" }}>
                          {(item as TestSeries).description}
                        </p>
                      )}

                      {/* Attempt status */}
                      {isPaper && hasAccess && attemptStatus && (
                        <div className="mb-3">
                          <AttemptStatusBadge status={attemptStatus.status} />
                        </div>
                      )}

                      <div className="my-2">
                        <SubscriptionStatus type={itemType} itemId={item._id} />
                      </div>

                      {/* Conflict banner */}
                      {startConflicts[item._id] && (
                        <div className="mb-3 p-3 rounded-lg" style={{ background: "rgba(240,180,41,0.08)", border: "1px solid rgba(240,180,41,0.25)" }}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--av-amber)" }}>
                                Active Attempt Detected
                              </div>
                              <div className="text-xs" style={{ color: "var(--av-ink-muted)" }}>
                                {startConflicts[item._id].message || 'You cannot start a new attempt right now.'}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            {startConflicts[item._id].attemptId && (
                              <button className="text-xs font-bold px-3 py-1.5 rounded transition-all"
                                style={{ background: "var(--av-amber)", color: "#0d1117" }}
                                onClick={() => router.push(`/subscriptions/attempts/attempt-paper?attemptId=${startConflicts[item._id].attemptId}`)}>
                                Resume
                              </button>
                            )}
                            <button className="text-xs font-semibold px-3 py-1.5 rounded transition-all"
                              style={{ border: "1.5px solid var(--av-border)", color: "var(--av-ink-muted)" }}
                              onClick={() => setStartConflicts(prev => { const c = { ...prev }; delete c[item._id]; return c; })}>
                              Dismiss
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="mt-auto pt-4 border-t flex justify-between items-center" style={{ borderColor: "var(--av-border)" }}>
                        <span className="font-display-black text-lg" style={{ color: "var(--av-ink)" }}>
                          {formatPrice(item.price)}
                        </span>
                        <button
                          disabled={navigatingId === item._id}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200 hover:scale-[1.03] disabled:opacity-50"
                          style={{
                            background: hasAccess ? (isPaper ? "var(--av-amber)" : "var(--av-cobalt)") : "var(--av-ink)",
                            color: hasAccess ? (isPaper ? "#0d1117" : "#ffffff") : "var(--av-bg)",
                          }}
                          onClick={() => {
                            if (isPaper) {
                              if (!hasAccess) return handleItemClick(item, activeTab, hasAccess);
                              const status = getAttemptStatus((item as Paper)._id);
                              if (status.status === 'not-attempted') return handleStartAttemptInline((item as Paper)._id);
                              return handleItemClick(item, activeTab, hasAccess);
                            }
                            if (hasAccess) return handleExpandSeries(item._id);
                            return handleItemClick(item, activeTab, hasAccess);
                          }}
                        >
                          {navigatingId === item._id ? "Loading…"
                            : isPaper
                              ? hasAccess
                                ? <><Eye className="w-3.5 h-3.5" />{attemptStatus?.status === "not-attempted" ? "Start" : attemptStatus?.status === "in-progress" ? "Resume" : "Results"}</>
                                : <><ShoppingCart className="w-3.5 h-3.5" /> Buy</>
                              : hasAccess
                                ? expandedSeries === item._id
                                  ? <><EyeOff className="w-3.5 h-3.5" /> Collapse</>
                                  : <><Eye className="w-3.5 h-3.5" /> View Papers</>
                                : <><ShoppingCart className="w-3.5 h-3.5" /> Buy</>}
                        </button>
                      </div>
                    </div>

                    {/* Series Accordion */}
                    <AnimatePresence initial={false}>
                      {!isPaper && hasAccess && expandedSeries === item._id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }} className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 space-y-3 border-t pt-4" style={{ borderColor: "var(--av-border)" }}>
                            {loadingSeriesDetails ? (
                              <div className="flex justify-center py-4"><LoadingSpinner size="sm" /></div>
                            ) : (() => {
                              const seriesDetails = testSeriesWithPapers.find((s) => s._id === item._id);
                              return seriesDetails?.papers?.length ? (
                                seriesDetails.papers.map((paper, pi) => {
                                  const paperStatus = getAttemptStatus(paper._id);
                                  const paperAttempt = getAttemptForPaper(paper._id);
                                  return (
                                    <div key={paper._id} className="rounded-lg p-4 border transition-all"
                                      style={{ background: isDark ? "rgba(7,12,24,0.5)" : "rgba(244,241,235,0.6)", borderColor: "var(--av-border)" }}>
                                      <div className="flex items-start justify-between gap-2 mb-2">
                                        <div>
                                          <span className="text-[10px] font-mono" style={{ color: "var(--av-ink-muted)" }}>{String(pi + 1).padStart(2, "0")} / {seriesDetails.papers!.length.toString().padStart(2, "0")}</span>
                                          <h4 className="font-display uppercase text-sm mt-0.5" style={{ color: "var(--av-ink)" }}>{paper.title}</h4>
                                          <p className="text-xs mt-0.5" style={{ color: "var(--av-ink-muted)" }}>{paper.subject}</p>
                                        </div>
                                        <AttemptStatusBadge status={paperStatus.status} />
                                      </div>
                                      <button
                                        onClick={() => {
                                          start("nav"); setNavigatingId(paper._id);
                                          if (paperStatus.status === "not-attempted") router.push(`/subscriptions/attempts/attempt-paper?paperId=${paper._id}`);
                                          else if (paperStatus.status === "in-progress") router.push(`/subscriptions/attempts/attempt-paper?attemptId=${paperAttempt?._id}`);
                                          else router.push(`/subscriptions/attempts/attempt-reviews?attemptId=${paperAttempt?._id}`);
                                        }}
                                        disabled={navigatingId === paper._id}
                                        className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
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
                              );
                            })()}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </ScrollReveal>
              );
            })}

          {/* Empty state */}
          {((activeTab === "papers" && filteredAndSortedPapers.length === 0) ||
            (activeTab === "test-series" && filteredAndSortedSeries.length === 0) ||
            (activeTab === "courses" && filteredAndSortedCourses.length === 0)) && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(240,180,41,0.08)", border: "1.5px solid var(--av-border)" }}>
                <Search className="w-7 h-7" style={{ color: "var(--av-ink-muted)" }} />
              </div>
              <p className="font-display uppercase text-lg mb-2" style={{ color: "var(--av-ink)" }}>No Results Found</p>
              <p className="text-sm" style={{ color: "var(--av-ink-muted)" }}>Adjust your search or filters to find content.</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModal.isOpen && (
        <PaymentModal isOpen={paymentModal.isOpen} onClose={() => setPaymentModal({ isOpen: false, data: null })} paymentData={paymentModal.data} />
      )}

      {/* ── Pre-flight Checklist / Rules Modal ────────────────────────── */}
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
              {/* Header */}
              <div className="px-6 py-4 border-b" style={{ background: "var(--av-amber)", borderColor: "var(--av-amber)" }}>
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

                <label className="flex items-center gap-3 mb-6 cursor-pointer group">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: rulesAccepted ? "var(--av-amber)" : "transparent",
                      border: `2px solid ${rulesAccepted ? "var(--av-amber)" : "var(--av-border)"}`,
                    }}
                    onClick={() => setRulesAccepted(!rulesAccepted)}
                  >
                    {rulesAccepted && <span style={{ color: "#0d1117", fontSize: 11, fontWeight: 900 }}>✓</span>}
                  </div>
                  <span className="text-sm" style={{ color: "var(--av-ink)" }}>
                    I have read and agree to follow these rules
                  </span>
                </label>

                <div className="flex gap-3">
                  <button onClick={handleRulesDialogClose}
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
