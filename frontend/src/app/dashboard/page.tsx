"use client";
import { useAuth } from '../../contexts/AuthContext';
import { useUserSubscriptions } from '../../hooks/useUserSubscriptions';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { user } = useAuth();
  const { subscriptions, loading: subscriptionLoading, error: subscriptionError, refetch } = useUserSubscriptions();

  const formatPrice = (price: number) => {
    return `₹${price}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="lg" />
          <span className="text-white text-xl">Loading...</span>
        </div>
      </div>
    );
  }

  if (subscriptionError) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">Error loading subscriptions</p>
          <p className="text-zinc-400">{subscriptionError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-zinc-400">Welcome back, {user?.fullname}</p>
        </div>

        {/* User Info Card */}
        <div className="bg-zinc-900 rounded-lg p-6 mb-8 border border-zinc-800">
          <h2 className="text-2xl font-semibold mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-400 text-sm">Full Name</label>
              <p className="text-white text-lg">{user?.fullname}</p>
            </div>
            <div>
              <label className="text-zinc-400 text-sm">Email</label>
              <p className="text-white text-lg">{user?.email}</p>
            </div>
            <div>
              <label className="text-zinc-400 text-sm">Username</label>
              <p className="text-white text-lg">@{user?.username}</p>
            </div>
            <div>
              <label className="text-zinc-400 text-sm">Role</label>
              <p className="text-white text-lg capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
        {user?.role === 'admin' ? <Link href = "dashboard/adminRoles"><Button className="flex items-center gap-2 mb-3 hover:bg-accent/50 transition-colors">Admin Controls</Button></Link>:<></>}
        {/* Subscription Status Overview */}
        <div className="bg-zinc-900 rounded-lg p-6 mb-8 border border-zinc-800">
          <h2 className="text-2xl font-semibold mb-4">Subscription Status</h2>
          
          {subscriptions?.hasAnySubscription ? (
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-green-400 text-lg font-medium">
                {subscriptions.hasAllAccess ? 'All Access Active' : 'Active Subscriptions'}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-red-400 text-lg font-medium">No Active Subscriptions</span>
            </div>
          )}
        </div>

        {/* All Access Subscriptions */}
        {subscriptions?.subscriptions?.allAccess && subscriptions.subscriptions.allAccess.length > 0 && (
          <div className="bg-zinc-900 rounded-lg p-6 mb-8 border border-zinc-800">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
              All Access Subscriptions
            </h2>
            <div className="space-y-3">
              {subscriptions.subscriptions.allAccess.map((subscription) => (
                <div key={subscription._id} className="p-4 bg-zinc-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-400">All Access Plan</p>
                      <p className="text-sm text-zinc-400">
                        Valid until {formatDate(subscription.endDate)}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-sm font-medium">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Single Paper Subscriptions */}
        {subscriptions?.subscriptions?.singlePapers && subscriptions.subscriptions.singlePapers.length > 0 && (
          <div className="bg-zinc-900 rounded-lg p-6 mb-8 border border-zinc-800">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
              Individual Papers ({subscriptions.subscriptions.singlePapers.length})
            </h2>
            <div className="space-y-3">
              {subscriptions.subscriptions.singlePapers.map((subscription) => {
                const paper = subscription.itemId as any;
                return (
                  <div key={subscription._id} className="p-4 bg-zinc-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{paper?.title || 'Paper'}</p>
                        <p className="text-sm text-zinc-400">
                          {paper?.subject && `${paper.subject} • `}
                          {paper?.price && `${formatPrice(paper.price)} • `}
                          Valid until {formatDate(subscription.endDate)}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-sm font-medium">
                        Active
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Test Series Subscriptions */}
        {subscriptions?.subscriptions?.testSeries && subscriptions.subscriptions.testSeries.length > 0 && (
          <div className="bg-zinc-900 rounded-lg p-6 mb-8 border border-zinc-800">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <span className="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
              Test Series ({subscriptions.subscriptions.testSeries.length})
            </h2>
            <div className="space-y-3">
              {subscriptions.subscriptions.testSeries.map((subscription) => {
                const testSeries = subscription.itemId as any;
                return (
                  <div key={subscription._id} className="p-4 bg-zinc-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{testSeries?.title || 'Test Series'}</p>
                        <p className="text-sm text-zinc-400">
                          {testSeries?.description && `${testSeries.description} • `}
                          {testSeries?.price && `${formatPrice(testSeries.price)} • `}
                          {testSeries?.papers && `${testSeries.papers.length} papers • `}
                          Valid until {formatDate(subscription.endDate)}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-purple-900/30 text-purple-400 rounded-full text-sm font-medium">
                        Active
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Subscriptions Message */}
        {subscriptions && !subscriptions.hasAnySubscription && (
          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 text-center">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Active Subscriptions</h3>
            <p className="text-zinc-400 mb-6">
              You don't have any active subscriptions. Purchase papers or test series to get started.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
              Browse Content
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
