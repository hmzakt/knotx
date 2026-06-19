"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PaymentModal from "@/components/PaymentModal";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollReveal } from "@/components/home/scroll-motion";
import {
  Clock, Star, Users, Play, Lock, ChevronDown, ChevronRight,
  BookOpen, CheckCircle, Globe, BarChart2, ArrowLeft, CrownIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Lecture {
  _id: string; title: string; description?: string; duration: number;
  order: number; isPreviewFree: boolean; thumbnail?: { url?: string };
}
interface Section { _id: string; title: string; order: number; lectures: Lecture[]; }
interface CourseDetail {
  _id: string; title: string; slug: string; description: string; shortDescription?: string;
  thumbnail?: { url?: string }; price: number; isFree: boolean; level: string;
  language: string; totalDuration: number; totalEnrollments: number; ratingsAverage: number;
  ratingsQuantity: number; category?: string; tags: string[]; requirements: string[];
  learningOutcomes: string[]; instructor: { _id: string; fullname: string; avatar?: string };
  sections: Section[]; lectures: Lecture[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

const fmt = (s: number) => { if (!s) return "0m"; const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; };
const fmtPrice = (p: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p);

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { subscriptions } = useSubscription();
  const isDark = useIsDark();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; data: any }>({ isOpen: false, data: null });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient.get(`/courses/${id}`)
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setCourse(data);
        if (data?.sections?.length > 0) setExpandedSections(new Set([data.sections[0]._id]));
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load course"))
      .finally(() => setLoading(false));
  }, [id]);

  const hasCourseAccess = () => {
    if (!subscriptions || !course) return false;
    if ((subscriptions as any).hasAllCourses) return true;
    return (subscriptions.subscriptions?.singleCourses || []).some(
      (sub: any) => (sub.itemId?._id || sub.itemId) === course._id
    );
  };

  const getFirstLecture = (): Lecture | null => {
    if (!course) return null;
    if (course.sections?.length > 0 && course.sections[0].lectures?.length > 0) return course.sections[0].lectures[0];
    if (course.lectures?.length > 0) return course.lectures[0];
    return null;
  };

  const handleCTA = () => {
    if (!user) return router.push("/login");
    if (hasCourseAccess()) {
      const first = getFirstLecture();
      router.push(`/courses/${id}/watch${first ? `?lectureId=${first._id}` : ""}`);
    } else {
      setPaymentModal({ isOpen: true, data: { type: "single-course", itemId: course!._id, itemName: course!.title, itemDescription: course!.shortDescription || `${course!.level} course`, baseAmount: Math.max(Math.round((course!.price || 0) * 100), 100), currency: "INR", durationDays: 365 } });
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => { const next = new Set(prev); if (next.has(sectionId)) next.delete(sectionId); else next.add(sectionId); return next; });
  };

  const totalLectures = (course?.sections?.reduce((acc, s) => acc + (s.lectures?.length || 0), 0) || 0) + (course?.lectures?.length || 0);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--av-bg)" }}>
        <div className="flex flex-col items-center gap-4">
          <div style={{ color: "var(--av-amber)" }}><PlaneSVG size={48} /></div>
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: "var(--av-ink-muted)" }}>Loading Course…</p>
        </div>
      </div>
    );

  if (error || !course)
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--av-bg)", color: "var(--av-ink)" }}>
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: "var(--av-signal)" }}>{error || "Course not found"}</p>
          <button onClick={() => router.push("/courses")} className="px-6 py-2.5 rounded-lg font-bold uppercase tracking-widest text-sm"
            style={{ background: "var(--av-amber)", color: "#0d1117" }}>
            Browse Courses
          </button>
        </div>
      </div>
    );

  const hasAccess = hasCourseAccess();

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--av-bg)", color: "var(--av-ink)" }}>

      {/* ── Hero Header ───────────────────────────────────────────────────── */}
      <div className="relative pt-[60px] border-b" style={{ borderColor: "var(--av-border)", background: isDark ? "#070c18" : "#f4f1eb" }}>
        {/* Subtle grid */}
        <div className={`absolute inset-0 ${isDark ? "hero-grid-dark" : "hero-grid-light"} opacity-50`} />
        <div className="hero-grain" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

          {/* Left: meta */}
          <div className="lg:col-span-2 space-y-5">
            <button onClick={() => router.back()}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition hover:opacity-70"
              style={{ color: "var(--av-ink-muted)" }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>

            {course.category && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-[0.3em] px-2 py-0.5 rounded"
                style={{ background: "rgba(240,180,41,0.1)", color: "var(--av-amber)", border: "1px solid rgba(240,180,41,0.2)" }}>
                {course.category}
              </span>
            )}

            <h1 className="font-display-black uppercase leading-none"
              style={{ fontSize: "clamp(1.8rem, 5vw, 3.5rem)", letterSpacing: "-0.03em", color: "var(--av-ink)" }}>
              {course.title}
            </h1>

            {course.shortDescription && (
              <p className="text-base leading-relaxed" style={{ color: "var(--av-ink-muted)" }}>{course.shortDescription}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "var(--av-ink-muted)" }}>
              {course.ratingsAverage > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5" style={{ color: "var(--av-amber)" }} fill="currentColor" />
                  <span className="font-bold" style={{ color: "var(--av-amber)" }}>{course.ratingsAverage.toFixed(1)}</span>
                  {course.ratingsQuantity > 0 && <span>({course.ratingsQuantity})</span>}
                </span>
              )}
              {course.totalEnrollments > 0 && (
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{course.totalEnrollments.toLocaleString()} enrolled</span>
              )}
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{fmt(course.totalDuration)}</span>
              <span className="flex items-center gap-1 capitalize"><BarChart2 className="w-3.5 h-3.5" />{course.level}</span>
              <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{course.language}</span>
            </div>

            <p className="text-xs" style={{ color: "var(--av-ink-muted)" }}>
              Created by <span className="font-bold" style={{ color: "var(--av-amber)" }}>{course.instructor?.fullname}</span>
            </p>
          </div>

          {/* Right: purchase card */}
          <div className="rounded-xl overflow-hidden border-2 shadow-2xl"
            style={{ background: "var(--av-card-bg)", borderColor: hasAccess ? "var(--av-cobalt)" : "var(--av-amber)" }}>
            <div className="relative aspect-video" style={{ background: isDark ? "#0d1525" : "#eae6dc" }}>
              {course.thumbnail?.url ? (
                <>
                  <img src={course.thumbnail.url} alt={course.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(240,180,41,0.2)", border: "2px solid var(--av-amber)" }}>
                      <Play className="w-7 h-7" style={{ color: "var(--av-amber)" }} fill="currentColor" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="w-12 h-12" style={{ color: "var(--av-ink-muted)" }} />
                </div>
              )}
            </div>
            <div className="p-6 space-y-4">
              <div className="font-display-black text-3xl" style={{ color: "var(--av-ink)" }}>
                {course.isFree || course.price === 0 ? "Free" : fmtPrice(course.price)}
              </div>
              <button onClick={handleCTA}
                className="btn-amber-glow w-full py-3 rounded-lg font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: hasAccess ? "var(--av-cobalt)" : "var(--av-amber)", color: hasAccess ? "#fff" : "#0d1117" }}>
                {hasAccess
                  ? <><Play className="w-4 h-4" fill="white" /> Continue Watching</>
                  : course.isFree || course.price === 0 ? "Enroll Free" : <><CrownIcon className="w-4 h-4" /> Buy Now</>}
              </button>
              <ul className="text-xs space-y-2" style={{ color: "var(--av-ink-muted)" }}>
                <li className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" style={{ color: "var(--av-amber)" }} />{fmt(course.totalDuration)} total</li>
                <li className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" style={{ color: "var(--av-amber)" }} />{totalLectures} lectures</li>
                <li className="flex items-center gap-2"><Globe className="w-3.5 h-3.5" style={{ color: "var(--av-amber)" }} />{course.language}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">

          {/* Learning outcomes */}
          {course.learningOutcomes?.length > 0 && (
            <ScrollReveal>
              <div className="p-6 rounded-xl border-2" style={{ background: "var(--av-card-bg)", borderColor: "var(--av-amber)" }}>
                <h2 className="font-display uppercase text-lg mb-4" style={{ color: "var(--av-ink)" }}>What You'll Learn</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {course.learningOutcomes.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--av-ink-muted)" }}>
                      <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "var(--av-amber)" }}>
                        <span style={{ color: "#0d1117", fontSize: 9, fontWeight: 900 }}>✓</span>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          )}

          {/* Curriculum */}
          <ScrollReveal delay={0.05}>
            <h2 className="font-display uppercase text-lg mb-2" style={{ color: "var(--av-ink)" }}>Course Curriculum</h2>
            <p className="text-xs mb-4" style={{ color: "var(--av-ink-muted)" }}>{totalLectures} lectures · {fmt(course.totalDuration)} total</p>
            <div className="space-y-2">
              {course.sections?.map((section, si) => (
                <div key={section._id} className="rounded-xl overflow-hidden border-2" style={{ borderColor: expandedSections.has(section._id) ? "var(--av-cobalt)" : "var(--av-card-border)" }}>
                  <button onClick={() => toggleSection(section._id)}
                    className="w-full flex items-center justify-between px-5 py-4 transition-colors text-left"
                    style={{ background: expandedSections.has(section._id) ? isDark ? "rgba(10,42,94,0.2)" : "rgba(10,42,94,0.05)" : "var(--av-card-bg)" }}>
                    <div>
                      <span className="font-display uppercase text-sm" style={{ color: "var(--av-ink)" }}>{section.title}</span>
                      <span className="text-xs ml-3 font-mono" style={{ color: "var(--av-ink-muted)" }}>{section.lectures?.length || 0} lectures</span>
                    </div>
                    {expandedSections.has(section._id)
                      ? <ChevronDown className="w-4 h-4" style={{ color: "var(--av-cobalt)" }} />
                      : <ChevronRight className="w-4 h-4" style={{ color: "var(--av-ink-muted)" }} />}
                  </button>
                  <AnimatePresence initial={false}>
                    {expandedSections.has(section._id) && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                        <div className="divide-y" style={{ borderColor: "var(--av-border)" }}>
                          {section.lectures?.map((lecture, li) => (
                            <div key={lecture._id} className="flex items-center gap-3 px-5 py-3" style={{ background: "var(--av-card-bg)" }}>
                              <div className="w-14 h-9 rounded overflow-hidden flex-shrink-0" style={{ background: isDark ? "#0d1525" : "#eae6dc" }}>
                                {lecture.thumbnail?.url ? (
                                  <img src={lecture.thumbnail.url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Play className="w-3.5 h-3.5" style={{ color: "var(--av-ink-muted)" }} />
                                  </div>
                                )}
                              </div>
                              {lecture.isPreviewFree || hasAccess
                                ? <Play className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--av-amber)" }} />
                                : <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--av-ink-muted)" }} />}
                              <span className="text-sm flex-1" style={{ color: "var(--av-ink)" }}>{lecture.title}</span>
                              {lecture.isPreviewFree && !hasAccess && (
                                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                                  style={{ background: "rgba(240,180,41,0.1)", color: "var(--av-amber)" }}>Preview</span>
                              )}
                              <span className="text-xs font-mono tabular-nums" style={{ color: "var(--av-ink-muted)" }}>{fmt(lecture.duration)}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {/* Flat lectures */}
              {course.lectures?.length > 0 && (
                <div className="rounded-xl overflow-hidden border-2" style={{ borderColor: "var(--av-card-border)" }}>
                  <div className="divide-y" style={{ borderColor: "var(--av-border)" }}>
                    {course.lectures.map((lecture) => (
                      <div key={lecture._id} className="flex items-center gap-3 px-5 py-3" style={{ background: "var(--av-card-bg)" }}>
                        <div className="w-14 h-9 rounded overflow-hidden flex-shrink-0" style={{ background: isDark ? "#0d1525" : "#eae6dc" }}>
                          {lecture.thumbnail?.url ? <img src={lecture.thumbnail.url} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Play className="w-3.5 h-3.5" style={{ color: "var(--av-ink-muted)" }} /></div>}
                        </div>
                        {lecture.isPreviewFree || hasAccess
                          ? <Play className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--av-amber)" }} />
                          : <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--av-ink-muted)" }} />}
                        <span className="text-sm flex-1" style={{ color: "var(--av-ink)" }}>{lecture.title}</span>
                        {lecture.isPreviewFree && !hasAccess && (
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                            style={{ background: "rgba(240,180,41,0.1)", color: "var(--av-amber)" }}>Preview</span>
                        )}
                        <span className="text-xs font-mono tabular-nums" style={{ color: "var(--av-ink-muted)" }}>{fmt(lecture.duration)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Description */}
          {course.description && (
            <ScrollReveal delay={0.1}>
              <h2 className="font-display uppercase text-lg mb-3" style={{ color: "var(--av-ink)" }}>About This Course</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--av-ink-muted)" }}>{course.description}</p>
            </ScrollReveal>
          )}

          {/* Requirements */}
          {course.requirements?.length > 0 && (
            <ScrollReveal delay={0.12}>
              <h2 className="font-display uppercase text-lg mb-3" style={{ color: "var(--av-ink)" }}>Requirements</h2>
              <ul className="space-y-2">
                {course.requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--av-ink-muted)" }}>
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "var(--av-amber)" }} />
                    {r}
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          )}
        </div>
      </div>

      {paymentModal.isOpen && (
        <PaymentModal isOpen={paymentModal.isOpen} onClose={() => setPaymentModal({ isOpen: false, data: null })} paymentData={paymentModal.data} />
      )}
    </div>
  );
}
