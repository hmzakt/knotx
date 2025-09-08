"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';
import { useContent } from '@/hooks/useContent';
import { useAttempts } from '@/hooks/useAttempts';
import apiClient from '@/lib/api';
import { CheckCircle, Clock, Play, Eye, Trophy, Star } from 'lucide-react';

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
  
  const { user } = useAuth();
  const { subscriptions, loading: loadingSubscriptions, error: subscriptionError } = useUserSubscriptions();
  const { papers, testSeries, loading: loadingContent, error: contentError } = useContent();
  const { attempts, loading: loadingAttempts, getAttemptStatus } = useAttempts();

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
    if (!subscriptions) return [];
    
    let availablePapers: Paper[] = [];
    
    // If user has all-access, show all papers
    if (subscriptions.hasAllAccess) {
      availablePapers = papers;
    } else {
      // Show only subscribed papers
      const subscribedPaperIds = subscriptions.subscriptions.singlePapers.map(sub => 
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
      const subscribedSeriesIds = subscriptions.subscriptions.testSeries.map(sub => 
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

  if (loadingSubscriptions || loadingContent || loadingAttempts) {
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

  if (!subscriptions || (!subscriptions.hasAnySubscription && !subscriptions.hasAllAccess)) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">My Subscriptions</h1>
            <p className="text-xl mb-6">Access your subscribed content and track your progress</p>
            
            {/* All-Access Special Message */}
            {subscriptions?.hasAllAccess && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto border border-white/20">
                <div className="flex items-center justify-center mb-3">
                  <Star className="w-8 h-8 text-yellow-300 mr-2" />
                  <h3 className="text-2xl font-bold">All-Access Active</h3>
                </div>
                <p className="text-lg">
                  You have unlimited access to all papers and test series! 
                  Explore everything we have to offer.
                </p>
              </div>
            )}
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
                placeholder="Search your subscribed content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 pr-4 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Papers ({filteredPapers.length})
            </button>
            <button
              onClick={() => setActiveTab('test-series')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'test-series'
                  ? 'bg-green-600 text-white shadow-sm'
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
                const attemptStatus = getAttemptStatus(paper._id);
                return (
                  <div
                    key={paper._id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-green-200 transition-all duration-200 group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {paper.title}
                      </h3>
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full ml-2">
                        {paper.subject}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-4">
                      Added on {formatDate(paper.createdAt)}
                    </p>
                    
                    {/* Attempt Status */}
                    <div className="mb-4">
                      {attemptStatus.status === 'not-attempted' ? (
                        <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                          <Clock className="w-4 h-4 mr-2" />
                          Not Attempted
                        </div>
                      ) : attemptStatus.status === 'in-progress' ? (
                        <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                          <Play className="w-4 h-4 mr-2" />
                          In Progress
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Completed - Score: {attemptStatus.score}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatPrice(paper.price)}
                      </div>
                      <Button
                        onClick={() => {
                          if (attemptStatus.status === 'not-attempted') {
                            // Start new attempt
                            window.location.href = `/attempt/${paper._id}`;
                          } else if (attemptStatus.status === 'in-progress') {
                            // Resume attempt
                            window.location.href = `/attempt/${paper._id}`;
                          } else {
                            // View results
                            window.location.href = `/results/${paper._id}`;
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg group-hover:scale-105 transition-transform duration-200"
                      >
                        {attemptStatus.status === 'not-attempted' ? 'Start' : 
                         attemptStatus.status === 'in-progress' ? 'Resume' : 'View Results'}
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">
                  {searchQuery ? 'No papers found matching your search.' : 'No subscribed papers available.'}
                </p>
              </div>
            )
          ) : (
            filteredTestSeries.length > 0 ? (
              filteredTestSeries.map((series) => (
                <div
                  key={series._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-green-200 transition-all duration-200 group"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {series.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {series.description || 'No description available'}
                  </p>
                  
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {series.papersCount || series.papers?.length || 0} Papers
                    </span>
                    <span className="ml-2">
                      Added on {formatDate(series.createdAt)}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <Button
                      onClick={() => handleExpandSeries(series._id)}
                      variant="outline"
                      className="w-full text-sm"
                      disabled={loadingSeriesDetails}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {loadingSeriesDetails ? 'Loading...' : 
                       expandedSeries === series._id ? 'Hide' : 'View'} Papers
                    </Button>
                  </div>
                  
                  {/* Expanded Papers List */}
                  {expandedSeries === series._id && (
                    <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                      {(() => {
                        const seriesWithPapers = testSeriesWithPapers.find(s => s._id === series._id);
                        const papersToShow = seriesWithPapers?.papers || [];
                        
                        if (papersToShow.length === 0) {
                          return (
                            <div className="text-center py-4 text-gray-500">
                              No papers available in this test series.
                            </div>
                          );
                        }
                        
                        return papersToShow.map((paper) => {
                          const attemptStatus = getAttemptStatus(paper._id);
                          return (
                            <div key={paper._id} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                                  {paper.title}
                                </h4>
                                <span className="text-xs text-gray-500 ml-2">
                                  {paper.subject}
                                </span>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <div className="flex items-center text-xs">
                                  {attemptStatus.status === 'not-attempted' ? (
                                    <span className="text-gray-500">Not Attempted</span>
                                  ) : attemptStatus.status === 'in-progress' ? (
                                    <span className="text-blue-600">In Progress</span>
                                  ) : (
                                    <span className="text-green-600">Score: {attemptStatus.score}</span>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (attemptStatus.status === 'not-attempted') {
                                      window.location.href = `/attempt/${paper._id}`;
                                    } else if (attemptStatus.status === 'in-progress') {
                                      window.location.href = `/attempt/${paper._id}`;
                                    } else {
                                      window.location.href = `/results/${paper._id}`;
                                    }
                                  }}
                                  className="text-xs px-2 py-1 h-6"
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
                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(series.price)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Subscribed
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">
                  {searchQuery ? 'No test series found matching your search.' : 'No subscribed test series available.'}
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
