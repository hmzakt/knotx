"use client";
import { useState, useEffect } from 'react';
import apiClient from '../lib/api';

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
  papersCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

interface UseContentReturn {
  papers: Paper[];
  testSeries: TestSeries[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useContent = (): UseContentReturn => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [testSeries, setTestSeries] = useState<TestSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPapers = async () => {
    try {
      const response = await apiClient.get<ApiResponse<Paper[]>>('/public/papers');
      setPapers(response.data.data);
    } catch (err: any) {
      console.error('Error fetching papers:', err);
      throw new Error('Failed to fetch papers');
    }
  };

  const fetchTestSeries = async () => {
    try {
      const response = await apiClient.get<ApiResponse<TestSeries[]>>('/public/test-series');
      setTestSeries(response.data.data);
    } catch (err: any) {
      console.error('Error fetching test series:', err);
      throw new Error('Failed to fetch test series');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchPapers(), fetchTestSeries()]);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    papers,
    testSeries,
    loading,
    error,
    refetch: fetchData,
  };
};
