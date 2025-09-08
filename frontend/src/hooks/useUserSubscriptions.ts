"use client";
import { useState, useEffect } from 'react';
import apiClient from '../lib/api';
import { getToken } from '../lib/auth';

interface Paper {
  _id: string;
  title: string;
  subject: string;
  price: number;
}

interface TestSeries {
  _id: string;
  title: string;
  description: string;
  price: number;
  papers: string[];
}

interface Subscription {
  _id: string;
  type: 'single-paper' | 'test-series' | 'all-access';
  itemId?: Paper | TestSeries;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired';
  createdAt: string;
  updatedAt: string;
}

interface UserSubscriptions {
  subscriptions: {
    allAccess: Subscription[];
    singlePapers: Subscription[];
    testSeries: Subscription[];
  };
  hasAllAccess: boolean;
  hasAnySubscription: boolean;
}

interface UseUserSubscriptionsReturn {
  subscriptions: UserSubscriptions | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUserSubscriptions = (): UseUserSubscriptionsReturn => {
  const [subscriptions, setSubscriptions] = useState<UserSubscriptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        setSubscriptions(null);
        return;
      }
      const response = await apiClient.get('/users/subscriptions');
      setSubscriptions(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch user subscriptions');
      console.error('Error fetching user subscriptions:', err);
      setSubscriptions(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // React to token presence; when token changes (login/logout), refetch or clear
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'token') {
        fetchSubscriptions();
      }
    };

    // initial load
    fetchSubscriptions();

    // listen for logout/login across tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
      }
    };
  }, []);

  return {
    subscriptions,
    loading,
    error,
    refetch: fetchSubscriptions,
  };
};
