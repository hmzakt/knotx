"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import apiClient from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle, XCircle, ChevronLeft, ChevronRight, BookOpen, Brain, Trophy, Calendar } from "lucide-react";

interface Option { index: number; optionText: string; }
interface Question {
  questionId: string; text: string; options: Option[]; correctIndex: number;
  selectedIndex: number | null; explanation?: string; difficulty?: string; domain?: string;
}
interface DetailedReviewData {
  attemptId: string; paperTitle: string; subject: string; score: number;
  totalQuestions: number; submittedAt: string; questions: Question[];
}

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

const formatDateTime = (iso?: string) => { if (!iso) return ""; try { return new Date(iso).toLocaleString(); } catch { return iso || ""; } };

const getQuestionStatus = (q: Question): "correct" | "incorrect" | "unanswered" => {
  if (q.selectedIndex === null || q.selectedIndex === undefined) return "unanswered";
  return q.selectedIndex === q.correctIndex ? "correct" : "incorrect";
};

function DetailedReviewPageInner() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId") || undefined;
  const router = useRouter();
  const isDark = useIsDark();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DetailedReviewData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => { if (attemptId) fetchDetailedReview(attemptId); }, [attemptId]);

  const fetchDetailedReview = async (id: string) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/attempts/${id}/detailed-review`);
      const payload = res.data?.data || res.data;
      const questions: Question[] = (payload.questionSnapshot || []).map((q: any) => ({
        questionId: q.questionId, text: q.text,
        options: q.options.map((opt: any, idx: number) => ({ index: idx, optionText: opt.optionText })),
        correctIndex: q.correctIndex, selectedIndex: q.selectedIndex,
        explanation: q.explanation, difficulty: q.difficulty, domain: q.domain,
      }));
      setData({ attemptId: id, paperTitle: payload.paperTitle || "Paper Review", subject: payload.subject || "", score: payload.score || 0, totalQuestions: payload.totalQuestions || questions.length, submittedAt: payload.submittedAt || "", questions });
    } catch (err) { console.error(err); alert("Could not load detailed review"); }
    finally { setLoading(false); }
  };

  if (!attemptId) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--av-bg)" }}>
      <div className="text-center">
        <XCircle className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--av-signal)" }} />
        <h2 className="font-display-black uppercase text-2xl mb-3" style={{ color: "var(--av-ink)" }}>No Attempt Specified</h2>
        <button onClick={() => router.push("/subscriptions")} className="px-6 py-2.5 rounded-lg font-bold uppercase tracking-widest text-sm" style={{ background: "var(--av-amber)", color: "#0d1117" }}>Back to Subscriptions</button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--av-bg)" }}>
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: "var(--av-ink-muted)" }}>Loading Detailed Review…</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--av-bg)" }}>
      <div className="text-center">
        <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--av-ink-muted)" }} />
        <h2 className="font-display-black uppercase text-2xl mb-3" style={{ color: "var(--av-ink)" }}>No Data Available</h2>
        <button onClick={() => router.push("/subscriptions")} className="px-6 py-2.5 rounded-lg font-bold uppercase tracking-widest text-sm" style={{ background: "var(--av-amber)", color: "#0d1117" }}>Back to Subscriptions</button>
      </div>
    </div>
  );

  const currentQ = data.questions[currentIndex];
  const status = getQuestionStatus(currentQ);
  const percentage = Math.round((data.score / data.totalQuestions) * 100);

  const statusColor = { correct: "var(--av-cobalt)", incorrect: "var(--av-signal)", unanswered: "var(--av-ink-muted)" };
  const statusBg = { correct: isDark ? "rgba(10,42,94,0.15)" : "rgba(10,42,94,0.06)", incorrect: "rgba(230,57,70,0.1)", unanswered: isDark ? "rgba(138,155,181,0.1)" : "rgba(74,78,90,0.06)" };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--av-bg)", color: "var(--av-ink)" }}>

      {/* Header */}
      <div className="border-b pt-[60px] pb-6" style={{ background: isDark ? "#070c18" : "#f4f1eb", borderColor: "var(--av-border)" }}>
        <div className={`absolute inset-x-0 top-0 h-full ${isDark ? "hero-grid-dark" : "hero-grid-light"} opacity-30 pointer-events-none`} />
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-4">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => router.push(`/subscriptions/attempts/attempt-reviews?attemptId=${attemptId}`)}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition hover:opacity-70"
              style={{ color: "var(--av-ink-muted)" }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Review
            </button>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--av-ink-muted)" }}>
              <BookOpen className="w-4 h-4" style={{ color: "var(--av-amber)" }} /> Detailed Review
            </div>
          </div>
          <div className="text-center">
            <h1 className="font-display-black uppercase leading-none mb-3" style={{ fontSize: "clamp(1.4rem, 3.5vw, 2.5rem)", letterSpacing: "-0.03em" }}>
              {data.paperTitle}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
              {data.subject && (
                <span className="px-2 py-0.5 rounded font-bold uppercase tracking-widest"
                  style={{ background: "rgba(240,180,41,0.1)", color: "var(--av-amber)" }}>{data.subject}</span>
              )}
              <span className="flex items-center gap-1" style={{ color: "var(--av-ink-muted)" }}>
                <Trophy className="w-3.5 h-3.5" /> {data.score}/{data.totalQuestions} ({percentage}%)
              </span>
              {data.submittedAt && (
                <span className="flex items-center gap-1" style={{ color: "var(--av-ink-muted)" }}>
                  <Calendar className="w-3.5 h-3.5" /> {formatDateTime(data.submittedAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Main question area */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div key={currentIndex}
                className="rounded-xl border-2 overflow-hidden"
                style={{ background: "var(--av-card-bg)", borderColor: status === "correct" ? "var(--av-cobalt)" : status === "incorrect" ? "var(--av-signal)" : "var(--av-card-border)" }}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>

                {/* Amber top strip */}
                <div className="h-1" style={{ background: status === "correct" ? "var(--av-cobalt)" : status === "incorrect" ? "var(--av-signal)" : "var(--av-border)" }} />

                <div className="p-6 sm:p-8">
                  {/* Question header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: "var(--av-amber)" }}>
                        Question {currentIndex + 1} of {data.questions.length}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                        style={{ background: statusBg[status], color: statusColor[status] }}>
                        {status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentQ.difficulty && (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                          style={{ background: "var(--av-bg-alt)", color: "var(--av-ink-muted)", border: "1px solid var(--av-border)" }}>
                          {currentQ.difficulty}
                        </span>
                      )}
                      {currentQ.domain && (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                          style={{ background: "var(--av-bg-alt)", color: "var(--av-ink-muted)", border: "1px solid var(--av-border)" }}>
                          {currentQ.domain}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question text */}
                  <p className="text-lg sm:text-xl leading-relaxed mb-8" style={{ color: "var(--av-ink)" }}>
                    {currentQ.text}
                  </p>

                  {/* Options */}
                  <div className="space-y-3 mb-8">
                    {currentQ.options.map((opt, optIdx) => {
                      const isSelected = currentQ.selectedIndex === optIdx;
                      const isCorrect = currentQ.correctIndex === optIdx;
                      const isSelectedCorrect = isSelected && isCorrect;
                      const isSelectedIncorrect = isSelected && !isCorrect;
                      const isCorrectNotSelected = !isSelected && isCorrect;
                      const optionLetter = String.fromCharCode(65 + optIdx);

                      let borderColor = "var(--av-border)";
                      let bgColor = "transparent";
                      let textColor = "var(--av-ink-muted)";
                      if (isSelectedCorrect) { borderColor = "var(--av-cobalt)"; bgColor = isDark ? "rgba(10,42,94,0.15)" : "rgba(10,42,94,0.06)"; textColor = "var(--av-ink)"; }
                      else if (isSelectedIncorrect) { borderColor = "var(--av-signal)"; bgColor = "rgba(230,57,70,0.08)"; textColor = "var(--av-ink)"; }
                      else if (isCorrectNotSelected) { borderColor = "var(--av-cobalt)"; bgColor = isDark ? "rgba(10,42,94,0.08)" : "rgba(10,42,94,0.04)"; }

                      return (
                        <div key={opt.index} className="p-4 rounded-xl border-2 transition-all"
                          style={{ borderColor, background: bgColor }}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm"
                              style={{
                                background: isSelectedCorrect ? "var(--av-cobalt)" : isSelectedIncorrect ? "var(--av-signal)" : isCorrectNotSelected ? "var(--av-cobalt)" : "var(--av-bg-alt)",
                                color: (isSelectedCorrect || isSelectedIncorrect || isCorrectNotSelected) ? "#fff" : "var(--av-ink-muted)",
                                border: `1.5px solid ${isSelectedCorrect || isCorrectNotSelected ? "var(--av-cobalt)" : isSelectedIncorrect ? "var(--av-signal)" : "var(--av-border)"}`,
                              }}>
                              {optionLetter}
                            </div>
                            <span className="text-sm flex-1" style={{ color: textColor }}>{opt.optionText}</span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {isSelected && (
                                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                                  style={{ background: isSelectedCorrect ? "rgba(10,42,94,0.1)" : "rgba(230,57,70,0.1)", color: isSelectedCorrect ? "var(--av-cobalt)" : "var(--av-signal)" }}>
                                  Your Answer
                                </span>
                              )}
                              {isCorrect && (
                                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                                  style={{ background: "rgba(10,42,94,0.1)", color: "var(--av-cobalt)" }}>
                                  Correct
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {currentQ.explanation && (
                    <div className="p-5 rounded-xl border-2 mb-6" style={{ background: "var(--av-bg-alt)", borderColor: "var(--av-amber)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4" style={{ color: "var(--av-amber)" }} />
                        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--av-amber)" }}>Explanation</h3>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--av-ink)" }}>{currentQ.explanation}</p>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "var(--av-border)" }}>
                    <button onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))} disabled={currentIndex === 0}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-30"
                      style={{ border: "1.5px solid var(--av-border)", color: "var(--av-ink-muted)" }}>
                      <ChevronLeft className="w-3.5 h-3.5" /> Previous
                    </button>
                    <span className="text-xs font-mono" style={{ color: "var(--av-ink-muted)" }}>
                      {currentIndex + 1} / {data.questions.length}
                    </span>
                    <button onClick={() => setCurrentIndex((p) => Math.min(data!.questions.length - 1, p + 1))} disabled={currentIndex === data.questions.length - 1}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-30"
                      style={{ border: "1.5px solid var(--av-border)", color: "var(--av-ink-muted)" }}>
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigator sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border-2 p-5 sticky top-20" style={{ background: "var(--av-card-bg)", borderColor: "var(--av-card-border)" }}>
              <h3 className="font-display uppercase text-sm mb-4" style={{ color: "var(--av-ink)" }}>Navigator</h3>
              <div className="flex flex-wrap gap-2 mb-5">
                {data.questions.map((q, idx) => {
                  const s = getQuestionStatus(q);
                  const isCurrent = idx === currentIndex;
                  return (
                    <button key={q.questionId} onClick={() => setCurrentIndex(idx)}
                      className="w-10 h-10 rounded-lg font-mono font-bold text-xs transition-all hover:scale-105"
                      style={{
                        background: isCurrent ? "var(--av-amber)" : s === "correct" ? isDark ? "rgba(10,42,94,0.3)" : "rgba(10,42,94,0.1)" : s === "incorrect" ? "rgba(230,57,70,0.12)" : "var(--av-bg-alt)",
                        color: isCurrent ? "#0d1117" : s === "correct" ? "var(--av-cobalt)" : s === "incorrect" ? "var(--av-signal)" : "var(--av-ink-muted)",
                        border: `2px solid ${isCurrent ? "var(--av-amber)" : s === "correct" ? "var(--av-cobalt)" : s === "incorrect" ? "var(--av-signal)" : "var(--av-border)"}`,
                        boxShadow: isCurrent ? "0 0 0 2px rgba(240,180,41,0.3)" : "none",
                      }}>
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="space-y-2 text-xs">
                {[
                  { color: "var(--av-cobalt)", label: "Correct", count: data.questions.filter((q) => getQuestionStatus(q) === "correct").length },
                  { color: "var(--av-signal)", label: "Incorrect", count: data.questions.filter((q) => getQuestionStatus(q) === "incorrect").length },
                  { color: "var(--av-border)", label: "Unanswered", count: data.questions.filter((q) => getQuestionStatus(q) === "unanswered").length },
                ].map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: l.color }} />
                    <span style={{ color: "var(--av-ink-muted)" }}>{l.label} ({l.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DetailedReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--av-bg)" }}><LoadingSpinner size="lg" /></div>}>
      <DetailedReviewPageInner />
    </Suspense>
  );
}
