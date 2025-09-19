"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useContent } from "@/hooks/useContent";
import { useAttempts } from "@/hooks/useAttempts";
import apiClient from "@/lib/api";
import { CheckCircle, Clock, Play, Eye, Trophy, Star } from "lucide-react";

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

type TabType = "papers" | "test-series";

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("papers");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);
  const [testSeriesWithPapers, setTestSeriesWithPapers] = useState<TestSeries[]>([]);
  const [loadingSeriesDetails, setLoadingSeriesDetails] = useState(false);

  const router = useRouter();
  const { user } = useAuth();
  const { subscriptions, loading: loadingSubscriptions, error: subscriptionError, initialized } =
    useSubscription();
  const { papers, testSeries, loading: loadingContent, error: contentError } = useContent();
  const { attempts, loading: loadingAttempts, getAttemptStatus, getAttemptForPaper } =
    useAttempts();

  const fetchTestSeriesWithPapers = async (seriesId: string) => {
    try {
      setLoadingSeriesDetails(true);
      const response = await apiClient.get<ApiResponse<TestSeries>>(
        `/private/test-series/${seriesId}`
      );
      return response.data.data;
    } catch (err: any) {
      console.error("Error fetching test series details:", err);
      return null;
    } finally {
      setLoadingSeriesDetails(false);
    }
  };

  const handleExpandSeries = async (seriesId: string) => {
    if (expandedSeries === seriesId) {
      setExpandedSeries(null);
      return;
    }
    const existingSeries = testSeriesWithPapers.find((s) => s._id === seriesId);
    if (existingSeries) {
      setExpandedSeries(seriesId);
      return;
    }
    const seriesDetails = await fetchTestSeriesWithPapers(seriesId);
    if (seriesDetails) {
      setTestSeriesWithPapers((prev) => [...prev, seriesDetails]);
      setExpandedSeries(seriesId);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(price);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getFilteredPapers = () => {
    if (!subscriptions) return [];
    let availablePapers: Paper[] = [];
    if (subscriptions.hasAllAccess) {
      availablePapers = papers;
    } else {
      const subscribedPaperIds = subscriptions.subscriptions.singlePapers
        .map((sub: any) =>
          sub.itemId && typeof sub.itemId === "object" ? sub.itemId._id : null
        )
        .filter(Boolean);
      availablePapers = papers.filter((paper) => subscribedPaperIds.includes(paper._id));
    }
    return availablePapers.filter(
      (paper) =>
        paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredTestSeries = () => {
    if (!subscriptions) return [];
    let availableSeries: TestSeries[] = [];
    if (subscriptions.hasAllAccess) {
      availableSeries = testSeries;
    } else {
      const subscribedSeriesIds = subscriptions.subscriptions.testSeries
        .map((sub: any) =>
          sub.itemId && typeof sub.itemId === "object" ? sub.itemId._id : null
        )
        .filter(Boolean);
      availableSeries = testSeries.filter((series) => subscribedSeriesIds.includes(series._id));
    }
    return availableSeries.filter(
      (series) =>
        series.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        series.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredPapers = getFilteredPapers();
  const filteredTestSeries = getFilteredTestSeries();

  if (loadingSubscriptions || !initialized || loadingContent || loadingAttempts) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (subscriptionError || contentError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-200">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-gray-400 mb-4">{subscriptionError || contentError}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!subscriptions || !subscriptions.hasAnySubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-800">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No Subscriptions</h2>
            <p className="text-gray-400 mb-6">
              You don't have any active subscriptions yet. Explore our content and subscribe to get
              started!
            </p>
            <Button
              onClick={() => (window.location.href = "/explore")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Explore Content
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-200">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 via-blue-700 to-indigo-700"></div>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 py-16 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full mb-6">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4 text-white drop-shadow-lg">My Subscriptions</h1>
          <p className="text-xl mb-8 text-gray-200/80 max-w-2xl mx-auto">
            Access your subscribed content and track your learning progress
          </p>
          {subscriptions?.hasAllAccess && (
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-3xl mx-auto border border-white/20 shadow-2xl">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mr-4">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white">All-Access Active</h3>
              </div>
              <p className="text-lg text-gray-200 leading-relaxed">
                🎉 Congratulations! You have unlimited access to all papers and test series.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Search and Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <div className="max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search your subscribed content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 pl-14 pr-12 text-gray-200 bg-gray-800 border border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-md"
            />
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeTab === "papers"
            ? filteredPapers.map((paper) => {
                const attemptStatus = getAttemptStatus(paper._id);
                return (
                  <div
                    key={paper._id}
                    className="bg-gray-900/80 rounded-2xl shadow-lg border border-gray-800 p-8 hover:border-emerald-600 transition-all"
                  >
                    <h3 className="text-xl font-bold text-white mb-2">{paper.title}</h3>
                    <p className="text-gray-400 mb-4">Subject: {paper.subject}</p>
                    <p className="text-gray-500 text-sm mb-4">Added on {formatDate(paper.createdAt)}</p>
                    <div className="text-emerald-400 font-bold text-2xl mb-4">
                      {formatPrice(paper.price)}
                    </div>
                    <Button
                      onClick={() => {
                        const attemptForPaper = getAttemptForPaper(paper._id);
                        if (attemptStatus.status === "not-attempted") {
                          router.push(`/subscriptions/attempts/attempt-paper?paperId=${paper._id}`);
                        } else if (attemptStatus.status === "in-progress") {
                          router.push(
                            `/subscriptions/attempts/attempt-paper?attemptId=${attemptForPaper?._id}`
                          );
                        } else {
                          router.push(
                            `/subscriptions/attempts/attempt-reviews?attemptId=${attemptForPaper?._id}`
                          );
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
                    >
                      {attemptStatus.status === "not-attempted"
                        ? "Start"
                        : attemptStatus.status === "in-progress"
                        ? "Resume"
                        : "View Results"}
                    </Button>
                  </div>
                );
              })
            : filteredTestSeries.map((series) => (
                <div
                  key={series._id}
                  className="bg-gray-900/80 rounded-2xl shadow-lg border border-gray-800 p-8 hover:border-blue-600 transition-all"
                >
                  <h3 className="text-xl font-bold text-white mb-2">{series.title}</h3>
                  <p className="text-gray-400 mb-4">{series.description}</p>
                  <p className="text-gray-500 text-sm mb-4">Created on {formatDate(series.createdAt)}</p>
                  <div className="text-blue-400 font-bold text-2xl mb-4">{formatPrice(series.price)}</div>
                  <Button
                    onClick={() => handleExpandSeries(series._id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                  >
                    {expandedSeries === series._id ? "Hide Papers" : "View Papers"}
                  </Button>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
