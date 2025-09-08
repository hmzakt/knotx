"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SubscriptionStatus from '@/components/SubscriptionStatus';
import { useAuth } from '@/contexts/AuthContext';
import { useContent } from '@/hooks/useContent';

type TabType = 'papers' | 'test-series';

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<TabType>('papers');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { papers, testSeries, loading, error, refetch } = useContent();

  const handleBuyNow = (type: 'paper' | 'test-series' | 'all-access', itemId?: string) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }
    
    // TODO: Implement payment flow
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

  // Filter content based on search query
  const filteredPapers = papers.filter(paper =>
    paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTestSeries = testSeries.filter(series =>
    series.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    series.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              filteredPapers.map((paper) => (
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
                    <Button
                      onClick={() => handleBuyNow('paper', paper._id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg group-hover:scale-105 transition-transform duration-200"
                    >
                      Buy Now
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">
                  {searchQuery ? 'No papers found matching your search.' : 'No papers available at the moment.'}
                </p>
              </div>
            )
          ) : (
            filteredTestSeries.length > 0 ? (
              filteredTestSeries.map((series) => (
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
                  
                  <div className="flex justify-between items-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(series.price)}
                    </div>
                    <Button
                      onClick={() => handleBuyNow('test-series', series._id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg group-hover:scale-105 transition-transform duration-200"
                    >
                      Buy Now
                    </Button>
                  </div>
                </div>
              ))
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
    </div>
  );
}
