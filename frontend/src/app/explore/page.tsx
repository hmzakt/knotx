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
import apiClient from "@/lib/api";
import {
  Search,
  X,
  Filter,
  SortAsc,
  SortDesc,
  BookOpen,
  Layers,
} from "lucide-react";

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
  papers?: Paper[]; // included when fetching series details
  papersCount?: number;
}

type TabType = "papers" | "test-series";
type SortOption = "newest" | "oldest" | "priceLow" | "priceHigh";

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<TabType>("papers");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    data: any;
  }>({ isOpen: false, data: null });
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);
  const [testSeriesWithPapers, setTestSeriesWithPapers] = useState<TestSeries[]>([]);
  const [loadingSeriesDetails, setLoadingSeriesDetails] = useState(false);

  const { subscriptions, loading: loadingSubscriptions, error: subscriptionError, initialized } =
    useSubscription();
  const { papers, testSeries, loading, error } = useContent();
  const { getAttemptForPaper, getAttemptStatus } = useAttempts();
  const router = useRouter();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(price);

  // ------------------------------
  // Filtering + Sorting
  // ------------------------------
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
          (s.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())) &&
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

  // Check if user has access to specific items
  const userHasAccessToItem = useMemo(() => {
    const accessMap: Record<string, boolean> = {};
    
    if (subscriptions?.hasAllAccess) {
      // User has all-access, so they have access to everything
      (papers || []).forEach(paper => {
        accessMap[`paper-${paper._id}`] = true;
      });
      (testSeries || []).forEach(series => {
        accessMap[`test-series-${series._id}`] = true;
      });
    } else if (subscriptions) {
      // Check individual paper subscriptions
      subscriptions.subscriptions.singlePapers.forEach((sub: any) => {
        const paperId = sub.itemId?._id || sub.itemId;
        if (paperId) accessMap[`paper-${paperId}`] = true;
      });
      
      // Check test series subscriptions
      subscriptions.subscriptions.testSeries.forEach((sub: any) => {
        const seriesId = sub.itemId?._id || sub.itemId;
        if (seriesId) accessMap[`test-series-${seriesId}`] = true;
      });
    }
    
    return accessMap;
  }, [subscriptions, papers, testSeries]);

  type ApiResponse<T> = {
    statusCode: number;
    data: T;
    message: string;
    success: boolean;
  };

  const fetchTestSeriesWithPapers = async (seriesId: string) => {
    try {
      setLoadingSeriesDetails(true);
      const response = await apiClient.get<ApiResponse<TestSeries>>(
        `/private/test-series/${seriesId}`
      );
      return response.data.data;
    } catch (err) {
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
    const existing = testSeriesWithPapers.find((s) => s._id === seriesId);
    if (existing) {
      setExpandedSeries(seriesId);
      return;
    }
    const details = await fetchTestSeriesWithPapers(seriesId);
    if (details) {
      setTestSeriesWithPapers((prev) => [...prev, details]);
      setExpandedSeries(seriesId);
    }
  };

  const handleItemClick = (item: Paper | TestSeries, type: TabType, hasAccess: boolean) => {
    if (!hasAccess) {
      setPaymentModal({
        isOpen: true,
        data: { type, item }
      });
      return;
    }

    if (type === "papers") {
      const status = getAttemptStatus((item as Paper)._id);
      const attempt = getAttemptForPaper((item as Paper)._id);
      if (status.status === "not-attempted") {
        router.push(`/subscriptions/attempts/attempt-paper?paperId=${item._id}`);
      } else if (status.status === "in-progress") {
        router.push(`/subscriptions/attempts/attempt-paper?attemptId=${attempt?._id}`);
      } else {
        router.push(`/subscriptions/attempts/attempt-reviews?attemptId=${attempt?._id}`);
      }
    } else {
      // For test series with access, direct users to their subscriptions page
      // where they can expand the series and start individual papers
      router.push(`/subscriptions`);
    }
  };

  // ------------------------------
  // Loading & Error
  // ------------------------------
  if (loading || loadingSubscriptions)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <LoadingSpinner size="lg" />
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p>{error}</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Hero */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white py-12">
        <div className="text-center max-w-2xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Explore Our Content</h1>
          <p className="mb-6">Access premium papers and test series</p>
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
            {subscriptions?.hasAllAccess ? (
              <>
                <h3 className="text-2xl font-bold mb-2">All-Access Subscription (Active)</h3>
                <p className="mb-4">You have unlimited access to all content.</p>
                <div className="text-3xl font-bold mb-6 text-emerald-400">Subscribed</div>
                <Button disabled className="w-full bg-gray-600 text-white cursor-not-allowed">
                  Subscribed
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold mb-2">All-Access Subscription</h3>
                <p className="mb-4">Get unlimited access to all content</p>
                <div className="text-3xl font-bold mb-6">
                  {formatPrice(999)} <span className="text-lg">/month</span>
                </div>
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setPaymentModal({
                    isOpen: true,
                    data: { type: 'all-access' }
                  })}
                >
                  Get All-Access
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Search + Tabs + Filters */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Search */}
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-10 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-100"
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
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${activeTab === "papers"
              ? "bg-emerald-600 text-white scale-105 shadow-lg"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" /> Papers (
            {filteredAndSortedPapers.length})
          </button>
          <button
            onClick={() => setActiveTab("test-series")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${activeTab === "test-series"
              ? "bg-emerald-600 text-white scale-105 shadow-lg"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
          >
            <Layers className="w-4 h-4 inline mr-2" /> Test Series (
            {filteredAndSortedSeries.length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center bg-gray-900 border border-gray-700 rounded px-3">
            <Filter className="w-4 h-4 mr-2 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-gray-200 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c} className="bg-gray-900">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center bg-gray-900 border border-gray-700 rounded px-3">
            {sortBy === "priceLow" || sortBy === "priceHigh" ? (
              <SortAsc className="w-4 h-4 mr-2 text-gray-400" />
            ) : (
              <SortDesc className="w-4 h-4 mr-2 text-gray-400" />
            )}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-gray-200 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priceLow">Price: Low to High</option>
              <option value="priceHigh">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(activeTab === "papers"
            ? filteredAndSortedPapers
            : filteredAndSortedSeries
          ).map((item) => {
            const itemType = activeTab === "papers" ? "paper" : "test-series";
            const hasAccess = userHasAccessToItem[`${itemType}-${item._id}`] || subscriptions?.hasAllAccess;
            const attemptStatus = activeTab === "papers" ? getAttemptStatus(item._id) : null;
            const isPaper = "subject" in item;
            const seriesDetails = !isPaper
              ? testSeriesWithPapers.find((s) => s._id === item._id) || (item as TestSeries)
              : null;

            return (
              <div
                key={item._id}
                className="bg-gray-900 rounded-xl shadow p-6 border border-gray-700 hover:border-emerald-500 hover:scale-[1.02] transition-all duration-300"
              >
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-gray-400">
                  {"subject" in item
                    ? item.subject
                    : (item as TestSeries).description || "No description"}
                </p>
                <div className="my-3">
                  <SubscriptionStatus
                    type={itemType}
                    itemId={item._id}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-400">{formatPrice(item.price)}</span>
                  {hasAccess ? (
                    isPaper ? (
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleItemClick(item, activeTab, hasAccess)}
                      >
                        {attemptStatus?.status === "not-attempted"
                          ? "Start"
                          : attemptStatus?.status === "in-progress"
                          ? "Resume"
                          : "View Results"}
                      </Button>
                    ) : (
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleExpandSeries(item._id)}
                      >
                        {expandedSeries === item._id ? "Hide Papers" : "View Papers"}
                      </Button>
                    )
                  ) : (
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() =>
                        setPaymentModal({ isOpen: true, data: { type: activeTab, item } })
                      }
                    >
                      Buy Now
                    </Button>
                  )}
                </div>

                {/* Accordion for Test Series papers when user has access */}
                {!isPaper && hasAccess && expandedSeries === item._id && (
                  <div className="space-y-4 mt-6">
                    {loadingSeriesDetails ? (
                      <div className="flex justify-center py-4">
                        <LoadingSpinner size="sm" />
                      </div>
                    ) : (seriesDetails as TestSeries)?.papers?.length ? (
                      (seriesDetails as TestSeries).papers!.map((paper) => {
                        const innerStatus = getAttemptStatus(paper._id);
                        const attemptForPaper = getAttemptForPaper(paper._id);
                        return (
                          <div
                            key={paper._id}
                            className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-emerald-600 transition-all"
                          >
                            <h4 className="text-lg font-semibold text-white mb-1">
                              {paper.title}
                            </h4>
                            <p className="text-gray-400 text-sm mb-3">Subject: {paper.subject}</p>
                            <Button
                              onClick={() => {
                                if (innerStatus.status === "not-attempted") {
                                  router.push(
                                    `/subscriptions/attempts/attempt-paper?paperId=${paper._id}`
                                  );
                                } else if (innerStatus.status === "in-progress") {
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
                              {innerStatus.status === "not-attempted"
                                ? "Start"
                                : innerStatus.status === "in-progress"
                                ? "Resume"
                                : "View Results"}
                            </Button>
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