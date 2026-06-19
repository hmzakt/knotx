"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import apiClient from "@/lib/api";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/home/scroll-motion";
import {
  Trophy, Target, TrendingUp, BarChart3, CheckCircle, XCircle,
  RotateCcw, ArrowLeft, Star, Zap, Brain, BookOpen, Clock, Calendar,
  Eye, EyeOff,
} from "lucide-react";

interface ReviewBreakdown {
  score: number; total: number; message?: string;
  difficulty?: Record<string, { correct: number; total: number }>;
  domain?: Record<string, { correct: number; total: number }>;
  paperTitle?: string; subject?: string; submittedAt?: string; duration?: number;
}

type AttemptListItem = {
  _id: string; paperId: string; score: number; status: "in-progress" | "submitted";
  startedAt?: string; submittedAt?: string; totalQuestions?: number; durationSec?: number;
};

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

const formatDateTime = (iso?: string) => {
  if (!iso) return "";
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
};

function getPerformanceMessage(score: number, total: number) {
  const pct = total > 0 ? (score / total) * 100 : 0;
  if (pct >= 90) return { message: "Outstanding! You've mastered this content!", icon: Star, accent: "var(--av-amber)" };
  if (pct >= 80) return { message: "Excellent work! You're doing great!", icon: Trophy, accent: "var(--av-cobalt)" };
  if (pct >= 70) return { message: "Good job! Keep up the practice!", icon: Target, accent: "var(--av-cobalt)" };
  if (pct >= 60) return { message: "Not bad! Review the topics and try again.", icon: TrendingUp, accent: "var(--av-amber)" };
  return { message: "Keep practicing! You'll improve with more attempts.", icon: Zap, accent: "var(--av-signal)" };
}

function AttemptReviewPageInner() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId") || undefined;
  const router = useRouter();
  const isDark = useIsDark();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReviewBreakdown | null>(null);
  const [currentPaperId, setCurrentPaperId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<AttemptListItem[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [latestAttemptId, setLatestAttemptId] = useState<string | null>(null);
  const [showPrevious, setShowPrevious] = useState(false);

  useEffect(() => { if (attemptId) fetchReview(attemptId); }, [attemptId]);

  const fetchReview = async (id: string) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/attempts/${id}`);
      const payload = res.data?.data || res.data;
      setData({ score: payload.score ?? 0, total: payload.total ?? payload.totalQuestions ?? 0, message: payload.message, difficulty: payload.difficultyBreakdown, domain: payload.domainBreakdown, paperTitle: payload.paperTitle || payload.paper?.title, subject: payload.subject || payload.paper?.subject, submittedAt: payload.submittedAt, duration: payload.duration ?? payload.durationSec });
      const pid = payload.paperId || payload.paper?._id || null;
      if (pid) { setCurrentPaperId(pid); fetchAttemptsForPaper(pid); }
    } catch (err) { console.error(err); alert("Could not load review"); }
    finally { setLoading(false); }
  };

  const fetchAttemptsForPaper = async (paperId: string) => {
    try {
      setAttemptsLoading(true);
      const res = await apiClient.get("/attempts");
      const items: AttemptListItem[] = res?.data?.data || res?.data || [];
      const filtered = items.filter((a) => String(a.paperId) === String(paperId) && a.status === "submitted").sort((a, b) => new Date(b.submittedAt || b.startedAt || 0).getTime() - new Date(a.submittedAt || a.startedAt || 0).getTime());
      setAttempts(filtered);
      setLatestAttemptId(filtered[0]?._id || null);
    } catch (err) { console.error(err); }
    finally { setAttemptsLoading(false); }
  };

  const handleReattempt = async () => {
    try {
      setLoading(true);
      const attemptRes = await apiClient.get(`/attempts/${attemptId}`);
      const payload = attemptRes?.data?.data || attemptRes?.data;
      const paperId = payload?.paperId || payload?.paper?._id;
      if (!paperId) { alert("Cannot determine paper"); return; }
      try {
        const startRes = await apiClient.post(`/attempts/start/${paperId}`, { meta: { previousAttemptId: attemptId } });
        const startPayload = startRes.data?.data || startRes.data;
        const newId = startPayload.attemptId || startPayload._id;
        if (!newId) throw new Error("Failed to obtain new attempt id");
        router.push(`/subscriptions/attempts/attempt-paper?attemptId=${newId}`);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 409) {
          const list = await apiClient.get("/attempts");
          const items = list?.data?.data || list?.data || [];
          const existing = items.find((a: any) => a.paperId === paperId && a.status === "in-progress");
          if (existing?._id) { router.push(`/subscriptions/attempts/attempt-paper?attemptId=${existing._id}`); return; }
        }
        alert(err?.response?.data?.message || err?.message || "Failed to start reattempt");
      }
    } catch (err: any) { console.error(err); alert("Could not start reattempt"); }
    finally { setLoading(false); }
  };

  const viewAttempt = async (id: string) => {
    router.push(`/subscriptions/attempts/attempt-reviews?attemptId=${id}`);
    await fetchReview(id);
    setShowPrevious(false);
  };

  const errState = (msg: string) => (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--av-bg)" }}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(230,57,70,0.08)" }}>
          <XCircle className="w-8 h-8" style={{ color: "var(--av-signal)" }} />
        </div>
        <h2 className="font-display-black uppercase text-2xl mb-2" style={{ color: "var(--av-ink)" }}>{msg}</h2>
        <button onClick={() => router.push("/subscriptions")} className="mt-4 px-6 py-2.5 rounded-lg font-bold uppercase tracking-widest text-sm" style={{ background: "var(--av-amber)", color: "#0d1117" }}>
          Back to Subscriptions
        </button>
      </div>
    </div>
  );

  if (!attemptId) return errState("No Attempt Specified");
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--av-bg)" }}>
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: "var(--av-ink-muted)" }}>Loading Results…</p>
      </div>
    </div>
  );
  if (!data) return errState("No Data Available");

  const percentage = data.total > 0 ? Math.round((data.score / data.total) * 100) : 0;
  const perf = getPerformanceMessage(data.score, data.total);
  const PerfIcon = perf.icon;
  const isLatest = latestAttemptId ? latestAttemptId === attemptId : true;
  const previousAttempts = attempts.filter((a) => a._id !== attemptId);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--av-bg)", color: "var(--av-ink)" }}>

      {/* Header */}
      <div className="border-b pt-[60px] pb-8" style={{ background: isDark ? "#070c18" : "#f4f1eb", borderColor: "var(--av-border)" }}>
        <div className={`absolute inset-x-0 top-0 h-full ${isDark ? "hero-grid-dark" : "hero-grid-light"} opacity-30 pointer-events-none`} />
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-4">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => router.push("/subscriptions")}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition hover:opacity-70"
              style={{ color: "var(--av-ink-muted)" }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Subscriptions
            </button>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--av-ink-muted)" }}>
              <Trophy className="w-4 h-4" style={{ color: "var(--av-amber)" }} /> Attempt Review
            </div>
          </div>
          <div className="text-center">
            <motion.h1 className="font-display-black uppercase leading-none mb-3"
              style={{ fontSize: "clamp(1.5rem, 4vw, 3rem)", letterSpacing: "-0.03em" }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              {data.paperTitle || "Attempt Review"}
            </motion.h1>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {data.subject && (
                <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded"
                  style={{ background: "rgba(240,180,41,0.1)", color: "var(--av-amber)", border: "1px solid rgba(240,180,41,0.2)" }}>
                  {data.subject}
                </span>
              )}
              {data.submittedAt && (
                <span className="text-xs flex items-center gap-1" style={{ color: "var(--av-ink-muted)" }}>
                  <Calendar className="w-3.5 h-3.5" /> {formatDateTime(data.submittedAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 space-y-8">

        {/* Context bar */}
        <ScrollReveal y={20}>
          <div className="rounded-xl p-5 border-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            style={{ background: "var(--av-card-bg)", borderColor: "var(--av-card-border)" }}>
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--av-ink-muted)" }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: isLatest ? "var(--av-cobalt)" : "var(--av-amber)" }} />
              {isLatest ? "Showing latest attempt" : "Viewing an older attempt"}
            </div>
            <div className="flex flex-wrap gap-2">
              {!isLatest && latestAttemptId && (
                <button onClick={() => viewAttempt(latestAttemptId)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.03]"
                  style={{ background: "var(--av-cobalt)", color: "#fff" }}>
                  <Eye className="w-3.5 h-3.5" /> Show Latest
                </button>
              )}
              <button
                onClick={() => setShowPrevious((p) => !p)}
                disabled={attemptsLoading || previousAttempts.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all hover:opacity-80 disabled:opacity-40"
                style={{ border: "1.5px solid var(--av-border)", color: "var(--av-ink-muted)", background: "transparent" }}>
                {attemptsLoading ? "Loading…"
                  : previousAttempts.length === 0 ? "No Previous"
                  : showPrevious ? <><EyeOff className="w-3.5 h-3.5" /> Hide Previous</> : <><Eye className="w-3.5 h-3.5" /> Previous ({previousAttempts.length})</>}
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Previous attempts */}
        {showPrevious && previousAttempts.length > 0 && (
          <ScrollReveal y={16}>
            <div className="rounded-xl p-6 border-2" style={{ background: "var(--av-card-bg)", borderColor: "var(--av-card-border)" }}>
              <h3 className="font-display uppercase text-base mb-4" style={{ color: "var(--av-ink)" }}>Previous Attempts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {previousAttempts.map((a) => {
                  const total = a.totalQuestions ?? data.total;
                  const pct = total > 0 ? Math.round((a.score / total) * 100) : 0;
                  return (
                    <button key={a._id} onClick={() => viewAttempt(a._id)}
                      className="text-left p-4 rounded-xl border-2 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                      style={{ background: isDark ? "rgba(7,12,24,0.5)" : "rgba(244,241,235,0.6)", borderColor: "var(--av-border)" }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs mb-1 flex items-center gap-1" style={{ color: "var(--av-ink-muted)" }}>
                            <Clock className="w-3 h-3" />{formatDateTime(a.submittedAt || a.startedAt)}
                          </div>
                          <div className="font-display-black text-xl" style={{ color: pct >= 60 ? "var(--av-cobalt)" : "var(--av-amber)" }}>
                            {a.score}/{total} <span className="text-sm">({pct}%)</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--av-amber)" }}>View →</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Score Overview */}
        <ScrollReveal y={24}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main score card */}
            <div className="lg:col-span-2 rounded-xl p-8 border-2 text-center"
              style={{ background: "var(--av-card-bg)", borderColor: percentage >= 80 ? "var(--av-cobalt)" : percentage >= 60 ? "var(--av-amber)" : "var(--av-signal)" }}>
              <div className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: percentage >= 80 ? "rgba(10,42,94,0.08)" : percentage >= 60 ? "rgba(240,180,41,0.08)" : "rgba(230,57,70,0.08)", border: `3px solid ${percentage >= 80 ? "var(--av-cobalt)" : percentage >= 60 ? "var(--av-amber)" : "var(--av-signal)"}` }}>
                <span className="font-display-black text-4xl" style={{ color: percentage >= 80 ? "var(--av-cobalt)" : percentage >= 60 ? "var(--av-amber)" : "var(--av-signal)" }}>
                  {percentage}%
                </span>
              </div>
              <h2 className="font-display-black uppercase text-2xl mb-1" style={{ color: "var(--av-ink)" }}>
                {data.score} / {data.total}
              </h2>
              <p className="text-sm mb-5" style={{ color: "var(--av-ink-muted)" }}>Questions answered correctly</p>
              {/* Progress bar */}
              <div className="h-2 rounded-full overflow-hidden mb-5" style={{ background: "var(--av-border)" }}>
                <motion.div className="h-full rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1, delay: 0.3 }}
                  style={{ background: percentage >= 80 ? "var(--av-cobalt)" : percentage >= 60 ? "var(--av-amber)" : "var(--av-signal)" }} />
              </div>
              <div className="flex items-center justify-center gap-2">
                <PerfIcon className="w-5 h-5" style={{ color: perf.accent }} />
                <p className="text-sm font-bold" style={{ color: perf.accent }}>{perf.message}</p>
              </div>
              {data.message && (
                <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: "var(--av-bg-alt)", border: "1px solid var(--av-border)", color: "var(--av-ink)" }}>
                  {data.message}
                </div>
              )}
            </div>

            {/* Stats column */}
            <div className="space-y-4">
              {[
                { label: "Accuracy", value: `${percentage}%`, icon: <Target className="w-4 h-4" />, accent: percentage >= 60 ? "var(--av-cobalt)" : "var(--av-amber)" },
                { label: "Correct Answers", value: data.score, icon: <CheckCircle className="w-4 h-4" />, accent: "var(--av-cobalt)", sub: `out of ${data.total} total` },
                { label: "Incorrect", value: data.total - data.score, icon: <XCircle className="w-4 h-4" />, accent: "var(--av-signal)", sub: "questions to review" },
              ].map((s, i) => (
                <div key={i} className="rounded-xl p-5 border-2" style={{ background: "var(--av-card-bg)", borderColor: "var(--av-card-border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--av-ink-muted)" }}>{s.label}</h3>
                    <span style={{ color: s.accent }}>{s.icon}</span>
                  </div>
                  <div className="font-display-black text-3xl mb-0.5" style={{ color: s.accent }}>{s.value}</div>
                  {s.sub && <p className="text-xs" style={{ color: "var(--av-ink-muted)" }}>{s.sub}</p>}
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Breakdowns */}
        {(data.difficulty || data.domain) && (
          <ScrollReveal y={20} delay={0.1}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data.difficulty && Object.keys(data.difficulty).length > 0 && (
                <div className="rounded-xl p-6 border-2" style={{ background: "var(--av-card-bg)", borderColor: "var(--av-card-border)" }}>
                  <div className="flex items-center gap-2 mb-5">
                    <Brain className="w-5 h-5" style={{ color: "var(--av-amber)" }} />
                    <h3 className="font-display uppercase text-base" style={{ color: "var(--av-ink)" }}>Difficulty Breakdown</h3>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(data.difficulty).map(([d, stats]) => {
                      const pct = Math.round((stats.correct / stats.total) * 100);
                      return (
                        <div key={d} className="p-4 rounded-lg" style={{ background: "var(--av-bg-alt)" }}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold capitalize" style={{ color: "var(--av-ink)" }}>{d}</span>
                            <span className="text-xs font-mono" style={{ color: "var(--av-ink-muted)" }}>{stats.correct}/{stats.total}</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--av-border)" }}>
                            <motion.div className="h-full rounded-full"
                              initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.2 }}
                              style={{ background: pct >= 60 ? "var(--av-cobalt)" : "var(--av-amber)" }} />
                          </div>
                          <p className="text-xs mt-1" style={{ color: "var(--av-ink-muted)" }}>{pct}% accuracy</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {data.domain && Object.keys(data.domain).length > 0 && (
                <div className="rounded-xl p-6 border-2" style={{ background: "var(--av-card-bg)", borderColor: "var(--av-card-border)" }}>
                  <div className="flex items-center gap-2 mb-5">
                    <BookOpen className="w-5 h-5" style={{ color: "var(--av-cobalt)" }} />
                    <h3 className="font-display uppercase text-base" style={{ color: "var(--av-ink)" }}>Domain Breakdown</h3>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(data.domain).map(([d, stats]) => {
                      const pct = Math.round((stats.correct / stats.total) * 100);
                      return (
                        <div key={d} className="p-4 rounded-lg" style={{ background: "var(--av-bg-alt)" }}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold capitalize" style={{ color: "var(--av-ink)" }}>{d}</span>
                            <span className="text-xs font-mono" style={{ color: "var(--av-ink-muted)" }}>{stats.correct}/{stats.total}</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--av-border)" }}>
                            <motion.div className="h-full rounded-full"
                              initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.2 }}
                              style={{ background: pct >= 60 ? "var(--av-cobalt)" : "var(--av-amber)" }} />
                          </div>
                          <p className="text-xs mt-1" style={{ color: "var(--av-ink-muted)" }}>{pct}% accuracy</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* Action buttons */}
        <ScrollReveal y={16} delay={0.15}>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => router.push("/subscriptions")}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all hover:opacity-80"
              style={{ border: "1.5px solid var(--av-border)", color: "var(--av-ink-muted)" }}>
              <ArrowLeft className="w-4 h-4" /> Subscriptions
            </button>
            <button onClick={() => router.push(`/subscriptions/attempts/detailed-review?attemptId=${attemptId}`)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all hover:scale-[1.02]"
              style={{ background: "var(--av-cobalt)", color: "#fff" }}>
              <Eye className="w-4 h-4" /> Detailed Review
            </button>
            <button onClick={handleReattempt} disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ background: "var(--av-amber)", color: "#0d1117" }}>
              <RotateCcw className="w-4 h-4" /> {loading ? "Starting…" : "Reattempt Paper"}
            </button>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

export default function AttemptReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--av-bg)" }}><LoadingSpinner size="lg" /></div>}>
      <AttemptReviewPageInner />
    </Suspense>
  );
}
