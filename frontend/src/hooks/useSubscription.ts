"use client";
import { useState, useEffect } from 'react';
import apiClient from '../lib/api';

interface Subscription {
  _id: string;
  userId: string;
  type: 'single-paper' | 'test-series' | 'all-access';
  itemId?: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired';
  createdAt: string;
  updatedAt: string;
}

interface UseSubscriptionReturn {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  hasActiveSubscription: boolean;
  refetch: () => Promise<void>;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/subscriptions/mySubscriptions');
      setSubscriptions(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch subscriptions');
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Check if user has any active subscription
  const hasActiveSubscription = subscriptions.some(sub => {
    const now = new Date();
    const endDate = new Date(sub.endDate);
    return sub.status === 'active' && endDate > now;
  });

  return {
    subscriptions,
    loading,
    error,
    hasActiveSubscription,
    refetch: fetchSubscriptions,
  };
};
