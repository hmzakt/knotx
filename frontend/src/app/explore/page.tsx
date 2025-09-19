"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SubscriptionStatus from "@/components/SubscriptionStatus";
import PaymentModal from "@/components/PaymentModal";
import { useAuth } from "@/contexts/AuthContext";
import { useContent } from "@/hooks/useContent";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAttempts } from "@/hooks/useAttempts";
import { useRouter } from "next/navigation";
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

  const { user } = useAuth();
  const { subscriptions } = useSubscription();
  const { papers, testSeries, loading, error } = useContent();
  const router = useRouter();
  const { getAttemptForPaper } = useAttempts();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(price);

  // ------------------------------
  // Filtering + Sorting
  // ------------------------------
  const categories = useMemo(() => {
    if (activeTab === "papers") {
      return Array.from(new Set((papers as Paper[]).map((p) => p.subject)));
    }
    return Array.from(
      new Set((testSeries as TestSeries[]).map((s) => s.description?.split(" ")[0] || "Other"))
    );
  }, [activeTab, papers, testSeries]);

  const filteredAndSortedPapers: Paper[] = useMemo(() => {
    let result = (papers as Paper[]).filter(
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
    let result = (testSeries as TestSeries[]).filter(
      (s) =>
        (s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (categoryFilter === "all" || s.description?.includes(categoryFilter))
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

  // ------------------------------
  // Loading & Error
  // ------------------------------
  if (loading)
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
            <h3 className="text-2xl font-bold mb-2">All-Access Subscription</h3>
            <p className="mb-4">Get unlimited access to all content</p>
            <div className="text-3xl font-bold mb-6">
              {formatPrice(999)} <span className="text-lg">/month</span>
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
              Get All-Access
            </Button>
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

        {/* Tabs with animation */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setActiveTab("papers")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === "papers"
                ? "bg-emerald-600 text-white scale-105 shadow-lg"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" /> Papers (
            {filteredAndSortedPapers.length})
          </button>
          <button
            onClick={() => setActiveTab("test-series")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === "test-series"
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
          ).map((item) => (
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
                  type={activeTab === "papers" ? "paper" : "test-series"}
                  itemId={item._id}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-emerald-400">
                  {formatPrice(item.price)}
                </span>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Buy Now
                </Button>
              </div>
            </div>
          ))}
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
