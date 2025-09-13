"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useContent } from '@/hooks/useContent';
import { useAttempts } from '@/hooks/useAttempts';
import apiClient from '@/lib/api';
import { CheckCircle, Clock, Play, Eye, Trophy, Star } from 'lucide-react';
import SubscriptionDebug from '@/components/SubscriptionDebug';

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

type TabType = 'papers' | 'test-series';

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('papers');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);
  const [testSeriesWithPapers, setTestSeriesWithPapers] = useState<TestSeries[]>([]);
  const [loadingSeriesDetails, setLoadingSeriesDetails] = useState(false);
  
  const router = useRouter();
  const { user } = useAuth();
  const { subscriptions, loading: loadingSubscriptions, error: subscriptionError, initialized } = useSubscription();
  const { papers, testSeries, loading: loadingContent, error: contentError } = useContent();
  const { attempts, loading: loadingAttempts, getAttemptStatus, getAttemptForPaper } = useAttempts();

  // Fetch test series with papers when needed
  const fetchTestSeriesWithPapers = async (seriesId: string) => {
    try {
      setLoadingSeriesDetails(true);
      const response = await apiClient.get<ApiResponse<TestSeries>>(`/private/test-series/${seriesId}`);
      return response.data.data;
    } catch (err: any) {
      console.error('Error fetching test series details:', err);
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

    // Check if we already have the papers for this series
    const existingSeries = testSeriesWithPapers.find(s => s._id === seriesId);
    if (existingSeries) {
      setExpandedSeries(seriesId);
      return;
    }

    // Fetch the series details
    const seriesDetails = await fetchTestSeriesWithPapers(seriesId);
    if (seriesDetails) {
      setTestSeriesWithPapers(prev => [...prev, seriesDetails]);
      setExpandedSeries(seriesId);
    }
  };

  const handleBuyNow = (type: 'paper' | 'test-series' | 'all-access', itemId?: string) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    
    console.log('Buy now clicked:', { type, itemId });
    alert(`Buy ${type} functionality will be implemented soon!`);
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

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };


  // Filter content based on search and subscription status
  const getFilteredPapers = () => {
    console.log('getFilteredPapers - subscriptions:', subscriptions);
    if (!subscriptions) return [];
    
    let availablePapers: Paper[] = [];
    
    // If user has all-access, show all papers
    if (subscriptions.hasAllAccess) {
      console.log('User has all-access, showing all papers');
      availablePapers = papers;
    } else {
      console.log('User does not have all-access, filtering papers');
      // Show only subscribed papers
      const subscribedPaperIds = subscriptions.subscriptions.singlePapers.map((sub: any) => 
        sub.itemId && typeof sub.itemId === 'object' ? sub.itemId._id : null
      ).filter(Boolean);
      
      availablePapers = papers.filter(paper => subscribedPaperIds.includes(paper._id));
    }

    return availablePapers.filter(paper =>
      paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredTestSeries = () => {
    if (!subscriptions) return [];
    
    let availableSeries: TestSeries[] = [];
    
    // If user has all-access, show all test series
    if (subscriptions.hasAllAccess) {
      availableSeries = testSeries;
    } else {
      // Show only subscribed test series
      const subscribedSeriesIds = subscriptions.subscriptions.testSeries.map((sub: any) => 
        sub.itemId && typeof sub.itemId === 'object' ? sub.itemId._id : null
      ).filter(Boolean);
      
      availableSeries = testSeries.filter(series => subscribedSeriesIds.includes(series._id));
    }

    return availableSeries.filter(series =>
      series.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      series.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredPapers = getFilteredPapers();
  const filteredTestSeries = getFilteredTestSeries();

  if (loadingSubscriptions || !initialized || loadingContent || loadingAttempts) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (subscriptionError || contentError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{subscriptionError || contentError}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!subscriptions || !subscriptions.hasAnySubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Subscriptions</h2>
            <p className="text-gray-600 mb-6">
              You don't have any active subscriptions yet. Explore our content and subscribe to get started!
            </p>
            <Button 
              onClick={() => window.location.href = '/explore'}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Explore Content
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">

      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600"></div>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold mb-4 text-white drop-shadow-lg">
                My Subscriptions
              </h1>
              <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                Access your subscribed content and track your learning progress
              </p>
              
              {/* All-Access Special Message */}
              {subscriptions?.hasAllAccess && (
                <div className="bg-white/15 backdrop-blur-md rounded-3xl p-8 max-w-3xl mx-auto border border-white/30 shadow-2xl">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mr-4">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-white">All-Access Active</h3>
                  </div>
                  <p className="text-lg text-white/90 leading-relaxed">
                    🎉 Congratulations! You have unlimited access to all papers and test series. 
                    Explore everything we have to offer and maximize your learning potential.
                  </p>
                  <div className="mt-4 flex items-center justify-center space-x-2 text-yellow-200">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/5 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Search and Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Bar */}
        <div className="mb-12">
          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search your subscribed content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 pl-14 pr-12 text-gray-700 bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 shadow-lg"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-5">
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {searchQuery && (
              <div className="mt-4 text-center">
                <span className="inline-flex items-center px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-sm text-gray-600 shadow-sm">
                  <svg className="w-4 h-4 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Showing {activeTab === 'papers' ? filteredPapers.length : filteredTestSeries.length} results for "{searchQuery}"
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-xl border border-white/50">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('papers')}
                className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                  activeTab === 'papers'
                    ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Papers</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === 'papers' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {filteredPapers.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('test-series')}
                className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                  activeTab === 'test-series'
                    ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Test Series</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === 'test-series' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  {filteredTestSeries.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeTab === 'papers' ? (
            filteredPapers.length > 0 ? (
              filteredPapers.map((paper) => {
                const attemptStatus = getAttemptStatus(paper._id);
                return (
                  <div
                    key={paper._id}
                    className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8 hover:shadow-2xl hover:border-emerald-200 transition-all duration-300 transform hover:-translate-y-2"
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                          {paper.title}
                        </h3>
                        <span className="bg-gradient-to-r from-emerald-100 to-blue-100 text-emerald-700 text-sm font-semibold px-3 py-1.5 rounded-full ml-3 whitespace-nowrap">
                          {paper.subject}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500 mb-6">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Added on {formatDate(paper.createdAt)}
                      </div>
                      
                      {/* Attempt Status */}
                      <div className="mb-6">
                        {attemptStatus.status === 'not-attempted' ? (
                          <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">
                            <Clock className="w-5 h-5 mr-3 text-gray-500" />
                            <span className="font-medium">Ready to Start</span>
                          </div>
                        ) : attemptStatus.status === 'in-progress' ? (
                          <div className="flex items-center text-sm text-blue-700 bg-blue-50 px-4 py-3 rounded-xl border border-blue-200">
                            <Play className="w-5 h-5 mr-3 text-blue-500" />
                            <span className="font-medium">In Progress</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-sm text-green-700 bg-green-50 px-4 py-3 rounded-xl border border-green-200">
                            <CheckCircle className="w-5 h-5 mr-3 text-green-500" />
                            <span className="font-medium">Completed - Score: {attemptStatus.score}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                          {formatPrice(paper.price)}
                        </div>
                        <Button
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
                          className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        >
                          {attemptStatus.status === 'not-attempted' ? (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Start
                            </>
                          ) : attemptStatus.status === 'in-progress' ? (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Resume
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              View Results
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-20">
                <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 max-w-md mx-auto shadow-lg border border-white/50">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchQuery ? 'No papers found' : 'No subscribed papers'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery 
                      ? `No papers match your search for "${searchQuery}"` 
                      : 'You don\'t have any paper subscriptions yet'
                    }
                  </p>
                  {!searchQuery && (
                    <Button 
                      onClick={() => window.location.href = '/explore'}
                      className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white"
                    >
                      Explore Papers
                    </Button>
                  )}
                </div>
              </div>
            )
          ) : (
            filteredTestSeries.length > 0 ? (
              filteredTestSeries.map((series) => (
                <div
                  key={series._id}
                  className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8 hover:shadow-2xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-2"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-700 transition-colors">
                      {series.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-6 line-clamp-3 leading-relaxed">
                      {series.description || 'No description available'}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-3 py-1.5 rounded-full font-semibold">
                          {series.papersCount || series.papers?.length || 0} Papers
                        </span>
                      </div>
                      <div className="flex items-center text-gray-400">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(series.createdAt)}
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <Button
                        onClick={() => handleExpandSeries(series._id)}
                        variant="outline"
                        className="w-full text-sm bg-white/50 hover:bg-white border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800"
                        disabled={loadingSeriesDetails}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {loadingSeriesDetails ? 'Loading...' : 
                         expandedSeries === series._id ? 'Hide' : 'View'} Papers
                      </Button>
                    </div>
                  
                    {/* Expanded Papers List */}
                    {expandedSeries === series._id && (
                      <div className="mt-6 space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {(() => {
                          const seriesWithPapers = testSeriesWithPapers.find(s => s._id === series._id);
                          const papersToShow = seriesWithPapers?.papers || [];
                          
                          if (papersToShow.length === 0) {
                            return (
                              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                                <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-sm">No papers available in this test series</p>
                              </div>
                            );
                          }
                          
                          return papersToShow.map((paper) => {
                            const attemptStatus = getAttemptStatus(paper._id);
                            return (
                              <div key={paper._id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                  <h4 className="text-sm font-semibold text-gray-900 line-clamp-1 flex-1">
                                    {paper.title}
                                  </h4>
                                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full ml-2 whitespace-nowrap">
                                    {paper.subject}
                                  </span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center text-xs">
                                    {attemptStatus.status === 'not-attempted' ? (
                                      <span className="text-gray-500 flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        Not Attempted
                                      </span>
                                    ) : attemptStatus.status === 'in-progress' ? (
                                      <span className="text-blue-600 flex items-center">
                                        <Play className="w-3 h-3 mr-1" />
                                        In Progress
                                      </span>
                                    ) : (
                                      <span className="text-green-600 flex items-center">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Score: {attemptStatus.score}
                                      </span>
                                    )}
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
                                    className="text-xs px-3 py-1.5 h-7 bg-white hover:bg-blue-50 border-blue-200 hover:border-blue-300 text-blue-700"
                                  >
                                    {attemptStatus.status === 'not-attempted' ? 'Start' : 
                                     attemptStatus.status === 'in-progress' ? 'Resume' : 'View'}
                                  </Button>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {formatPrice(series.price)}
                      </div>
                      <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Subscribed
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20">
                <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 max-w-md mx-auto shadow-lg border border-white/50">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchQuery ? 'No test series found' : 'No subscribed test series'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery 
                      ? `No test series match your search for "${searchQuery}"` 
                      : 'You don\'t have any test series subscriptions yet'
                    }
                  </p>
                  {!searchQuery && (
                    <Button 
                      onClick={() => window.location.href = '/explore'}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                    >
                      Explore Test Series
                    </Button>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
