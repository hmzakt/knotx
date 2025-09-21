"use client";
import { useState, useEffect } from 'react';
import apiClient from '../lib/api';
import { getToken } from '../lib/auth';

interface Attempt {
  _id: string;
  paperId: string;
  score: number;
  status: 'in-progress' | 'submitted';
  startedAt: string;
  submittedAt?: string;
  totalQuestions: number;
  durationSec?: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

interface UseAttemptsReturn {
  attempts: Attempt[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getAttemptForPaper: (paperId: string) => Attempt | undefined;
  getAttemptStatus: (paperId: string) => {
    status: 'not-attempted' | 'in-progress' | 'submitted';
    score: number;
    duration: number;
    submittedAt?: string;
  };
}

export const useAttempts = (): UseAttemptsReturn => {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<ApiResponse<Attempt[]>>('/attempts');
      setAttempts(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch attempts');
      console.error('Error fetching attempts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Avoid calling protected endpoint when logged out
    const token = getToken();
    if (!token) {
      setLoading(false);
      setAttempts([]);
      return;
    }
    fetchAttempts();
  }, []);

  const getAttemptForPaper = (paperId: string): Attempt | undefined => {
    return attempts.find(attempt => attempt.paperId === paperId);
  };

  const getAttemptStatus = (paperId: string) => {
    const attempt = getAttemptForPaper(paperId);
    if (!attempt) {
      return {
        status: 'not-attempted' as const,
        score: 0,
        duration: 0
      };
    }
    
    return {
      status: attempt.status,
      score: attempt.score,
      duration: attempt.durationSec || 0,
      submittedAt: attempt.submittedAt
    };
  };

  return {
    attempts,
    loading,
    error,
    refetch: fetchAttempts,
    getAttemptForPaper,
    getAttemptStatus
  };
};
