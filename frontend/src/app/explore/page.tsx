"use client";

import { useState, useMemo } from "react";
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
import { Search, X, BookOpen, Layers, Lock, CrownIcon, Eye, EyeOff, ShoppingCart } from "lucide-react";
import SortSelect from "@/components/SortSelect";
import CategorySelect from "@/components/CategorySelect";
import { useAuth } from "@/contexts/AuthContext";

// -------------------------
// Types
// -------------------------
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

type TabType = "papers" | "test-series";
type SortOption = "newest" | "oldest" | "priceLow" | "priceHigh";

export default function ExplorePage() {
  const router = useRouter();
  const { start, stop } = useRouteLoading();
  const { user } = useAuth();
  const { subscriptions, loading: loadingSubscriptions } = useSubscription();
  const { papers, testSeries, loading: loadingContent, error: contentError } = useContent();
  const { getAttemptForPaper, getAttemptStatus } = useAttempts();

  const [startConflicts, setStartConflicts] = useState<Record<string, { attemptId?: string; message?: string }>>({});

  const fmtSec = (s: number) => {
    if (!s || s <= 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const handleStartAttemptInline = async (paperId: string) => {
    start('nav');
    setNavigatingId(paperId);
    try {
      const res = await apiClient.post(`/attempts/start/${paperId}`);
      const data = res.data;
      const payload = data?.data ?? data;
      const attemptId = payload.attemptId || payload._id || payload.id;
      if (attemptId) {
        router.push(`/subscriptions/attempts/attempt-paper?attemptId=${attemptId}`);
        return;
      }
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

  const [activeTab, setActiveTab] = useState<TabType>("papers");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; data: any }>({
    isOpen: false,
    data: null,
  });
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);
  const [testSeriesWithPapers, setTestSeriesWithPapers] = useState<TestSeries[]>([]);
  const [loadingSeriesDetails, setLoadingSeriesDetails] = useState(false);

  // Build payment data for modal (always provide paise values)
  const buildPaymentData = (args: {
    type: TabType | 'all-access';
    item?: Paper | TestSeries;
  }) => {
    if (args.type === 'all-access') {
      const allAccessAmountPaise = Number(process.env.NEXT_PUBLIC_ALL_ACCESS_PRICE_PAISE || 99900);
      return {
        type: 'all-access' as const,
        itemName: 'KnotX Pro — All Access',
        itemDescription: 'Unlimited access to all papers and test series',
        baseAmount: allAccessAmountPaise,
        currency: 'INR',
        durationDays: 30,
      };
    }

    const isPaper = args.type === 'papers';
    const item = args.item!;
    const rupees = (item as any).price ?? 0;
    const amountPaise = Math.max(Math.round(rupees * 100), 100);

    return {
      type: (isPaper ? 'single-paper' : 'test-series') as 'single-paper' | 'test-series',
      itemId: item._id,
      itemName: item.title,
      itemDescription: isPaper ? (item as Paper).subject : (item as TestSeries).description || 'Test Series',
      baseAmount: amountPaise,
      currency: 'INR',
      durationDays: 30,
    };
  };

  // ------------------------------
  // Helper functions
  // ------------------------------
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(price);

  const categories = useMemo(() => {
    if (activeTab === "papers") {
      return Array.from(new Set((papers || []).map((p) => p.subject)));
    }
    return Array.from(
      new Set((testSeries || []).map((s) => s.description?.split(" ")[0] || "Other"))
    );
  }, [activeTab, papers, testSeries]);

  const filteredAndSortedPapers: Paper[] = useMemo(() => {
    let result = (papers || []).filter(
      (p) =>
        (p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.subject.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (categoryFilter === "all" || p.subject === categoryFilter)
    );
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "priceLow":
        result.sort((a, b) => a.price - b.price);
        break;
      case "priceHigh":
        result.sort((a, b) => b.price - a.price);
        break;
    }
    return result;
  }, [papers, searchQuery, categoryFilter, sortBy]);

  const filteredAndSortedSeries: TestSeries[] = useMemo(() => {
    let result = (testSeries || []).filter(
      (s) =>
        (s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.description?.toLowerCase() || "").includes(searchQuery.toLowerCase())) &&
        (categoryFilter === "all" || (s.description?.includes(categoryFilter) || false))
    );
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "priceLow":
        result.sort((a, b) => a.price - b.price);
        break;
      case "priceHigh":
        result.sort((a, b) => b.price - a.price);
        break;
    }
    return result;
  }, [testSeries, searchQuery, categoryFilter, sortBy]);

  const userHasAccessToItem = useMemo(() => {
    const accessMap: Record<string, boolean> = {};
    if (subscriptions?.hasAllAccess) {
      (papers || []).forEach((p) => (accessMap[`paper-${p._id}`] = true));
      (testSeries || []).forEach((s) => (accessMap[`test-series-${s._id}`] = true));
    } else if (subscriptions) {
      subscriptions.subscriptions.singlePapers.forEach((sub: any) => {
        const paperId = sub.itemId?._id || sub.itemId;
        if (paperId) accessMap[`paper-${paperId}`] = true;
      });
      subscriptions.subscriptions.testSeries.forEach((sub: any) => {
        const seriesId = sub.itemId?._id || sub.itemId;
        if (seriesId) accessMap[`test-series-${seriesId}`] = true;
      });
    }
    return accessMap;
  }, [subscriptions, papers, testSeries]);

  // Fetch series details
  const fetchTestSeriesWithPapers = async (seriesId: string) => {
    try {
      setLoadingSeriesDetails(true);
      const response = await apiClient.get(`/private/test-series/${seriesId}`);
      return response.data.data;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setLoadingSeriesDetails(false);
    }
  };

  const handleExpandSeries = async (seriesId: string) => {
    if (expandedSeries === seriesId) return setExpandedSeries(null);

    const existing = testSeriesWithPapers.find((s) => s._id === seriesId);
    if (existing) return setExpandedSeries(seriesId);

    const details = await fetchTestSeriesWithPapers(seriesId);
    if (details) {
      setTestSeriesWithPapers((prev) => [...prev, details]);
      setExpandedSeries(seriesId);
    }
  };

  const [navigatingId, setNavigatingId] = useState<string | null>(null);

  const handleItemClick = (item: Paper | TestSeries, type: TabType, hasAccess: boolean) => {
    if (!hasAccess) {
      setPaymentModal({ isOpen: true, data: buildPaymentData({ type, item }) });
      return;
    }
    if (type === "papers") {
      const status = getAttemptStatus((item as Paper)._id);
      const attempt = getAttemptForPaper((item as Paper)._id);
      start("nav");
      setNavigatingId(item._id);
      if (status.status === "not-attempted")
        router.push(`/subscriptions/attempts/attempt-paper?paperId=${item._id}`);
      else if (status.status === "in-progress")
        router.push(`/subscriptions/attempts/attempt-paper?attemptId=${attempt?._id}`);
      else router.push(`/subscriptions/attempts/attempt-reviews?attemptId=${attempt?._id}`);
    } else {
      start("nav");
      setNavigatingId(item._id);
      router.push(`/subscriptions`);
    }
  };

  // ----------------------------------
  // Loading / Error
  // ----------------------------------
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-gray-100 px-4">
        <Lock className="w-16 h-16 text-emerald-500 mb-6" />
        <h2 className="text-3xl font-bold mb-2 text-center">Access Restricted</h2>
        <p className="text-gray-400 mb-6 text-center">
          You need to sign up or log in to explore premium content.
        </p>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 text-lg"
          onClick={() => router.push("./register")}
        >
          Sign Up Now
        </Button>
      </div>
    );
  }

  if (loadingContent || loadingSubscriptions)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <LoadingSpinner size="lg" />
      </div>
    );

  if (contentError)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">
        <p>{contentError}</p>
      </div>
    );

  // ----------------------------------
  // Main Page
  // ----------------------------------
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 text-white py-16 px-4 relative overflow-hidden rounded-b-3xl">
        <div className="max-w-4xl mx-auto text-center">
          <img src="/logo.png" alt="Logo" className="mx-auto w-28 h-auto mb-6" />
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
            Explore Premium Content
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8">
            Access curated papers and test series to boost your preparation.
          </p>
          {subscriptions?.hasAllAccess ? (
            <span className="text-emerald-400 text-xl font-semibold">Pro Subscribed - You can access all our contact</span>
          ) : (
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 px-8 py-3 text-lg"
                    onClick={() => setPaymentModal({ isOpen: true, data: buildPaymentData({ type: 'all-access' }) })}
                  >
                   <CrownIcon/> Get Pro
                  </Button>
          )}
        </div>
        <div className="absolute -right-32 -bottom-32 w-96 h-96 rounded-full bg-emerald-800 opacity-20 blur-3xl"></div>
        <div className="absolute -left-32 -top-32 w-96 h-96 rounded-full bg-emerald-600 opacity-20 blur-3xl"></div>
      </div>

      {/* Search + Tabs + Filters */}
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        {/* Search */}
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search papers or test series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-10 py-3 bg-card shadow-sm rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-100"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setActiveTab("papers")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === "papers"
                ? "bg-emerald-600 text-white scale-105 shadow-lg"
                : "bg-card text-card-foreground shadow-sm hover:bg-gray-700"
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            Papers ({filteredAndSortedPapers.length})
          </button>
          <button
            onClick={() => setActiveTab("test-series")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === "test-series"
                ? "bg-emerald-600 text-white scale-105 shadow-lg"
                : "bg-card text-card-foreground shadow-sm hover:bg-gray-700"
            }`}
          >
            <Layers className="w-4 h-4 inline mr-2" />
            Test Series ({filteredAndSortedSeries.length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 max-w-3xl mx-auto w-full">
          <CategorySelect
            value={categoryFilter}
            onChange={(v) => setCategoryFilter(v)}
            options={categories}
          />
          <SortSelect value={sortBy} onChange={(v) => setSortBy(v)} />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(activeTab === "papers" ? filteredAndSortedPapers : filteredAndSortedSeries).map((item) => {
            const itemType = activeTab === "papers" ? "paper" : "test-series";
            const hasAccess = userHasAccessToItem[`${itemType}-${item._id}`] || subscriptions?.hasAllAccess;
            const isPaper = "subject" in item;

            return (
              <div
                key={item._id}
                className="bg-card text-card-foreground shadow-sm rounded-xl p-6 border border-gray-700 hover:border-emerald-500 hover:scale-[1.02] transition-all duration-300"
              >
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-gray-400 mb-3">
                  {isPaper ? (item as Paper).subject : (item as TestSeries).description || "No description"}
                </p>
                <div className="my-3">
                  <SubscriptionStatus type={itemType} itemId={item._id} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-400">{formatPrice(item.price)}</span>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={navigatingId === item._id}
                    onClick={() => {
                      if (isPaper) {
                        // Use inline start for papers so we can show 409 conflicts inline
                        const status = getAttemptStatus((item as Paper)._id);
                        if (status.status === 'not-attempted') return handleStartAttemptInline((item as Paper)._id);
                        return handleItemClick(item, activeTab, hasAccess);
                      }
                      // For test series, check if user has access
                      if (hasAccess) {
                        return handleExpandSeries(item._id);
                      }
                      return handleItemClick(item, activeTab, hasAccess);
                    }}
                  >
                    {navigatingId === item._id ? (
                      "Loading..."
                    ) : isPaper ? (
                      hasAccess ? (
                        <span className="inline-flex items-center">
                          <Eye className="w-4 h-4 mr-2" /> View
                        </span>
                      ) : (
                        <span className="inline-flex items-center">
                          <ShoppingCart className="w-4 h-4 mr-2" /> Buy
                        </span>
                      )
                    ) : hasAccess ? (
                      expandedSeries === item._id ? (
                        <span className="inline-flex items-center">
                          <EyeOff className="w-4 h-4 mr-2" /> Hide Series
                        </span>
                      ) : (
                        <span className="inline-flex items-center">
                          <Eye className="w-4 h-4 mr-2" /> View Series
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center">
                        <ShoppingCart className="w-4 h-4 mr-2" /> Buy
                      </span>
                    )}
                  </Button>

                  {/* Inline conflict banner for this paper if start returned 409 */}
                  {startConflicts[item._id] && (
                    <div className="mt-3 p-3 rounded-lg bg-yellow-100 text-yellow-800 text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">An attempt is already in progress</div>
                          <div>
                            {startConflicts[item._id].message || 'You cannot start a new attempt right now.'}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {startConflicts[item._id].attemptId && (
                            <Button
                              onClick={() => router.push(`/subscriptions/attempts/attempt-paper?attemptId=${startConflicts[item._id].attemptId}`)}
                              className="bg-emerald-600 text-white"
                            >
                              Resume
                            </Button>
                          )}
                          <Button variant="outline" onClick={() => setStartConflicts(prev => { const copy = { ...prev }; delete copy[item._id]; return copy; })}>
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion for Papers in Test Series (only show if user has access and series is expanded) */}
                {!isPaper && hasAccess && expandedSeries === item._id && (
                  <div className="mt-6 space-y-3">
                    {loadingSeriesDetails ? (
                      <div className="flex justify-center py-4">
                        <LoadingSpinner size="sm" />
                      </div>
                    ) : (() => {
                        const seriesDetails = testSeriesWithPapers.find((s) => s._id === item._id);
                        return seriesDetails?.papers?.length ? (
                          seriesDetails.papers.map((paper) => {
                            const paperAttemptStatus = getAttemptStatus(paper._id);
                            const paperAttempt = getAttemptForPaper(paper._id);
                            return (
                              <div
                                key={paper._id}
                                className="bg-card text-card-foreground shadow-sm rounded-lg p-4 border border-gray-600 hover:border-emerald-500 transition-all"
                              >
                                <h4 className="text-base font-semibold text-white mb-1">
                                  {paper.title}
                                </h4>
                                <p className="text-gray-400 text-sm mb-3">
                                  Subject: {paper.subject}
                                </p>
                                <Button
                                  onClick={() => {
                                    start("nav");
                                    setNavigatingId(paper._id);
                                    if (paperAttemptStatus.status === "not-attempted") {
                                      router.push(`/subscriptions/attempts/attempt-paper?paperId=${paper._id}`);
                                    } else if (paperAttemptStatus.status === "in-progress") {
                                      router.push(`/subscriptions/attempts/attempt-paper?attemptId=${paperAttempt?._id}`);
                                    } else {
                                      router.push(`/subscriptions/attempts/attempt-reviews?attemptId=${paperAttempt?._id}`);
                                    }
                                  }}
                                  disabled={navigatingId === paper._id}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white w-full text-sm py-2"
                                >
                                  {navigatingId === paper._id
                                    ? "Loading..."
                                    : paperAttemptStatus.status === "not-attempted"
                                    ? "Start"
                                    : paperAttemptStatus.status === "in-progress"
                                    ? "Resume"
                                    : "View Results"}
                                </Button>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-gray-500 text-center text-sm py-4">No papers in this series.</p>
                        );
                      })()
                    }
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Modal */}
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
