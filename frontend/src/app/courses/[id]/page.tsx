"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PaymentModal from "@/components/PaymentModal";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/lib/api";
import {
  Clock, Star, Users, Play, Lock, ChevronDown, ChevronRight,
  BookOpen, CheckCircle, Globe, BarChart2,
} from "lucide-react";

interface Lecture {
  _id: string;
  title: string;
  description?: string;
  duration: number;
  order: number;
  isPreviewFree: boolean;
  thumbnail?: { url?: string };
}

interface Section {
  _id: string;
  title: string;
  order: number;
  lectures: Lecture[];
}

interface CourseDetail {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  thumbnail?: { url?: string };
  price: number;
  isFree: boolean;
  level: string;
  language: string;
  totalDuration: number;
  totalEnrollments: number;
  ratingsAverage: number;
  ratingsQuantity: number;
  category?: string;
  tags: string[];
  requirements: string[];
  learningOutcomes: string[];
  instructor: { _id: string; fullname: string; avatar?: string };
  sections: Section[];
  lectures: Lecture[]; // flat (unsectioned)
}

const formatDuration = (s: number) => {
  if (!s) return "0m";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { subscriptions } = useSubscription();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; data: any }>({
    isOpen: false,
    data: null,
  });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient.get(`/courses/${id}`)
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setCourse(data);
        // Expand first section by default
        if (data?.sections?.length > 0) {
          setExpandedSections(new Set([data.sections[0]._id]));
        }
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
    if (course.sections?.length > 0 && course.sections[0].lectures?.length > 0) {
      return course.sections[0].lectures[0];
    }
    if (course.lectures?.length > 0) return course.lectures[0];
    return null;
  };

  const handleCTA = () => {
    if (!user) return router.push("/login");
    if (hasCourseAccess()) {
      const first = getFirstLecture();
      router.push(`/courses/${id}/watch${first ? `?lectureId=${first._id}` : ""}`);
    } else {
      setPaymentModal({
        isOpen: true,
        data: {
          type: "single-course",
          itemId: course!._id,
          itemName: course!.title,
          itemDescription: course!.shortDescription || `${course!.level} course`,
          baseAmount: Math.max(Math.round((course!.price || 0) * 100), 100),
          currency: "INR",
          durationDays: 365,
        },
      });
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const totalLectures =
    (course?.sections?.reduce((acc, s) => acc + (s.lectures?.length || 0), 0) || 0) +
    (course?.lectures?.length || 0);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <LoadingSpinner size="lg" />
      </div>
    );

  if (error || !course)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{error || "Course not found"}</p>
          <Button onClick={() => router.push("/courses")} className="bg-emerald-600 hover:bg-emerald-700">
            Browse Courses
          </Button>
        </div>
      </div>
    );

  const hasAccess = hasCourseAccess();

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-gray-100">
      {/* Hero */}
      <div className="bg-gradient-to-r from-gray-900 via-emerald-950 to-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left: meta */}
          <div className="lg:col-span-2 space-y-4">
            {course.category && (
              <span className="text-emerald-400 text-sm font-medium uppercase tracking-wide">{course.category}</span>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-white">{course.title}</h1>
            {course.shortDescription && (
              <p className="text-gray-300 text-lg">{course.shortDescription}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              {course.ratingsAverage > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400" fill="currentColor" />
                  <span className="text-amber-400 font-medium">{course.ratingsAverage.toFixed(1)}</span>
                  {course.ratingsQuantity > 0 && <span>({course.ratingsQuantity})</span>}
                </span>
              )}
              {course.totalEnrollments > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {course.totalEnrollments.toLocaleString()} enrolled
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(course.totalDuration)}
              </span>
              <span className="flex items-center gap-1 capitalize">
                <BarChart2 className="w-4 h-4" />
                {course.level}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                {course.language}
              </span>
            </div>

            <p className="text-gray-400 text-sm">
              Created by <span className="text-emerald-400 font-medium">{course.instructor?.fullname}</span>
            </p>
          </div>

          {/* Right: sticky purchase card */}
          <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
            <div className="relative aspect-video bg-gray-800">
              {course.thumbnail?.url ? (
                <>
                  <img src={course.thumbnail.url} alt={course.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Play className="w-12 h-12 text-white" fill="white" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="w-12 h-12 text-gray-600" />
                </div>
              )}
            </div>
            <div className="p-6 space-y-4">
              <div className="text-3xl font-bold text-white">
                {course.isFree || course.price === 0 ? "Free" : formatPrice(course.price)}
              </div>
              <Button
                onClick={handleCTA}
                className={`w-full py-3 text-base font-semibold ${
                  hasAccess
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {hasAccess ? (
                  <span className="flex items-center justify-center gap-2">
                    <Play className="w-5 h-5" fill="white" /> Continue Watching
                  </span>
                ) : course.isFree || course.price === 0 ? (
                  "Enroll Free"
                ) : (
                  "Buy Now"
                )}
              </Button>
              <ul className="text-sm text-gray-400 space-y-2">
                <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-emerald-500" /> {formatDuration(course.totalDuration)} total</li>
                <li className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-emerald-500" /> {totalLectures} lectures</li>
                <li className="flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-500" /> {course.language}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Learning outcomes */}
          {course.learningOutcomes?.length > 0 && (
            <div className="bg-card rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">What you'll learn</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {course.learningOutcomes.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Curriculum */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Course Curriculum</h2>
            <p className="text-gray-400 text-sm mb-4">{totalLectures} lectures • {formatDuration(course.totalDuration)} total</p>

            <div className="space-y-2">
              {/* Sectioned */}
              {course.sections?.map((section) => (
                <div key={section._id} className="border border-gray-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection(section._id)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-gray-900 hover:bg-gray-800 transition-colors text-left"
                  >
                    <div>
                      <span className="font-semibold text-white">{section.title}</span>
                      <span className="text-gray-400 text-sm ml-3">{section.lectures?.length || 0} lectures</span>
                    </div>
                    {expandedSections.has(section._id)
                      ? <ChevronDown className="w-4 h-4 text-gray-400" />
                      : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </button>

                  {expandedSections.has(section._id) && (
                    <div className="divide-y divide-gray-800">
                      {section.lectures?.map((lecture) => (
                        <div
                          key={lecture._id}
                          className="flex items-center gap-3 px-5 py-3 hover:bg-gray-900/50 transition-colors"
                        >
                          <div className="w-16 h-10 rounded overflow-hidden bg-gray-800 flex-shrink-0">
                            {lecture.thumbnail?.url ? (
                              <img src={lecture.thumbnail.url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="w-4 h-4 text-gray-600" />
                              </div>
                            )}
                          </div>
                          {lecture.isPreviewFree || hasAccess
                            ? <Play className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            : <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                          <span className="text-sm text-gray-300 flex-1">{lecture.title}</span>
                          {lecture.isPreviewFree && !hasAccess && (
                            <span className="text-xs text-emerald-500 font-medium">Preview</span>
                          )}
                          <span className="text-xs text-gray-500 tabular-nums">
                            {formatDuration(lecture.duration)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Flat lectures (unsectioned) */}
              {course.lectures?.length > 0 && (
                <div className="border border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-800">
                  {course.lectures.map((lecture) => (
                    <div
                      key={lecture._id}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-900/50 transition-colors"
                    >
                      <div className="w-16 h-10 rounded overflow-hidden bg-gray-800 flex-shrink-0">
                        {lecture.thumbnail?.url ? (
                          <img src={lecture.thumbnail.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-4 h-4 text-gray-600" />
                          </div>
                        )}
                      </div>
                      {lecture.isPreviewFree || hasAccess
                        ? <Play className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        : <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                      <span className="text-sm text-gray-300 flex-1">{lecture.title}</span>
                      {lecture.isPreviewFree && !hasAccess && (
                        <span className="text-xs text-emerald-500 font-medium">Preview</span>
                      )}
                      <span className="text-xs text-gray-500 tabular-nums">
                        {formatDuration(lecture.duration)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {course.description && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">About This Course</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">{course.description}</p>
            </div>
          )}

          {/* Requirements */}
          {course.requirements?.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Requirements</h2>
              <ul className="space-y-2">
                {course.requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {paymentModal.isOpen && (
        <PaymentModal
          isOpen={paymentModal.isOpen}
          onClose={() => setPaymentModal({ isOpen: false, data: null })}
          paymentData={paymentModal.data}
        />
      )}
    </div>
  );
}
