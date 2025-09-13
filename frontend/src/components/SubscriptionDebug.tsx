"use client";
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getToken } from '@/lib/auth';

export default function SubscriptionDebug() {
  const { subscriptions, loading, initialized, error } = useSubscription();
  const hasToken = typeof window !== 'undefined' ? Boolean(getToken()) : false;

  return (
    <div className="fixed top-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">Subscription Debug</h3>
      <div>Loading: {loading ? 'true' : 'false'}</div>
      <div>Initialized: {initialized ? 'true' : 'false'}</div>
      <div>Has Token: {hasToken ? 'true' : 'false'}</div>
      <div>Error: {error || 'none'}</div>
      <div>Subscriptions: {subscriptions ? JSON.stringify(subscriptions, null, 2) : 'null'}</div>
    </div>
  );
}

