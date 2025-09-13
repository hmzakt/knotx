"use client";

import { useSubscription } from '@/contexts/SubscriptionContext';
import { CheckCircle, XCircle } from 'lucide-react';
import { getToken } from '@/lib/auth';

interface SubscriptionStatusProps {
  type: 'paper' | 'test-series' | 'all-access';
  itemId?: string;
}

export default function SubscriptionStatus({ type, itemId }: SubscriptionStatusProps) {
  const { subscriptions, loading, initialized } = useSubscription();
  const hasToken = typeof window !== 'undefined' ? Boolean(getToken()) : false;

  // Debug logging
  console.log('SubscriptionStatus - loading:', loading, 'initialized:', initialized, 'subscriptions:', subscriptions, 'hasToken:', hasToken);

  if (loading || !initialized) {
    return (
      <div className="flex items-center text-sm text-gray-500">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
        Checking status...
      </div>
    );
  }

  // If no token or no subscriptions data, treat as not subscribed
  if (!hasToken || !subscriptions) {
    return (
      <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
        <XCircle className="w-4 h-4 mr-1" />
        Not Subscribed
      </div>
    );
  }

  const { hasAllAccess, subscriptions: userSubs } = subscriptions;
  console.log('SubscriptionStatus - hasAllAccess:', hasAllAccess, 'userSubs:', userSubs);

  if (hasAllAccess) {
    return (
      <div className="flex items-center text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
        <CheckCircle className="w-4 h-4 mr-1" />
        All-Access Active
      </div>
    );
  }

  // Check specific subscription based on type
  let hasSubscription = false;
  if (type === 'paper' && itemId) {
    hasSubscription = userSubs.singlePapers.some((sub: any) =>
      sub.itemId && typeof sub.itemId === 'object' && (sub.itemId as any)._id === itemId
    );
  } else if (type === 'test-series' && itemId) {
    hasSubscription = userSubs.testSeries.some((sub: any) =>
      sub.itemId && typeof sub.itemId === 'object' && (sub.itemId as any)._id === itemId
    );
  }

  if (hasSubscription) {
    return (
      <div className="flex items-center text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
        <CheckCircle className="w-4 h-4 mr-1" />
        Subscribed
      </div>
    );
  }

  return (
    <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
      <XCircle className="w-4 h-4 mr-1" />
      Not Subscribed
    </div>
  );
}
