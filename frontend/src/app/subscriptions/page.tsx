"use client";
import { useState } from "react";
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
  Trophy,
  Star,
  Search,
  FileText,
  Layers,
} from "lucide-react";

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
  const { start } = useRouteLoading();
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const { subscriptions, loading: loadingSubscriptions, error: subscriptionError, initialized } =
    useSubscription();
  const { papers, testSeries, loading: loadingContent, error: contentError } = useContent();
  const { attempts, loading: loadingAttempts, getAttemptStatus, getAttemptForPaper } =
    useAttempts();

  // Map paperId -> conflict info (attemptId, message)
  const [startConflicts, setStartConflicts] = useState<Record<string, { attemptId?: string; message?: string }>>({});
  
  // Rules dialog state
  const [rulesDialog, setRulesDialog] = useState<{ isOpen: boolean; paperId: string | null }>({
    isOpen: false,
    paperId: null,
  });
  const [rulesAccepted, setRulesAccepted] = useState(false);

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

  const fmtSec = (s: number) => {
    if (!s || s <= 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const handleStartAttemptInline = async (paperId: string) => {
    // Check if this is a new attempt
    const status = getAttemptStatus(paperId);
    if (status.status === "not-attempted") {
      // Show rules dialog for new attempts
      setRulesDialog({ isOpen: true, paperId });
      setRulesAccepted(false);
      return;
    }
    
    start('nav');
    setNavigatingId(paperId);
    try {
      const res = await apiClient.post(`/attempts/start/${paperId}`);
      const data = res.data;
      const payload = data?.data ?? data;
      const attemptId = payload.attemptId || payload._id || payload.id;
      if (attemptId) {
        // navigate to attempt by id to avoid another start call
        router.push(`/subscriptions/attempts/attempt-paper?attemptId=${attemptId}`);
        return;
      }
      // If server didn't return attemptId, fall back to opening by paperId
      router.push(`/subscriptions/attempts/attempt-paper?paperId=${paperId}`);
    } catch (err: any) {
      const status = err?.response?.status;
      const respData = err?.response?.data;
      if (status === 409) {
        const attemptIdFromResp = respData?.data?.attemptId || respData?.attemptId || respData?.existingAttemptId || respData?.data?.id;
        setStartConflicts(prev => ({ ...prev, [paperId]: { attemptId: attemptIdFromResp, message: respData?.message } }));
      } else {
        console.error('Failed to start attempt', err);
        alert(err?.response?.data?.message || err?.message || 'Failed to start attempt');
      }
    } finally {
      setNavigatingId(null);
    }
  };

  const handleRulesAcceptance = async () => {
    if (rulesAccepted && rulesDialog.paperId) {
      setRulesDialog({ isOpen: false, paperId: null });
      // Start the attempt after rules acceptance
      await handleStartAttemptInline(rulesDialog.paperId);
    }
  };

  const handleRulesDialogClose = () => {
    setRulesDialog({ isOpen: false, paperId: null });
    setRulesAccepted(false);
  };

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
              onClick={() => { start("nav"); window.location.href = "/explore"; }}
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

      {/* Search + Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search your subscribed content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-gray-900 border border-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-6 mb-12">
          <button
            onClick={() => setActiveTab("papers")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === "papers"
                ? "bg-emerald-600 text-white shadow-lg scale-105"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" /> Papers
          </button>
          <button
            onClick={() => setActiveTab("test-series")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === "test-series"
                ? "bg-emerald-600 text-white shadow-lg scale-105"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4" /> Test Series
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 transition-all">
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
                    <p className="text-gray-500 text-sm mb-4">
                      Added on {formatDate(paper.createdAt)}
                    </p>
                    <div className="text-emerald-400 font-bold text-2xl mb-4">
                      {formatPrice(paper.price)}
                    </div>
                    <div>
                      <Button
                        onClick={() => {
                          const attemptForPaper = getAttemptForPaper(paper._id);
                          if (attemptStatus.status === 'not-attempted') {
                            return handleStartAttemptInline(paper._id);
                          }
                          start('nav');
                          setNavigatingId(paper._id);
                          if (attemptStatus.status === 'in-progress') {
                            router.push(`/subscriptions/attempts/attempt-paper?attemptId=${attemptForPaper?._id}`);
                          } else {
                            router.push(`/subscriptions/attempts/attempt-reviews?attemptId=${attemptForPaper?._id}`);
                          }
                        }}
                        disabled={navigatingId === paper._id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
                      >
                        {navigatingId === paper._id
                          ? 'Loading...'
                          : attemptStatus.status === 'not-attempted'
                          ? 'Start'
                          : attemptStatus.status === 'in-progress'
                          ? 'Resume'
                          : 'View Results'}
                      </Button>

                      {/* Inline conflict banner for this paper (shown if start returned 409) */}
                      {startConflicts[paper._id] && (
                        <div className="mt-3 p-3 rounded-lg bg-yellow-100 text-yellow-800 text-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">An attempt is already in progress</div>
                              <div>
                                {startConflicts[paper._id].message || 'You cannot start a new attempt right now.'}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {startConflicts[paper._id].attemptId && (
                                <Button
                                  onClick={() => router.push(`/subscriptions/attempts/attempt-paper?attemptId=${startConflicts[paper._id].attemptId}`)}
                                  className="bg-emerald-600 text-white"
                                >
                                  Resume
                                </Button>
                              )}
                              <Button variant="outline" onClick={() => setStartConflicts(prev => { const copy = { ...prev }; delete copy[paper._id]; return copy; })}>
                                Dismiss
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            : filteredTestSeries.map((series) => {
                const seriesDetails =
                  testSeriesWithPapers.find((s) => s._id === series._id) || series;
                return (
                  <div
                    key={series._id}
                    className="bg-gray-900/80 rounded-2xl shadow-lg border border-gray-800 p-8 hover:border-emerald-600 transition-all"
                  >
                    <h3 className="text-xl font-bold text-white mb-2">{series.title}</h3>
                    <p className="text-gray-400 mb-4">{series.description}</p>
                    <p className="text-gray-500 text-sm mb-4">
                      Created on {formatDate(series.createdAt)}
                    </p>
                    <div className="text-emerald-400 font-bold text-2xl mb-4">
                      {formatPrice(series.price)}
                    </div>
                    <Button
                      onClick={() => handleExpandSeries(series._id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white w-full mb-4"
                    >
                      {expandedSeries === series._id ? "Hide Papers" : "View Papers"}
                    </Button>

                    {/* Accordion for Papers */}
                    {expandedSeries === series._id && (
                      <div className="space-y-4 mt-6">
                        {loadingSeriesDetails ? (
                          <div className="flex justify-center py-4">
                            <LoadingSpinner size="sm" />
                          </div>
                        ) : seriesDetails?.papers?.length ? (
                          seriesDetails.papers.map((paper) => {
                            const attemptStatus = getAttemptStatus(paper._id);
                            return (
                              <div
                                key={paper._id}
                                className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-emerald-600 transition-all"
                              >
                                <h4 className="text-lg font-semibold text-white mb-1">
                                  {paper.title}
                                </h4>
                                <p className="text-gray-400 text-sm mb-3">
                                  Subject: {paper.subject}
                                </p>
                                <div>
                                  <Button
                                    onClick={() => {
                                      const attemptForPaper = getAttemptForPaper(paper._id);
                                      if (attemptStatus.status === 'not-attempted') {
                                        return handleStartAttemptInline(paper._id);
                                      }
                                      start('nav');
                                      setNavigatingId(paper._id);
                                      if (attemptStatus.status === 'in-progress') {
                                        router.push(`/subscriptions/attempts/attempt-paper?attemptId=${attemptForPaper?._id}`);
                                      } else {
                                        router.push(`/subscriptions/attempts/attempt-reviews?attemptId=${attemptForPaper?._id}`);
                                      }
                                    }}
                                    disabled={navigatingId === paper._id}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
                                  >
                                    {navigatingId === paper._id
                                      ? 'Loading...'
                                      : attemptStatus.status === 'not-attempted'
                                      ? 'Start'
                                      : attemptStatus.status === 'in-progress'
                                      ? 'Resume'
                                      : 'View Results'}
                                  </Button>

                                  {startConflicts[paper._id] && (
                                    <div className="mt-3 p-3 rounded-lg bg-yellow-100 text-yellow-800 text-sm">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <div className="font-semibold">An attempt is already in progress</div>
                                          <div>
                                            {startConflicts[paper._id].message || 'You cannot start a new attempt right now.'}
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          {startConflicts[paper._id].attemptId && (
                                            <Button
                                              onClick={() => router.push(`/subscriptions/attempts/attempt-paper?attemptId=${startConflicts[paper._id].attemptId}`)}
                                              className="bg-emerald-600 text-white"
                                            >
                                              Resume
                                            </Button>
                                          )}
                                          <Button variant="outline" onClick={() => setStartConflicts(prev => { const copy = { ...prev }; delete copy[paper._id]; return copy; })}>
                                            Dismiss
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-gray-500 text-center">No papers in this series.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
        </div>
      </div>

      {/* Rules Dialog */}
      {rulesDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Test Rules & Guidelines</h2>
            <div className="space-y-3 mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-300 text-sm">You get +1 score for correct answers, 0 for wrong answers</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-300 text-sm">You can start only one attempt at a time</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-300 text-sm">You cannot start another attempt without submitting this attempt</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-300 text-sm">Be fair and avoid cheating so that everyone gets a fair platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 mb-6">
              <input
                type="checkbox"
                id="rulesAccepted"
                checked={rulesAccepted}
                onChange={(e) => setRulesAccepted(e.target.checked)}
                className="w-4 h-4 text-emerald-600 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500 focus:ring-2"
              />
              <label htmlFor="rulesAccepted" className="text-sm text-gray-300">
                I have read and agree to follow these rules
              </label>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={handleRulesDialogClose}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white border-gray-500"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRulesAcceptance}
                disabled={!rulesAccepted}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
