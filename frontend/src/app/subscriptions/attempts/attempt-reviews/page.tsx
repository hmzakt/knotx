"use client";
import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import apiClient from '@/lib/api';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  BarChart3, 
  CheckCircle, 
  XCircle,
  RotateCcw,
  ArrowLeft,
  Star,
  Zap,
  Brain,
  BookOpen,
  Clock,
  Calendar,
  Eye,
  EyeOff,
  Sun,
  Moon
} from 'lucide-react';

interface ReviewBreakdown {
  score: number;
  total: number;
  message?: string;
  difficulty?: Record<string, {correct:number, total:number}>;
  domain?: Record<string, {correct:number, total:number}>;
  paperTitle?: string;
  subject?: string;
  submittedAt?: string;
  duration?: number;
}

type AttemptListItem = {
  _id: string;
  paperId: string;
  score: number;
  status: 'in-progress' | 'submitted';
  startedAt?: string;
  submittedAt?: string;
  totalQuestions?: number;
  durationSec?: number;
};

function AttemptReviewPageInner() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attemptId') || undefined;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReviewBreakdown | null>(null);
  const [currentPaperId, setCurrentPaperId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<AttemptListItem[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [latestAttemptId, setLatestAttemptId] = useState<string | null>(null);
  const [showPrevious, setShowPrevious] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (!attemptId) return;
    fetchReview(attemptId);
  }, [attemptId]);

  const fetchReview = async (id: string) => {
    try {
      setLoading(true);
      let res;
      try {
        res = await apiClient.get(`/attempts/${id}`);
      } catch (err: any) {
        throw new Error(err?.response?.data?.message || err.message || 'Failed to fetch review');
      }
      const json = res.data;
      const payload = json?.data || json;
      setData({
        score: payload.score ?? payload.totalScore ?? 0,
        total: payload.totalQuestions ?? payload.total ?? 0,
        message: payload.message,
        difficulty: payload.difficultyBreakdown,
        domain: payload.domainBreakdown,
        paperTitle: payload.paperTitle || payload.paper?.title,
        subject: payload.subject || payload.paper?.subject,
        submittedAt: payload.submittedAt,
        duration: payload.duration
      });
      const pid = payload.paperId || payload.paper?._id || null;
      if (pid) {
        setCurrentPaperId(pid);
        // Load attempts for this paper to support previous attempts view
        fetchAttemptsForPaper(pid);
      }
    } catch (err) {
      console.error(err);
      alert('Could not load review');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttemptsForPaper = async (paperId: string) => {
    try {
      setAttemptsLoading(true);
      const res = await apiClient.get('/attempts');
      const items: AttemptListItem[] = res?.data?.data || res?.data || [];
      const filtered = items
        .filter(a => String(a.paperId) === String(paperId) && a.status === 'submitted')
        .sort((a, b) => {
          const ad = new Date(a.submittedAt || a.startedAt || 0).getTime();
          const bd = new Date(b.submittedAt || b.startedAt || 0).getTime();
          return bd - ad; // newest first
        });
      setAttempts(filtered);
      setLatestAttemptId(filtered[0]?._id || null);
    } catch (err) {
      console.error('Failed to load attempts list', err);
    } finally {
      setAttemptsLoading(false);
    }
  };

  const handleReattempt = async () => {
    try {
      setLoading(true);
      // 1) Fetch the original attempt to get its paperId
      const attemptRes = await apiClient.get(`/attempts/${attemptId}`);
      const attemptPayload = attemptRes?.data?.data || attemptRes?.data || null;
      const paperId = attemptPayload?.paperId || attemptPayload?.paper?._id;
      if (!paperId) {
        alert('Cannot determine paper for this attempt');
        return;
      }

      // 2) Try to start a fresh attempt
      try {
        // Hand over the previous attempt id so backend can link attempts
        const startRes = await apiClient.post(`/attempts/start/${paperId}`, {
          meta: { previousAttemptId: attemptId }
        });
        const startPayload = startRes.data?.data || startRes.data;
        const newAttemptId = startPayload.attemptId || startPayload._id || null;
        if (!newAttemptId) throw new Error('Failed to obtain new attempt id');
        router.push(`/subscriptions/attempts/attempt-paper?attemptId=${newAttemptId}`);
        return;
      } catch (err: any) {
        const status = err?.response?.status;
        const msg = err?.response?.data?.message || err.message;
        // If an in-progress attempt already exists, resume it
        if (status === 409) {
          try {
            const list = await apiClient.get('/attempts');
            const items = list?.data?.data || list?.data || [];
            const existing = items.find((a: any) => a.paperId === paperId && a.status === 'in-progress');
            if (existing?._id) {
              router.push(`/subscriptions/attempts/attempt-paper?attemptId=${existing._id}`);
              return;
            }
            // No existing found even though server says conflict
            alert(msg || 'You already have an ongoing attempt for this paper.');
            return;
          } catch (listErr) {
            console.error('Failed to list attempts after 409:', listErr);
            alert(msg || 'You already have an ongoing attempt for this paper.');
            return;
          }
        }
        if (status === 401) {
          alert('Please login again to reattempt.');
          router.push('/login');
          return;
        }
        if (status === 403) {
          alert('Your subscription does not include this paper.');
          router.push('/subscriptions');
          return;
        }
        throw new Error(msg || 'Failed to start reattempt');
      }
    } catch (err: any) {
      console.error(err);
      alert('Could not start reattempt: ' + (err?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getPerformanceMessage = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return { message: "Outstanding! You've mastered this content!", icon: Star, color: "text-yellow-600" };
    if (percentage >= 80) return { message: "Excellent work! You're doing great!", icon: Trophy, color: "text-green-600" };
    if (percentage >= 70) return { message: "Good job! Keep up the practice!", icon: Target, color: "text-blue-600" };
    if (percentage >= 60) return { message: "Not bad! Review the topics and try again.", icon: TrendingUp, color: "text-orange-600" };
    return { message: "Keep practicing! You'll improve with more attempts.", icon: Zap, color: "text-red-600" };
  };

  const formatDateTime = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  const viewAttempt = async (id: string) => {
    // Update URL to reflect chosen attempt and fetch its review
    router.push(`/subscriptions/attempts/attempt-reviews?attemptId=${id}`);
    await fetchReview(id);
    // collapse the list after switching
    setShowPrevious(false);
  };

  if (!attemptId) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className={`w-16 h-16 ${isDarkMode ? 'bg-red-900' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <XCircle className={`w-8 h-8 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
          </div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>No Attempt Specified</h2>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>Please provide a valid attempt ID to view the review.</p>
          <Button onClick={() => router.push('/subscriptions')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Back to Subscriptions
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className={`mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading your results...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className={`w-16 h-16 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <BarChart3 className={`w-8 h-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
          </div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>No Data Available</h2>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>Unable to load the review data for this attempt.</p>
          <Button onClick={() => router.push('/subscriptions')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Back to Subscriptions
          </Button>
        </div>
      </div>
    );
  }

  const percentage = Math.round((data.score / data.total) * 100);
  const performance = getPerformanceMessage(data.score, data.total);
  const PerformanceIcon = performance.icon;
  const isLatest = latestAttemptId ? latestAttemptId === attemptId : true;
  const previousAttempts = attempts.filter(a => a._id !== attemptId);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/subscriptions')}
                variant="outline"
                className={`flex items-center space-x-2 ${isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Subscriptions</span>
              </Button>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <Trophy className="w-5 h-5 inline mr-2" />
                Attempt Review
              </div>
            </div>
            
            {/* Dark Mode Toggle */}
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setIsDarkMode(!isDarkMode)}
                variant="outline"
                size="sm"
                className={`${isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              {data.paperTitle || 'Attempt Review'}
            </h1>
            {data.subject && (
              <div className={`inline-flex items-center px-3 py-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {data.subject}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Attempt Context Bar */}
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-lg border p-6 mb-8`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {isLatest ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                  Showing latest attempt
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                  Viewing an older attempt
                </span>
              )}
              {data.submittedAt && (
                <span className={`ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Submitted {formatDateTime(data.submittedAt)}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              {!isLatest && latestAttemptId && (
                <Button
                  onClick={() => viewAttempt(latestAttemptId)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Show Latest
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowPrevious(prev => !prev)}
                disabled={attemptsLoading || previousAttempts.length === 0}
                className={`${isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {attemptsLoading
                  ? 'Loading…'
                  : previousAttempts.length === 0
                    ? 'No Previous Attempts'
                    : (showPrevious ? <><EyeOff className="w-4 h-4 mr-2" />Hide Previous</> : <><Eye className="w-4 h-4 mr-2" />View Previous</>)}
              </Button>
            </div>
          </div>
        </div>

        {/* Previous Attempts List */}
        {showPrevious && previousAttempts.length > 0 && (
          <div className={`mb-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-lg border p-6`}>
            <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Previous Attempts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {previousAttempts.map(a => {
                const total = a.totalQuestions ?? data.total;
                const pct = total > 0 ? Math.round((a.score / total) * 100) : 0;
                return (
                  <button
                    key={a._id}
                    onClick={() => viewAttempt(a._id)}
                    className={`text-left ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:border-emerald-500' : 'bg-gray-50 border-gray-200 hover:border-emerald-300'} border rounded-xl p-4 hover:shadow transition`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          <Clock className="w-3 h-3 inline mr-1" />
                          {formatDateTime(a.submittedAt || a.startedAt)}
                        </div>
                        <div className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {a.score}/{total} ({pct}%)
                        </div>
                      </div>
                      <div className="text-emerald-600 text-sm font-medium">View →</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Score Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Main Score Card */}
          <div className="lg:col-span-2">
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-lg border p-8`}>
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${getScoreBgColor(data.score, data.total)}`}>
                  <span className={`text-4xl font-bold ${getScoreColor(data.score, data.total)}`}>
                    {percentage}%
                  </span>
                </div>
                <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  {data.score} out of {data.total}
                </h2>
                <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Questions Answered Correctly</p>
              </div>
              
              <div className="flex items-center justify-center space-x-2 mb-6">
                <PerformanceIcon className={`w-6 h-6 ${performance.color}`} />
                <p className={`text-lg font-semibold ${performance.color}`}>
                  {performance.message}
                </p>
              </div>

              {data.message && (
                <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4 text-center`}>
                  <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{data.message}</p>
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="space-y-6">
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-lg border p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Accuracy</h3>
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-emerald-600 mb-2">{percentage}%</div>
              <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>

            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-lg border p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Correct Answers</h3>
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-emerald-600 mb-2">{data.score}</div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>out of {data.total} total</p>
            </div>

            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-lg border p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Incorrect</h3>
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <div className="text-3xl font-bold text-red-500 mb-2">{data.total - data.score}</div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>questions to review</p>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Difficulty Breakdown */}
          {data.difficulty && Object.keys(data.difficulty).length > 0 && (
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-lg border p-8`}>
              <div className="flex items-center mb-6">
                <Brain className="w-6 h-6 text-emerald-600 mr-3" />
                <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Difficulty Breakdown</h3>
              </div>
              <div className="space-y-4">
                {Object.entries(data.difficulty).map(([difficulty, stats]) => {
                  const percentage = Math.round((stats.correct / stats.total) * 100);
                  return (
                    <div key={difficulty} className={`p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} capitalize`}>{difficulty}</span>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{stats.correct}/{stats.total}</span>
                      </div>
                      <div className={`w-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-2`}>
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>{percentage}% accuracy</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Domain Breakdown */}
          {data.domain && Object.keys(data.domain).length > 0 && (
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-lg border p-8`}>
              <div className="flex items-center mb-6">
                <BookOpen className="w-6 h-6 text-emerald-600 mr-3" />
                <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Domain Breakdown</h3>
              </div>
              <div className="space-y-4">
                {Object.entries(data.domain).map(([domain, stats]) => {
                  const percentage = Math.round((stats.correct / stats.total) * 100);
                  return (
                    <div key={domain} className={`p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} capitalize`}>{domain}</span>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{stats.correct}/{stats.total}</span>
                      </div>
                      <div className={`w-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-2`}>
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>{percentage}% accuracy</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.push('/subscriptions')}
            variant="outline"
            className={`font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2 ${isDarkMode 
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Subscriptions</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowPrevious(prev => !prev)}
            disabled={attemptsLoading || previousAttempts.length === 0}
            className={`px-8 py-4 rounded-xl shadow-sm hover:shadow transform hover:scale-105 transition-all duration-200 ${isDarkMode 
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {attemptsLoading
              ? 'Loading Previous Attempts…'
              : previousAttempts.length === 0
                ? 'No Previous Attempts'
                : (showPrevious ? <><EyeOff className="w-4 h-4 mr-2" />Hide Previous</> : <><Eye className="w-4 h-4 mr-2" />View Previous ({previousAttempts.length})</>)}
          </Button>

          <Button
            onClick={() => router.push(`/subscriptions/attempts/detailed-review?attemptId=${attemptId}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
          >
            <Eye className="w-5 h-5" />
            <span>View Detailed Review</span>
          </Button>

          <Button
            onClick={handleReattempt}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
          >
            <RotateCcw className="w-5 h-5" />
            <span>{loading ? 'Starting...' : 'Reattempt Paper'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AttemptReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
      <AttemptReviewPageInner />
    </Suspense>
  );
}
