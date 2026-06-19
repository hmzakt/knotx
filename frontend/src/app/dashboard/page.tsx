"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useSubscription } from "../../contexts/SubscriptionContext";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  AtSign,
  Shield,
  Crown,
  FileText,
  Layers,
  CheckCircle2,
  XCircle,
  Video,
  Film,
  LayoutDashboard,
  Compass,
  PlayCircle,
  Settings,
  LogOut,
  ChevronRight,
  ArrowRight,
  Zap,
  Target,
  Lock,
  Menu,
  X,
  CreditCard,
  BarChart3,
  Plane,
  RefreshCw,
} from "lucide-react";

// ─── Theme hook ──────────────────────────────────────────────────────
function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

// ─── Donut Chart Component ───────────────────────────────────────────
function DonutChart({
  percentage,
  size = 160,
  strokeWidth = 12,
  label,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="donut-track"
          style={{ color: "var(--av-ink-muted)" }}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--av-cobalt)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          className="donut-progress"
          style={
            {
              "--donut-circumference": circumference,
              "--donut-offset": offset,
            } as React.CSSProperties
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-display text-3xl sm:text-4xl"
          style={{ color: "var(--av-ink)" }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
        >
          {percentage}%
        </motion.span>
        <span
          className="text-[10px] uppercase tracking-[0.2em] font-bold mt-1"
          style={{ color: "var(--av-ink-muted)" }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── Stat Card Component ─────────────────────────────────────────────
function StatTile({
  label,
  value,
  suffix,
  delay = 0,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className="flex flex-col gap-1"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + delay, duration: 0.5 }}
    >
      <span
        className="text-[10px] uppercase tracking-[0.15em] font-bold"
        style={{ color: "var(--av-ink-muted)" }}
      >
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span
          className="font-display text-2xl sm:text-3xl t-minus"
          style={{ color: "var(--av-ink)" }}
        >
          {value}
        </span>
        {suffix && (
          <span
            className="text-xs font-medium"
            style={{ color: "var(--av-ink-muted)" }}
          >
            {suffix}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Flight Path Step Component ──────────────────────────────────────
function FlightPathStep({
  title,
  status,
  count,
  icon: Icon,
}: {
  title: string;
  status: "completed" | "active" | "locked";
  count: number;
  icon: React.ElementType;
}) {
  const statusColors = {
    completed: {
      bg: "var(--av-amber)",
      text: "#0d1117",
      border: "var(--av-amber)",
    },
    active: {
      bg: "rgba(74, 143, 239, 0.15)",
      text: "var(--av-cobalt)",
      border: "var(--av-cobalt)",
    },
    locked: {
      bg: "rgba(138, 155, 181, 0.08)",
      text: "var(--av-ink-muted)",
      border: "rgba(138, 155, 181, 0.2)",
    },
  };

  const colors = statusColors[status];

  return (
    <div className="flex flex-col items-center gap-2 min-w-[80px]">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300"
        style={{
          background: colors.bg,
          border: `2px solid ${colors.border}`,
        }}
      >
        {status === "completed" ? (
          <CheckCircle2 className="w-5 h-5" style={{ color: colors.text }} />
        ) : status === "locked" ? (
          <Lock className="w-4 h-4" style={{ color: colors.text }} />
        ) : (
          <Icon className="w-5 h-5" style={{ color: colors.text }} />
        )}
      </div>
      <span
        className="text-[10px] uppercase tracking-widest font-bold text-center leading-tight"
        style={{ color: status === "locked" ? "var(--av-ink-muted)" : "var(--av-ink)" }}
      >
        {title}
      </span>
      <span
        className="text-[9px] uppercase tracking-wider"
        style={{ color: "var(--av-ink-muted)" }}
      >
        {status === "completed"
          ? "Completed"
          : status === "active"
          ? `${count} Active`
          : "Locked"}
      </span>
    </div>
  );
}

// ─── Container animation variants ────────────────────────────────────
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

// ─── Main Dashboard ──────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const {
    subscriptions,
    loading: subscriptionLoading,
    error: subscriptionError,
    refetch,
  } = useSubscription();
  const isDark = useIsDark();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ─── Computed stats ────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!subscriptions?.subscriptions) {
      return {
        allAccess: 0,
        papers: 0,
        testSeries: 0,
        courses: 0,
        allCourses: 0,
        total: 0,
        active: 0,
        percentage: 0,
      };
    }
    const s = subscriptions.subscriptions;
    const allAccess = s.allAccess?.length || 0;
    const papers = s.singlePapers?.length || 0;
    const testSeries = s.testSeries?.length || 0;
    const courses = (s as any).singleCourses?.length || 0;
    const allCourses = (s as any).allCourses?.length || 0;
    const total = allAccess + papers + testSeries + courses + allCourses;
    const maxPossible = Math.max(total, 5); // Cap for percentage display
    const percentage = total > 0 ? Math.round((total / maxPossible) * 100) : 0;

    return { allAccess, papers, testSeries, courses, allCourses, total, active: total, percentage };
  }, [subscriptions]);

  // ─── T-Minus countdown helper ──────────────────────────────────────
  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return "EXPIRED";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 30) return `${Math.floor(days / 30)}M ${days % 30}D`;
    return `${days}D`;
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  // ─── Build active subs list for the panel ──────────────────────────
  const activeSubsList = useMemo(() => {
    if (!subscriptions?.subscriptions) return [];
    const list: {
      id: string;
      title: string;
      type: string;
      endDate: string;
      color: string;
    }[] = [];

    subscriptions.subscriptions.allAccess?.forEach((sub: any) => {
      list.push({
        id: sub._id,
        title: "ALL ACCESS",
        type: "all-access",
        endDate: sub.endDate,
        color: "var(--av-amber)",
      });
    });

    subscriptions.subscriptions.singlePapers?.forEach((sub: any) => {
      const paper = sub.itemId as any;
      list.push({
        id: sub._id,
        title: paper?.title || paper?.subject || "Paper",
        type: "paper",
        endDate: sub.endDate,
        color: "var(--av-cobalt)",
      });
    });

    subscriptions.subscriptions.testSeries?.forEach((sub: any) => {
      const ts = sub.itemId as any;
      list.push({
        id: sub._id,
        title: ts?.title || "Test Series",
        type: "test-series",
        endDate: sub.endDate,
        color: "#a855f7",
      });
    });

    (subscriptions.subscriptions as any).singleCourses?.forEach((sub: any) => {
      const course = sub.itemId as any;
      list.push({
        id: sub._id,
        title: course?.title || "Course",
        type: "course",
        endDate: sub.endDate,
        color: "#10b981",
      });
    });

    (subscriptions.subscriptions as any).allCourses?.forEach((sub: any) => {
      list.push({
        id: sub._id,
        title: "ALL COURSES",
        type: "all-courses",
        endDate: sub.endDate,
        color: "#f59e0b",
      });
    });

    return list.sort(
      (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
    );
  }, [subscriptions]);

  // ─── Flight path data ──────────────────────────────────────────────
  const flightPath = useMemo(() => {
    return [
      {
        title: "Papers",
        icon: FileText,
        count: stats.papers,
        status:
          stats.papers > 0
            ? ("completed" as const)
            : stats.total > 0
            ? ("active" as const)
            : ("locked" as const),
      },
      {
        title: "Test Series",
        icon: Layers,
        count: stats.testSeries,
        status:
          stats.testSeries > 0
            ? ("completed" as const)
            : stats.papers > 0
            ? ("active" as const)
            : ("locked" as const),
      },
      {
        title: "Courses",
        icon: PlayCircle,
        count: stats.courses + stats.allCourses,
        status:
          stats.courses + stats.allCourses > 0
            ? ("completed" as const)
            : stats.testSeries > 0
            ? ("active" as const)
            : ("locked" as const),
      },
      {
        title: "All Access",
        icon: Crown,
        count: stats.allAccess,
        status:
          stats.allAccess > 0
            ? ("completed" as const)
            : stats.courses > 0
            ? ("active" as const)
            : ("locked" as const),
      },
    ];
  }, [stats]);

  // ─── Sidebar items ─────────────────────────────────────────────────
  const sidebarItems = [
    { name: "Flight Deck", icon: LayoutDashboard, href: "/dashboard", active: true },
    { name: "Explore", icon: Compass, href: "/explore", active: false },
    { name: "Courses", icon: PlayCircle, href: "/courses", active: false },
    { name: "Subscriptions", icon: CreditCard, href: "/subscriptions", active: false },
    { name: "Settings", icon: Settings, href: "/settings", active: false },
  ];

  // ─── Loading state ─────────────────────────────────────────────────
  if (subscriptionLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--av-bg)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Plane className="w-8 h-8" style={{ color: "var(--av-amber)" }} />
          </motion.div>
          <span
            className="text-sm uppercase tracking-[0.2em] font-display"
            style={{ color: "var(--av-ink-muted)" }}
          >
            Initializing Flight Deck...
          </span>
        </div>
      </div>
    );
  }

  if (subscriptionError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--av-bg)" }}
      >
        <div className="text-center dashboard-card p-8 max-w-md">
          <XCircle className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--av-signal)" }} />
          <p className="font-display text-lg mb-2" style={{ color: "var(--av-ink)" }}>
            SYSTEM ERROR
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--av-ink-muted)" }}>
            {subscriptionError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wider"
            style={{ background: "var(--av-amber)", color: "#0d1117" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ─── Main layout ───────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen dashboard-grid-bg"
      style={{ background: "var(--av-bg)", color: "var(--av-ink)" }}
    >
      {/* Scanline effect */}
      <div className="dashboard-scanline" />

      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-6 left-6 z-50 lg:hidden w-12 h-12 rounded-xl flex items-center justify-center shadow-2xl"
        style={{
          background: "var(--av-amber)",
          color: "#0d1117",
        }}
        id="sidebar-toggle-btn"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || typeof window !== "undefined") && (
          <motion.aside
            className={`fixed top-[60px] left-0 h-[calc(100vh-60px)] w-[220px] z-40 dashboard-sidebar flex flex-col py-6 px-4 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            } transition-transform duration-300`}
            id="dashboard-sidebar"
          >
            {/* Pilot Profile */}
            <div className="mb-8 px-2">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: "rgba(240, 180, 41, 0.15)",
                    border: "1px solid rgba(240, 180, 41, 0.3)",
                  }}
                >
                  <Plane className="w-5 h-5" style={{ color: "var(--av-amber)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-bold truncate"
                    style={{ color: "var(--av-ink)" }}
                  >
                    {user?.fullname || "Cadet"}
                  </p>
                </div>
              </div>
            </div>

            {/* Nav items */}
            <nav className="flex-1 space-y-1">
              {sidebarItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`sidebar-nav-item ${item.active ? "active" : ""}`}
                  style={{
                    color: item.active ? "var(--av-amber)" : "var(--av-ink-muted)",
                  }}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Sidebar bottom */}
            <div className="mt-auto space-y-2 px-2">
              <Link
                href="/explore"
                className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-center justify-center"
                style={{ background: "var(--av-amber)", color: "#0d1117" }}
                onClick={() => setSidebarOpen(false)}
                id="sidebar-explore-btn"
              >
                <Zap className="w-4 h-4" />
                Start Pre-Flight
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-[220px] min-h-screen">
        <motion.div
          className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {/* ═══════════ HEADER ═══════════ */}
          <motion.div variants={fadeUp} className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1
                  className="font-display-black text-3xl sm:text-4xl md:text-5xl uppercase leading-none tracking-tight"
                  style={{ color: "var(--av-ink)" }}
                >
                  FLIGHT_DECK
                </h1>
                <p
                  className="text-sm sm:text-base mt-2"
                  style={{ color: "var(--av-ink-muted)" }}
                >
                  Cleared for departure. Check status of all systems below.
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {user?.role === "admin" && (
                  <Link href="/dashboard/adminRoles">
                    <span className="badge-cobalt flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                      <Shield className="w-3 h-3" />
                      ADMIN CONTROLS
                    </span>
                  </Link>
                )}
                <span className="badge-amber">AUTO-SYNC: ON</span>
                <button
                  onClick={() => refetch?.()}
                  className="p-2 rounded-lg transition-all hover:scale-105"
                  style={{ color: "var(--av-ink-muted)" }}
                  title="Refresh data"
                  id="refresh-data-btn"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* ═══════════ MAIN GRID — Overview + Upcoming ═══════════ */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 mb-6">
            {/* Left: Flight Training Overview */}
            <motion.div
              variants={fadeUp}
              className="dashboard-card dashboard-glow p-6 sm:p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="font-display text-sm uppercase tracking-[0.15em]"
                  style={{ color: "var(--av-ink)" }}
                >
                  Subscription Overview
                </h2>
                <span className="badge-amber">
                  {stats.total} ACTIVE
                </span>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Donut chart */}
                <DonutChart
                  percentage={subscriptions?.hasAnySubscription ? Math.min(stats.percentage + 20, 100) : 0}
                  label="Active"
                />

                {/* Stat tiles */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-5 flex-1">
                  <StatTile label="All Access" value={stats.allAccess} delay={0} />
                  <StatTile label="Papers" value={stats.papers} delay={0.1} />
                  <StatTile label="Test Series" value={stats.testSeries} delay={0.2} />
                  <StatTile label="Courses" value={stats.courses + stats.allCourses} delay={0.3} />
                </div>
              </div>

              {/* Status bar inside overview */}
              <div
                className="flex flex-wrap items-center gap-4 mt-6 pt-5"
                style={{ borderTop: `1px solid ${isDark ? "rgba(240, 180, 41, 0.08)" : "rgba(10, 42, 94, 0.06)"}` }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: subscriptions?.hasAnySubscription ? "#22c55e" : "#ef4444" }}
                  />
                  <span className="text-xs uppercase tracking-wider" style={{ color: "var(--av-ink-muted)" }}>
                    Subscription Status:{" "}
                    <span style={{ color: subscriptions?.hasAnySubscription ? "#22c55e" : "#ef4444" }}>
                      {subscriptions?.hasAnySubscription ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </span>
                </div>
                {subscriptions?.hasAllAccess && (
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" style={{ color: "var(--av-amber)" }} />
                    <span className="text-xs uppercase tracking-wider font-bold" style={{ color: "var(--av-amber)" }}>
                      PRO ACCESS
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Right: Upcoming / Active Subscriptions */}
            <motion.div
              variants={fadeUp}
              className="dashboard-card dashboard-glow p-6"
            >
              <h2
                className="font-display text-sm uppercase tracking-[0.15em] mb-5"
                style={{ color: "var(--av-ink)" }}
              >
                Active_Subscriptions
              </h2>

              {activeSubsList.length > 0 ? (
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {activeSubsList.map((sub, idx) => (
                    <motion.div
                      key={sub.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl transition-all hover:scale-[1.01]"
                      style={{
                        background: isDark
                          ? "rgba(255, 255, 255, 0.03)"
                          : "rgba(0, 0, 0, 0.02)",
                        borderLeft: `3px solid ${sub.color}`,
                      }}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.08 }}
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-xs font-bold uppercase tracking-wider truncate"
                          style={{ color: "var(--av-ink)" }}
                        >
                          {sub.title}
                        </p>
                        <p
                          className="text-[10px] uppercase tracking-wider mt-0.5"
                          style={{ color: "var(--av-ink-muted)" }}
                        >
                          Until {formatDate(sub.endDate)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span
                          className="t-minus text-xs font-bold"
                          style={{ color: sub.color }}
                        >
                          T-MINUS
                        </span>
                        <p
                          className="t-minus text-sm font-bold"
                          style={{ color: "var(--av-ink)" }}
                        >
                          {getTimeRemaining(sub.endDate)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Target
                    className="w-10 h-10 mb-3"
                    style={{ color: "var(--av-ink-muted)", opacity: 0.4 }}
                  />
                  <p className="text-xs uppercase tracking-wider" style={{ color: "var(--av-ink-muted)" }}>
                    No active subscriptions
                  </p>
                </div>
              )}

              <Link href="/subscriptions" className="block mt-4">
                <button
                  className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.02]"
                  style={{
                    border: `1px solid ${isDark ? "rgba(240, 180, 41, 0.2)" : "rgba(10, 42, 94, 0.15)"}`,
                    color: "var(--av-ink-muted)",
                    background: "transparent",
                  }}
                  id="view-all-subs-btn"
                >
                  View All Subscriptions
                </button>
              </Link>
            </motion.div>
          </div>

          {/* ═══════════ FLIGHT PATH ═══════════ */}
          <motion.div
            variants={fadeUp}
            className="dashboard-card dashboard-glow p-6 sm:p-8 mb-6"
          >
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h2
                className="font-display text-sm uppercase tracking-[0.15em] italic"
                style={{ color: "var(--av-ink)" }}
              >
                Current Flight Path
              </h2>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] uppercase tracking-wider px-3 py-1 rounded-full"
                  style={{
                    border: `1px solid ${isDark ? "rgba(240, 180, 41, 0.2)" : "rgba(10, 42, 94, 0.15)"}`,
                    color: "var(--av-ink-muted)",
                  }}
                >
                  Enroute
                </span>
                <span className="badge-amber">Active Module</span>
              </div>
            </div>

            <div className="flex items-center justify-between overflow-x-auto pb-2 gap-0">
              {flightPath.map((step, idx) => (
                <motion.div
                  key={step.title}
                  className="flex items-center"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + idx * 0.12 }}
                >
                  <FlightPathStep
                    title={step.title}
                    status={step.status}
                    count={step.count}
                    icon={step.icon}
                  />
                  {idx < flightPath.length - 1 && (
                    <div
                      className={`flight-path-line mx-2 sm:mx-4 ${
                        step.status === "completed"
                          ? "completed"
                          : step.status === "locked"
                          ? "locked"
                          : ""
                      }`}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ═══════════ QUICK ACTIONS ═══════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Start Mock Test / Explore */}
            <motion.div variants={fadeUp}>
              <Link href="/explore" className="block h-full">
                <div
                  className="dashboard-card dashboard-glow p-6 sm:p-8 h-full relative overflow-hidden group cursor-pointer"
                  id="explore-card"
                >
                  {/* Background accent */}
                  <div
                    className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
                    style={{ background: "var(--av-amber)" }}
                  />
                  <div className="relative">
                    <h3
                      className="font-display text-lg sm:text-xl uppercase mb-2"
                      style={{ color: "var(--av-ink)" }}
                    >
                      Start Exploring
                    </h3>
                    <p
                      className="text-sm mb-5 leading-relaxed"
                      style={{ color: "var(--av-ink-muted)" }}
                    >
                      Browse papers, test series, and courses. Find your next module.
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="badge-amber">Browse All</span>
                      </div>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                        style={{
                          background: "rgba(240, 180, 41, 0.12)",
                          border: "1px solid rgba(240, 180, 41, 0.2)",
                        }}
                      >
                        <Compass className="w-5 h-5" style={{ color: "var(--av-amber)" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Resume Learning / Courses */}
            <motion.div variants={fadeUp}>
              <Link href="/courses" className="block h-full">
                <div
                  className="dashboard-card dashboard-glow p-6 sm:p-8 h-full relative overflow-hidden group cursor-pointer"
                  id="courses-card"
                >
                  {/* Background accent */}
                  <div
                    className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
                    style={{ background: "var(--av-cobalt)" }}
                  />
                  <div className="relative">
                    <h3
                      className="font-display text-lg sm:text-xl uppercase mb-2"
                      style={{ color: "var(--av-ink)" }}
                    >
                      Resume Learning
                    </h3>
                    <p
                      className="text-sm mb-5 leading-relaxed"
                      style={{ color: "var(--av-ink-muted)" }}
                    >
                      Continue your video courses and pick up where you left off.
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="badge-cobalt">Video Courses</span>
                      </div>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                        style={{
                          background: "rgba(74, 143, 239, 0.12)",
                          border: `1px solid ${isDark ? "rgba(74, 143, 239, 0.25)" : "rgba(10, 42, 94, 0.15)"}`,
                        }}
                      >
                        <PlayCircle className="w-5 h-5" style={{ color: isDark ? "var(--av-cobalt-light)" : "var(--av-cobalt)" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>

          {/* ═══════════ ACCOUNT INFO ═══════════ */}
          <motion.div
            variants={fadeUp}
            className="dashboard-card dashboard-glow p-6 sm:p-8 mb-6"
          >
            <h2
              className="font-display text-sm uppercase tracking-[0.15em] mb-6"
              style={{ color: "var(--av-ink)" }}
            >
              Pilot_Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: User,
                  label: "Callsign",
                  value: user?.fullname || "—",
                },
                { icon: Mail, label: "Comms", value: user?.email || "—" },
                {
                  icon: AtSign,
                  label: "Handle",
                  value: user?.username ? `@${user.username}` : "—",
                },
                {
                  icon: Shield,
                  label: "Clearance",
                  value: user?.role || "—",
                  capitalize: true,
                },
              ].map((item, idx) => (
                <motion.div
                  key={item.label}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + idx * 0.08 }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: isDark
                        ? "rgba(240, 180, 41, 0.1)"
                        : "rgba(10, 42, 94, 0.06)",
                    }}
                  >
                    <item.icon
                      className="w-4 h-4"
                      style={{ color: "var(--av-amber)" }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-[10px] uppercase tracking-[0.15em] font-bold"
                      style={{ color: "var(--av-ink-muted)" }}
                    >
                      {item.label}
                    </p>
                    <p
                      className={`text-sm font-medium truncate ${
                        item.capitalize ? "capitalize" : ""
                      }`}
                      style={{ color: "var(--av-ink)" }}
                    >
                      {item.value}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {user?.role === "admin" && (
              <div
                className="mt-6 pt-5"
                style={{ borderTop: `1px solid ${isDark ? "rgba(240, 180, 41, 0.08)" : "rgba(10, 42, 94, 0.06)"}` }}
              >
                <Link href="/dashboard/adminRoles">
                  <button
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02]"
                    style={{ background: "var(--av-amber)", color: "#0d1117" }}
                    id="admin-controls-btn"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Admin Controls
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            )}
          </motion.div>

          {/* ═══════════ DETAILED SUBSCRIPTIONS ═══════════ */}
          {subscriptions?.hasAnySubscription && (
            <motion.div variants={fadeUp}>
              <div className="dashboard-card dashboard-glow p-6 sm:p-8">
                <h2
                  className="font-display text-sm uppercase tracking-[0.15em] mb-6"
                  style={{ color: "var(--av-ink)" }}
                >
                  Subscription_Log
                </h2>

                <div className="space-y-3">
                  {/* All Access */}
                  {subscriptions?.subscriptions?.allAccess?.map((sub: any) => (
                    <div
                      key={sub._id}
                      className="flex items-center justify-between gap-4 p-4 rounded-xl"
                      style={{
                        background: isDark ? "rgba(240, 180, 41, 0.06)" : "rgba(240, 180, 41, 0.05)",
                        borderLeft: "3px solid var(--av-amber)",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Crown className="w-4 h-4 flex-shrink-0" style={{ color: "var(--av-amber)" }} />
                        <div>
                          <p className="text-sm font-bold" style={{ color: "var(--av-amber)" }}>
                            All Access Plan
                          </p>
                          <p className="text-xs" style={{ color: "var(--av-ink-muted)" }}>
                            Valid until {formatDate(sub.endDate)}
                          </p>
                        </div>
                      </div>
                      <span className="badge-amber">Active</span>
                    </div>
                  ))}

                  {/* Single Papers */}
                  {subscriptions?.subscriptions?.singlePapers?.map((sub: any) => {
                    const paper = sub.itemId as any;
                    return (
                      <div
                        key={sub._id}
                        className="flex items-center justify-between gap-4 p-4 rounded-xl"
                        style={{
                          background: isDark ? "rgba(74, 143, 239, 0.05)" : "rgba(10, 42, 94, 0.03)",
                          borderLeft: "3px solid var(--av-cobalt)",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 flex-shrink-0" style={{ color: isDark ? "var(--av-cobalt-light)" : "var(--av-cobalt)" }} />
                          <div>
                            <p className="text-sm font-bold" style={{ color: "var(--av-ink)" }}>
                              {paper?.title || "Paper"}
                            </p>
                            <p className="text-xs" style={{ color: "var(--av-ink-muted)" }}>
                              {paper?.subject && `${paper.subject} · `}
                              Valid until {formatDate(sub.endDate)}
                            </p>
                          </div>
                        </div>
                        <span className="badge-cobalt">Active</span>
                      </div>
                    );
                  })}

                  {/* Test Series */}
                  {subscriptions?.subscriptions?.testSeries?.map((sub: any) => {
                    const ts = sub.itemId as any;
                    return (
                      <div
                        key={sub._id}
                        className="flex items-center justify-between gap-4 p-4 rounded-xl"
                        style={{
                          background: isDark ? "rgba(168, 85, 247, 0.05)" : "rgba(168, 85, 247, 0.03)",
                          borderLeft: "3px solid #a855f7",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Layers className="w-4 h-4 flex-shrink-0" style={{ color: "#a855f7" }} />
                          <div>
                            <p className="text-sm font-bold" style={{ color: "var(--av-ink)" }}>
                              {ts?.title || "Test Series"}
                            </p>
                            <p className="text-xs" style={{ color: "var(--av-ink-muted)" }}>
                              {ts?.papers?.length ? `${ts.papers.length} papers · ` : ""}
                              Valid until {formatDate(sub.endDate)}
                            </p>
                          </div>
                        </div>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded"
                          style={{
                            background: "rgba(168, 85, 247, 0.12)",
                            color: "#a855f7",
                            border: "1px solid rgba(168, 85, 247, 0.25)",
                          }}
                        >
                          Active
                        </span>
                      </div>
                    );
                  })}

                  {/* Single Courses */}
                  {(subscriptions as any)?.subscriptions?.singleCourses?.map((sub: any) => {
                    const course = sub.itemId as any;
                    return (
                      <div
                        key={sub._id}
                        className="flex items-center justify-between gap-4 p-4 rounded-xl"
                        style={{
                          background: isDark ? "rgba(16, 185, 129, 0.05)" : "rgba(16, 185, 129, 0.03)",
                          borderLeft: "3px solid #10b981",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Video className="w-4 h-4 flex-shrink-0" style={{ color: "#10b981" }} />
                          <div>
                            <p className="text-sm font-bold" style={{ color: "var(--av-ink)" }}>
                              {course?.title || "Course"}
                            </p>
                            <p className="text-xs" style={{ color: "var(--av-ink-muted)" }}>
                              Valid until {formatDate(sub.endDate)}
                            </p>
                          </div>
                        </div>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded"
                          style={{
                            background: "rgba(16, 185, 129, 0.12)",
                            color: "#10b981",
                            border: "1px solid rgba(16, 185, 129, 0.25)",
                          }}
                        >
                          Active
                        </span>
                      </div>
                    );
                  })}

                  {/* All Courses */}
                  {(subscriptions as any)?.subscriptions?.allCourses?.map((sub: any) => (
                    <div
                      key={sub._id}
                      className="flex items-center justify-between gap-4 p-4 rounded-xl"
                      style={{
                        background: isDark ? "rgba(245, 158, 11, 0.06)" : "rgba(245, 158, 11, 0.04)",
                        borderLeft: "3px solid #f59e0b",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Film className="w-4 h-4 flex-shrink-0" style={{ color: "#f59e0b" }} />
                        <div>
                          <p className="text-sm font-bold" style={{ color: "#f59e0b" }}>
                            All Courses Access
                          </p>
                          <p className="text-xs" style={{ color: "var(--av-ink-muted)" }}>
                            Valid until {formatDate(sub.endDate)}
                          </p>
                        </div>
                      </div>
                      <span className="badge-amber">Active</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* No subscription CTA */}
          {!subscriptions?.hasAnySubscription && (
            <motion.div variants={fadeUp}>
              <div className="dashboard-card p-10 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{
                    background: "rgba(240, 180, 41, 0.1)",
                    border: "1px solid rgba(240, 180, 41, 0.2)",
                  }}
                >
                  <Plane className="w-8 h-8" style={{ color: "var(--av-amber)" }} />
                </div>
                <h3
                  className="font-display text-xl uppercase mb-2"
                  style={{ color: "var(--av-ink)" }}
                >
                  No Active Subscriptions
                </h3>
                <p
                  className="text-sm mb-6 max-w-md mx-auto"
                  style={{ color: "var(--av-ink-muted)" }}
                >
                  You haven't subscribed to any papers or test series yet.
                  Start your DGCA prep today.
                </p>
                <Link href="/explore">
                  <button
                    className="px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-wider hover:scale-[1.03] transition-all btn-amber-glow"
                    style={{ background: "var(--av-amber)", color: "#0d1117" }}
                    id="browse-content-btn"
                  >
                    Browse Content
                  </button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Footer spacer */}
          <div className="h-8" />
        </motion.div>
      </main>
    </div>
  );
}
