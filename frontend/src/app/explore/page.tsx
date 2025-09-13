"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SubscriptionStatus from '@/components/SubscriptionStatus';
import PaymentModal from '@/components/PaymentModal';
import { useAuth } from '@/contexts/AuthContext';
import { useContent } from '@/hooks/useContent';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAttempts } from '@/hooks/useAttempts';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { CheckCircle, Eye } from 'lucide-react';

type TabType = 'papers' | 'test-series';

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<TabType>('papers');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    data: any;
  }>({ isOpen: false, data: null });
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);
  const [testSeriesWithPapers, setTestSeriesWithPapers] = useState<any[]>([]);
  const [loadingSeriesDetails, setLoadingSeriesDetails] = useState(false);

  const { user } = useAuth();
  const { subscriptions, refetch: refetchSubscriptions, loading: subLoading, initialized } = useSubscription();
  const { papers, testSeries, loading, error, refetch } = useContent();
  const { getAttemptStatus, getAttemptForPaper } = useAttempts();
  const router = useRouter();

  const handleBuyNow = (type: 'single-paper' | 'test-series' | 'all-access', itemId?: string, itemData?: any) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }
    
    // Validate required data
    if (type !== 'all-access' && (!itemId || !itemData)) {
      console.error('Missing required data for payment:', { type, itemId, itemData });
      return;
    }
    
    // Prepare payment data based on type
    let paymentData: any = {
      type,
      itemId,
      baseAmount: 0,
      itemName: '',
      itemDescription: '',
      durationDays: 30
    };

    if (type === 'all-access') {
      paymentData = {
        ...paymentData,
        baseAmount: 99900, // ₹999 in paise
        itemName: 'All-Access Subscription',
        itemDescription: 'Unlimited access to all papers and test series for 30 days',
        durationDays: 30
      };
    } else if (type === 'single-paper' && itemData) {
      paymentData = {
        ...paymentData,
        baseAmount: itemData.price * 100, // Convert to paise
        itemName: itemData.title,
        itemDescription: `Paper: ${itemData.subject}`,
        durationDays: 30
      };
    } else if (type === 'test-series' && itemData) {
      paymentData = {
        ...paymentData,
        baseAmount: itemData.price * 100, // Convert to paise
        itemName: itemData.title,
        itemDescription: `Test Series: ${itemData.papersCount || 0} papers`,
        durationDays: 30
      };
    }

    setPaymentModal({
      isOpen: true,
      data: paymentData
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Filter content based on search query
  const filteredPapers = papers.filter(paper =>
    paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTestSeries = testSeries.filter(series =>
    series.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    series.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Subscription helpers
  let hasAllAccess: boolean = false;
  let userSubs: { singlePapers: any[]; testSeries: any[] } = { singlePapers: [], testSeries: [] };
  if (subscriptions && typeof subscriptions === 'object') {
    hasAllAccess = subscriptions.hasAllAccess;
    userSubs = subscriptions.subscriptions || { singlePapers: [], testSeries: [] };
  }

  const hasPaperSubscription = (paperId: string) => {
    if (hasAllAccess) return true;
    return userSubs.singlePapers.some((sub: any) => sub.itemId && typeof sub.itemId === 'object' && sub.itemId._id === paperId);
  };
  const hasTestSeriesSubscription = (seriesId: string) => {
    if (hasAllAccess) return true;
    return userSubs.testSeries.some((sub: any) => sub.itemId && typeof sub.itemId === 'object' && sub.itemId._id === seriesId);
  };

  // Add handler for Attempt Now
  const handleAttemptNow = (paperId: string) => {
    const existingAttempt = getAttemptForPaper(paperId);
    if (existingAttempt) {
      if (existingAttempt.status === 'in-progress') {
        router.push(`/subscriptions/attempts/attempt-paper?attemptId=${existingAttempt._id}&paperId=${paperId}`);
      } else if (existingAttempt.status === 'submitted') {
        router.push(`/subscriptions/attempts/attempt-reviews?attemptId=${existingAttempt._id}`);
      } else {
        // fallback: start new attempt
        router.push(`/subscriptions/attempts/attempt-paper?paperId=${paperId}`);
      }
    } else {
      // No attempt yet, start new
      router.push(`/subscriptions/attempts/attempt-paper?paperId=${paperId}`);
    }
  };

  const fetchTestSeriesWithPapers = async (seriesId: string) => {
    try {
      setLoadingSeriesDetails(true);
      const response = await apiClient.get(`/private/test-series/${seriesId}`);
      return response.data.data;
    } catch (err) {
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
    const existingSeries = testSeriesWithPapers.find(s => s._id === seriesId);
    if (existingSeries) {
      setExpandedSeries(seriesId);
      return;
    }
    const seriesDetails = await fetchTestSeriesWithPapers(seriesId);
    if (seriesDetails) {
      setTestSeriesWithPapers(prev => [...prev, seriesDetails]);
      setExpandedSeries(seriesId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with All-Access Subscription */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Explore Our Content</h1>
            <p className="text-xl mb-8">Access premium papers and test series</p>
            
            {/* All-Access Subscription Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto border border-white/20">
              <h3 className="text-2xl font-bold mb-2">All-Access Subscription</h3>
              <p className="text-lg mb-4">Get unlimited access to all content</p>
              <div className="text-3xl font-bold mb-6">
                {formatPrice(999)} <span className="text-lg font-normal">/month</span>
              </div>
              <Button 
                onClick={() => handleBuyNow('all-access')}
                className="w-full bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg"
              >
                Get All-Access
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search papers and test series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 pr-4 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Showing {activeTab === 'papers' ? filteredPapers.length : filteredTestSeries.length} results for "{searchQuery}"
              </p>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <button
              onClick={() => setActiveTab('papers')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'papers'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Papers ({filteredPapers.length})
            </button>
            <button
              onClick={() => setActiveTab('test-series')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'test-series'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Test Series ({filteredTestSeries.length})
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'papers' ? (
            filteredPapers.length > 0 ? (
              filteredPapers.map((paper) => {
                const isSubscribed = hasPaperSubscription(paper._id);
                return (
                  <div
                    key={paper._id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-200 group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {paper.title}
                      </h3>
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full ml-2">
                        {paper.subject}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      Added on {formatDate(paper.createdAt)}
                    </p>
                    <div className="mb-4">
                      <SubscriptionStatus type="paper" itemId={paper._id} />
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatPrice(paper.price)}
                      </div>
                      {isSubscribed ? (
                        <Button
                          onClick={() => handleAttemptNow(paper._id)}
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg group-hover:scale-105 transition-transform duration-200"
                        >
                          Attempt Now
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleBuyNow('single-paper', paper._id, paper)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg group-hover:scale-105 transition-transform duration-200"
                        >
                          Buy Now
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">
                  {searchQuery ? 'No papers found matching your search.' : 'No papers available at the moment.'}
                </p>
              </div>
            )
          ) : (
            filteredTestSeries.length > 0 ? (
              filteredTestSeries.map((series) => {
                const isSubscribed = hasTestSeriesSubscription(series._id);
                return (
                  <div
                    key={series._id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-200 group"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {series.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {series.description || 'No description available'}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {series.papersCount} Papers
                      </span>
                      <span className="ml-2">
                        Added on {formatDate(series.createdAt)}
                      </span>
                    </div>
                    <div className="mb-4">
                      <SubscriptionStatus type="test-series" itemId={series._id} />
                    </div>
                    {isSubscribed ? (
                      <>
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                          <div className="text-2xl font-bold text-blue-700">
                            {formatPrice(series.price)}
                          </div>
                          <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Subscribed
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button
                            onClick={() => handleExpandSeries(series._id)}
                            variant="outline"
                            className="w-full text-sm bg-white/50 hover:bg-white border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800"
                            disabled={loadingSeriesDetails}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {loadingSeriesDetails ? 'Loading...' : expandedSeries === series._id ? 'Hide' : 'View'} Papers
                          </Button>
                          {expandedSeries === series._id && (
                            <div className="mt-4 space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                              {(() => {
                                const seriesWithPapers = testSeriesWithPapers.find(s => s._id === series._id);
                                const papersToShow = seriesWithPapers?.papers || [];
                                if (papersToShow.length === 0) {
                                  return (
                                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                                      <span>No papers available in this test series</span>
                                    </div>
                                  );
                                }
                                return papersToShow.map((paper: any) => {
                                  const attemptStatus = getAttemptStatus(paper._id);
                                  return (
                                    <div key={paper._id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                      <div className="flex flex-col md:flex-row md:items-center gap-2 flex-1">
                                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-1 flex-1">
                                          {paper.title}
                                        </h4>
                                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full whitespace-nowrap">
                                          {paper.subject}
                                        </span>
                                        <span className="text-xs ml-2">
                                          {attemptStatus.status === 'not-attempted' ? (
                                            <span className="text-gray-500 flex items-center">Not Attempted</span>
                                          ) : attemptStatus.status === 'in-progress' ? (
                                            <span className="text-blue-600 flex items-center">In Progress</span>
                                          ) : (
                                            <span className="text-green-600 flex items-center">Score: {attemptStatus.score}</span>
                                          )}
                                        </span>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          const attemptForPaper = getAttemptForPaper(paper._id);
                                          if (attemptStatus.status === 'not-attempted') {
                                            router.push(`/subscriptions/attempts/attempt-paper?paperId=${paper._id}`);
                                          } else if (attemptStatus.status === 'in-progress') {
                                            router.push(`/subscriptions/attempts/attempt-paper?attemptId=${attemptForPaper?._id}`);
                                          } else {
                                            router.push(`/subscriptions/attempts/attempt-reviews?attemptId=${attemptForPaper?._id}`);
                                          }
                                        }}
                                        className="text-xs px-3 py-1.5 h-7 bg-white hover:bg-blue-50 border-blue-200 hover:border-blue-300 text-blue-700 ml-auto"
                                      >
                                        {attemptStatus.status === 'not-attempted' ? 'Start' : 
                                         attemptStatus.status === 'in-progress' ? 'Resume' : 'View'}
                                      </Button>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                        <div className="text-2xl font-bold text-blue-700">
                          {formatPrice(series.price)}
                        </div>
                        <Button
                          onClick={() => handleBuyNow('test-series', series._id, series)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg group-hover:scale-105 transition-transform duration-200"
                        >
                          Buy Now
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">
                  {searchQuery ? 'No test series found matching your search.' : 'No test series available at the moment.'}
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModal.isOpen && (
        <PaymentModal
          isOpen={paymentModal.isOpen}
          onClose={() => setPaymentModal({ isOpen: false, data: null })}
          onPaymentSuccess={refetchSubscriptions}
          paymentData={paymentModal.data}
        />
      )}
    </div>
  );
}
