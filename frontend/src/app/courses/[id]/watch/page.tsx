"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PaymentModal from "@/components/PaymentModal";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/lib/api";
import {
  Play, Lock, ChevronDown, ChevronRight,
  ChevronLeft, AlertCircle,
} from "lucide-react";

interface Lecture {
  _id: string;
  title: string;
  description?: string;
  duration: number;
  order: number;
  section: string | null;
  isPreviewFree: boolean;
}

interface Section {
  _id: string;
  title: string;
  order: number;
  lectures: Lecture[];
}

interface CourseInfo {
  _id: string;
  title: string;
  sections: Section[];
  lectures: Lecture[]; // flat
  price: number;
  isFree: boolean;
  shortDescription?: string;
}

const formatDuration = (s: number) => {
  if (!s) return "";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
};

export default function WatchPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { subscriptions } = useSubscription();

  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [courseLoading, setCourseLoading] = useState(true);

  const [activeLectureId, setActiveLectureId] = useState<string | null>(
    searchParams.get("lectureId")
  );
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [activeLecture, setActiveLecture] = useState<Lecture | null>(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; data: any }>({
    isOpen: false,
    data: null,
  });

  // Auth guard
  useEffect(() => {
    if (!user) router.push("/login");
  }, [user]);

  // Load course structure
  useEffect(() => {
    if (!courseId) return;
    setCourseLoading(true);
    apiClient.get(`/courses/${courseId}`)
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setCourse(data);
        // Open all sections by default
        if (data?.sections?.length > 0) {
          setExpandedSections(new Set(data.sections.map((s: Section) => s._id)));
        }
        // Auto-select first lecture if none set
        if (!activeLectureId) {
          const first =
            data?.sections?.[0]?.lectures?.[0] || data?.lectures?.[0];
          if (first) setActiveLectureId(first._id);
        }
      })
      .catch(() => setCourse(null))
      .finally(() => setCourseLoading(false));
  }, [courseId]);

  // Fetch stream token when active lecture changes
  const loadLecture = useCallback(async (lectureId: string) => {
    if (!courseId) return;
    setStreamLoading(true);
    setStreamError(null);
    setHlsUrl(null);
    setActiveLectureId(lectureId);

    try {
      const res = await apiClient.get(`/lectures/${lectureId}/play?courseId=${courseId}`);
      const payload = res.data?.data ?? res.data;
      setHlsUrl(payload.hlsUrl);

      // Find lecture meta
      const allLectures: Lecture[] = [
        ...(course?.sections?.flatMap((s) => s.lectures) || []),
        ...(course?.lectures || []),
      ];
      setActiveLecture(allLectures.find((l) => l._id === lectureId) || null);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403) {
        // Not subscribed
        setStreamError("subscription_required");
      } else if (status === 404) {
        setStreamError("Lecture not found or not available.");
      } else {
        setStreamError(err?.response?.data?.message || "Failed to load lecture");
      }
    } finally {
      setStreamLoading(false);
    }
  }, [courseId, course]);

  // Trigger when activeLectureId or course loads
  useEffect(() => {
    if (activeLectureId && course) {
      loadLecture(activeLectureId);
    }
  }, [activeLectureId, course]);

  const hasCourseAccess = () => {
    if (!subscriptions || !courseId) return false;
    if ((subscriptions as any).hasAllCourses) return true;
    return (subscriptions.subscriptions?.singleCourses || []).some(
      (sub: any) => (sub.itemId?._id || sub.itemId) === courseId
    );
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const allLectures: Lecture[] = [
    ...(course?.sections?.flatMap((s) => s.lectures) || []),
    ...(course?.lectures || []),
  ];

  const currentIndex = allLectures.findIndex((l) => l._id === activeLectureId);
  const prevLecture = currentIndex > 0 ? allLectures[currentIndex - 1] : null;
  const nextLecture = currentIndex < allLectures.length - 1 ? allLectures[currentIndex + 1] : null;

  if (courseLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <LoadingSpinner size="lg" />
      </div>
    );

  if (!course)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">
        <div className="text-center">
          <p className="text-xl text-red-400 mb-4">Course not found</p>
          <Button onClick={() => router.push("/courses")} className="bg-emerald-600 hover:bg-emerald-700">
            Browse Courses
          </Button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800">
        <button
          onClick={() => router.push(`/courses/${courseId}`)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-white font-medium text-sm line-clamp-1">{course.title}</span>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
          onClick={() => setSidebarOpen((p) => !p)}
        >
          {sidebarOpen ? "Hide Curriculum" : "Show Curriculum"}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Video area */}
          <div className="w-full bg-black">
            {streamLoading ? (
              <div className="aspect-video flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : streamError === "subscription_required" ? (
              <div className="aspect-video flex flex-col items-center justify-center gap-4 text-center px-4">
                <Lock className="w-12 h-12 text-gray-500" />
                <p className="text-white text-lg font-semibold">Subscribe to watch this lecture</p>
                <p className="text-gray-400 text-sm">Purchase this course to get full access.</p>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() =>
                    setPaymentModal({
                      isOpen: true,
                      data: {
                        type: "single-course",
                        itemId: course._id,
                        itemName: course.title,
                        itemDescription: course.shortDescription || "Video Course",
                        baseAmount: Math.max(Math.round((course.price || 0) * 100), 100),
                        currency: "INR",
                        durationDays: 365,
                      },
                    })
                  }
                >
                  Buy Course
                </Button>
              </div>
            ) : streamError ? (
              <div className="aspect-video flex flex-col items-center justify-center gap-3 text-center px-4">
                <AlertCircle className="w-10 h-10 text-red-400" />
                <p className="text-white">{streamError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => activeLectureId && loadLecture(activeLectureId)}
                  className="border-gray-600 text-gray-300"
                >
                  Retry
                </Button>
              </div>
            ) : hlsUrl ? (
              <VideoPlayer
                hlsUrl={hlsUrl}
                title={activeLecture?.title}
                autoPlay
                onError={(err) => setStreamError(err)}
              />
            ) : (
              <div className="aspect-video flex items-center justify-center">
                <Play className="w-16 h-16 text-gray-600" />
              </div>
            )}
          </div>

          {/* Lecture info + nav */}
          <div className="px-4 md:px-8 py-6 flex-1">
            {activeLecture && (
              <div className="mb-6">
                <h1 className="text-xl md:text-2xl font-bold text-white mb-2">{activeLecture.title}</h1>
                {activeLecture.description && (
                  <p className="text-gray-400 text-sm leading-relaxed">{activeLecture.description}</p>
                )}
              </div>
            )}

            {/* Prev / Next navigation */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                disabled={!prevLecture}
                onClick={() => prevLecture && loadLecture(prevLecture._id)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={!nextLecture}
                onClick={() => nextLecture && loadLecture(nextLecture._id)}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar — Curriculum */}
        {sidebarOpen && (
          <div className="w-80 xl:w-96 border-l border-gray-800 bg-gray-900 overflow-y-auto flex-shrink-0">
            <div className="px-4 py-4 border-b border-gray-800">
              <h2 className="text-white font-semibold text-sm">Course Curriculum</h2>
            </div>

            {/* Sectioned */}
            {course.sections?.map((section) => (
              <div key={section._id} className="border-b border-gray-800">
                <button
                  onClick={() => toggleSection(section._id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800 transition-colors text-left"
                >
                  <div>
                    <p className="text-gray-200 text-sm font-medium">{section.title}</p>
                    <p className="text-gray-500 text-xs">{section.lectures?.length || 0} lectures</p>
                  </div>
                  {expandedSections.has(section._id)
                    ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>

                {expandedSections.has(section._id) && (
                  <div>
                    {section.lectures?.map((lecture) => {
                      const isActive = lecture._id === activeLectureId;
                      const canWatch = hasCourseAccess() || lecture.isPreviewFree;
                      return (
                        <button
                          key={lecture._id}
                          onClick={() => canWatch && loadLecture(lecture._id)}
                          disabled={!canWatch}
                          className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                            isActive
                              ? "bg-emerald-950 border-r-2 border-emerald-500"
                              : canWatch
                              ? "hover:bg-gray-800"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {isActive ? (
                              <Play className="w-4 h-4 text-emerald-400" fill="currentColor" />
                            ) : canWatch ? (
                              <Play className="w-4 h-4 text-gray-500" />
                            ) : (
                              <Lock className="w-4 h-4 text-gray-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-snug line-clamp-2 ${isActive ? "text-emerald-300 font-medium" : "text-gray-300"}`}>
                              {lecture.title}
                            </p>
                            {lecture.isPreviewFree && !hasCourseAccess() && (
                              <span className="text-xs text-emerald-500">Preview</span>
                            )}
                            {lecture.duration > 0 && (
                              <span className="text-xs text-gray-500 mt-0.5 block tabular-nums">
                                {formatDuration(lecture.duration)}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* Flat lectures */}
            {course.lectures?.map((lecture) => {
              const isActive = lecture._id === activeLectureId;
              const canWatch = hasCourseAccess() || lecture.isPreviewFree;
              return (
                <button
                  key={lecture._id}
                  onClick={() => canWatch && loadLecture(lecture._id)}
                  disabled={!canWatch}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-gray-800 transition-colors ${
                    isActive
                      ? "bg-emerald-950 border-r-2 border-emerald-500"
                      : canWatch
                      ? "hover:bg-gray-800"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {isActive ? (
                      <Play className="w-4 h-4 text-emerald-400" fill="currentColor" />
                    ) : canWatch ? (
                      <Play className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug line-clamp-2 ${isActive ? "text-emerald-300 font-medium" : "text-gray-300"}`}>
                      {lecture.title}
                    </p>
                    {lecture.isPreviewFree && !hasCourseAccess() && (
                      <span className="text-xs text-emerald-500">Preview</span>
                    )}
                    {lecture.duration > 0 && (
                      <span className="text-xs text-gray-500 mt-0.5 block tabular-nums">
                        {formatDuration(lecture.duration)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
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
