"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PaymentModal from "@/components/PaymentModal";
import { useCourses, Course } from "@/hooks/useCourses";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search, X, Lock, Play, Clock, Star, BookOpen, ChevronRight,
  GraduationCap, CrownIcon,
} from "lucide-react";

const levelColor = {
  beginner: "text-emerald-400 bg-emerald-950/60",
  intermediate: "text-amber-400 bg-amber-950/60",
  advanced: "text-red-400 bg-red-950/60",
} as const;

const formatDuration = (seconds: number) => {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

export default function CoursesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { subscriptions } = useSubscription();
  const { courses, loading, error } = useCourses();

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; data: any }>({
    isOpen: false,
    data: null,
  });

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

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-gray-100 px-4">
        <Lock className="w-16 h-16 text-emerald-500 mb-6" />
        <h2 className="text-3xl font-bold mb-2">Sign In Required</h2>
        <p className="text-gray-400 mb-6 text-center">Log in to browse and purchase courses.</p>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => router.push("/login")}>
          Login
        </Button>
      </div>
    );
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <LoadingSpinner size="lg" />
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">
        <p>{error}</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-gray-100">
      {/* Hero */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 py-16 px-4 relative overflow-hidden rounded-b-3xl">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <GraduationCap className="w-14 h-14 text-emerald-300 mx-auto mb-4" />
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight">Video Courses</h1>
          <p className="text-lg text-gray-200 mb-8">
            Learn with structured video lectures from expert instructors.
          </p>

          {(subscriptions as any)?.hasAllCourses ? (
            <span className="text-emerald-300 text-lg font-semibold flex items-center justify-center gap-2">
              <CrownIcon className="w-5 h-5" /> All-Courses Access Active
            </span>
          ) : (
            <Button
              className="bg-white text-emerald-800 hover:bg-gray-100 px-8 py-3 text-lg font-bold shadow-lg"
              onClick={() =>
                setPaymentModal({
                  isOpen: true,
                  data: {
                    type: "all-courses",
                    itemName: "KnotX All Courses",
                    itemDescription: "Unlimited access to all video courses",
                    baseAmount: Number(process.env.NEXT_PUBLIC_ALL_COURSES_PRICE_PAISE || 99900),
                    currency: "INR",
                    durationDays: 365,
                  },
                })
              }
            >
              <CrownIcon className="w-5 h-5 mr-2" /> Get All Courses
            </Button>
          )}
        </div>
        <div className="absolute -right-32 -bottom-32 w-96 h-96 rounded-full bg-emerald-800 opacity-20 blur-3xl" />
        <div className="absolute -left-32 -top-32 w-96 h-96 rounded-full bg-emerald-600 opacity-20 blur-3xl" />
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-card shadow-sm rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-100"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-3 text-gray-400 hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Level filter */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "beginner", "intermediate", "advanced"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLevelFilter(l)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  levelFilter === l
                    ? "bg-emerald-600 text-white"
                    : "bg-card text-card-foreground hover:bg-gray-700"
                }`}
              >
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <p className="text-gray-400 text-sm">{filtered.length} course{filtered.length !== 1 ? "s" : ""} found</p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg">No courses found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course) => {
              const hasAccess = hasCourseAccess(course._id);
              return (
                <div
                  key={course._id}
                  className="bg-card text-card-foreground rounded-xl border border-gray-700 hover:border-emerald-500 hover:scale-[1.01] transition-all duration-200 overflow-hidden flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gray-800">
                    {course.thumbnail?.url ? (
                      <img
                        src={course.thumbnail.url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-10 h-10 text-gray-600" />
                      </div>
                    )}
                    {hasAccess && (
                      <div className="absolute top-2 right-2 bg-emerald-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                        Enrolled
                      </div>
                    )}
                    {!hasAccess && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-white/60" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColor[course.level] || levelColor.beginner}`}>
                        {course.level}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-white mb-1 line-clamp-2">{course.title}</h3>
                    {course.shortDescription && (
                      <p className="text-xs text-gray-400 mb-3 line-clamp-2">{course.shortDescription}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3 mt-auto">
                      {course.totalDuration > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(course.totalDuration)}
                        </span>
                      )}
                      {course.ratingsAverage > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400" />
                          {course.ratingsAverage.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mb-4">by {course.instructor?.fullname}</p>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="font-bold text-emerald-400 text-lg">
                        {course.isFree || course.price === 0 ? "Free" : formatPrice(course.price)}
                      </span>
                      <Button
                        size="sm"
                        className={hasAccess ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-700 hover:bg-gray-600"}
                        onClick={() => {
                          if (hasAccess) {
                            router.push(`/courses/${course._id}`);
                          } else {
                            setPaymentModal({ isOpen: true, data: buildCoursePayment(course) });
                          }
                        }}
                      >
                        {hasAccess ? (
                          <span className="flex items-center gap-1">
                            Watch <ChevronRight className="w-4 h-4" />
                          </span>
                        ) : (
                          "Buy"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
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
