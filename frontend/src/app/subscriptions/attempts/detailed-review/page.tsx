"use client";
import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import apiClient from '@/lib/api';
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  BookOpen,
  Brain,
  Target,
  Trophy,
  Clock,
  Calendar
} from 'lucide-react';

interface Option {
  index: number;
  optionText: string;
}

interface Question {
  questionId: string;
  text: string;
  options: Option[];
  correctIndex: number;
  selectedIndex: number | null;
  explanation?: string;
  difficulty?: string;
  domain?: string;
}

interface DetailedReviewData {
  attemptId: string;
  paperTitle: string;
  subject: string;
  score: number;
  totalQuestions: number;
  submittedAt: string;
  questions: Question[];
}

function DetailedReviewPageInner() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attemptId') || undefined;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DetailedReviewData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (!attemptId) return;
    fetchDetailedReview(attemptId);
  }, [attemptId]);

  const fetchDetailedReview = async (id: string) => {
    try {
      setLoading(true);
      let res;
      try {
        res = await apiClient.get(`/attempts/${id}/detailed-review`);
      } catch (err: any) {
        throw new Error(err?.response?.data?.message || err.message || 'Failed to fetch detailed review');
      }
      const json = res.data;
      const payload = json?.data || json;
      
      // Transform the data to match our interface
      const questions: Question[] = (payload.questionSnapshot || []).map((q: any) => {
        return {
          questionId: q.questionId,
          text: q.text,
          options: q.options.map((opt: any, optIndex: number) => ({
            index: optIndex,
            optionText: opt.optionText
          })),
          correctIndex: q.correctIndex,
          selectedIndex: q.selectedIndex,
          explanation: q.explanation,
          difficulty: q.difficulty,
          domain: q.domain
        };
      });

      setData({
        attemptId: id,
        paperTitle: payload.paperTitle || 'Paper Review',
        subject: payload.subject || '',
        score: payload.score || 0,
        totalQuestions: payload.totalQuestions || questions.length,
        submittedAt: payload.submittedAt || '',
        questions
      });
    } catch (err) {
      console.error(err);
      alert('Could not load detailed review');
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < (data?.questions.length || 0) - 1) setCurrentIndex(currentIndex + 1);
  };

  const getQuestionStatus = (question: Question) => {
    if (question.selectedIndex === null) return 'unanswered';
    if (question.selectedIndex === question.correctIndex) return 'correct';
    return 'incorrect';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'correct': return 'text-emerald-600';
      case 'incorrect': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'correct': return 'bg-emerald-100';
      case 'incorrect': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
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

  if (!attemptId) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className={`w-16 h-16 ${isDarkMode ? 'bg-red-900' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <XCircle className={`w-8 h-8 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
          </div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>No Attempt Specified</h2>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>Please provide a valid attempt ID to view the detailed review.</p>
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
          <p className={`mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading detailed review...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className={`w-16 h-16 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <BookOpen className={`w-8 h-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
          </div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>No Data Available</h2>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>Unable to load the detailed review data for this attempt.</p>
          <Button onClick={() => router.push('/subscriptions')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Back to Subscriptions
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = data.questions[currentIndex];
  const questionStatus = getQuestionStatus(currentQuestion);
  const percentage = Math.round((data.score / data.totalQuestions) * 100);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push(`/subscriptions/attempts/attempt-reviews?attemptId=${attemptId}`)}
                variant="outline"
                className={`flex items-center space-x-2 ${isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Review</span>
              </Button>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <BookOpen className="w-5 h-5 inline mr-2" />
                Detailed Review
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
              {data.paperTitle}
            </h1>
            <div className="flex items-center justify-center space-x-6 text-sm">
              {data.subject && (
                <div className={`inline-flex items-center px-3 py-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {data.subject}
                </div>
              )}
              <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Trophy className="w-4 h-4 inline mr-1" />
                {data.score}/{data.totalQuestions} ({percentage}%)
              </div>
              {data.submittedAt && (
                <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {formatDateTime(data.submittedAt)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-lg border p-8`}>
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Question {currentIndex + 1}
                  </h2>
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center space-x-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className={`w-3 h-3 rounded-full ${
                        questionStatus === 'correct' ? 'bg-emerald-500' : 
                        questionStatus === 'incorrect' ? 'bg-red-500' : 
                        (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')
                      }`}></div>
                      <span className="capitalize">{questionStatus}</span>
                    </div>
                    {currentQuestion.difficulty && (
                      <div className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {currentQuestion.difficulty}
                      </div>
                    )}
                    {currentQuestion.domain && (
                      <div className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {currentQuestion.domain}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="prose prose-lg max-w-none">
                  <p className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'} leading-relaxed mb-8`}>
                    {currentQuestion.text}
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4 mb-8">
                {currentQuestion.options.map((opt, optIndex) => {
                  const isSelected = currentQuestion.selectedIndex === optIndex;
                  const isCorrect = currentQuestion.correctIndex === optIndex;
                  const isSelectedCorrect = isSelected && isCorrect;
                  const isSelectedIncorrect = isSelected && !isCorrect;
                  const isCorrectNotSelected = !isSelected && isCorrect;

                  return (
                    <div
                      key={opt.index}
                      className={`block p-4 rounded-xl border-2 transition-all duration-200 ${
                        isSelectedCorrect
                          ? (isDarkMode ? 'border-emerald-500 bg-emerald-900/30 shadow-md' : 'border-emerald-500 bg-emerald-50 shadow-md')
                          : isSelectedIncorrect
                          ? (isDarkMode ? 'border-red-500 bg-red-900/30 shadow-md' : 'border-red-500 bg-red-50 shadow-md')
                          : isCorrectNotSelected
                          ? (isDarkMode ? 'border-emerald-400 bg-emerald-800/20 shadow-sm' : 'border-emerald-400 bg-emerald-50/50 shadow-sm')
                          : (isDarkMode ? 'border-gray-600' : 'border-gray-200')
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                          isSelectedCorrect
                            ? 'border-emerald-500 bg-emerald-500'
                            : isSelectedIncorrect
                            ? 'border-red-500 bg-red-500'
                            : isCorrectNotSelected
                            ? 'border-emerald-400 bg-emerald-400'
                            : (isDarkMode ? 'border-gray-500' : 'border-gray-300')
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                          {isCorrectNotSelected && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'} font-medium flex-1`}>
                          {opt.optionText}
                        </span>
                        <div className="flex items-center space-x-2">
                          {isSelected && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              isSelectedCorrect 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              Your Answer
                            </span>
                          )}
                          {isCorrect && (
                            <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-800">
                              Correct
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {currentQuestion.explanation && (
                <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-xl p-6 mb-8`}>
                  <div className="flex items-center mb-3">
                    <Brain className="w-5 h-5 text-emerald-600 mr-2" />
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Explanation
                    </h3>
                  </div>
                  <p className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'} leading-relaxed`}>
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center">
                <Button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  variant="outline"
                  className={`flex items-center space-x-2 ${isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Button>

                <div className="flex items-center space-x-4">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {currentIndex + 1} of {data.questions.length}
                  </span>
                </div>

                <Button
                  onClick={handleNext}
                  disabled={currentIndex === data.questions.length - 1}
                  variant="outline"
                  className={`flex items-center space-x-2 ${isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Question Navigator Sidebar */}
          <div className="lg:col-span-1">
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-lg border p-6 sticky top-8`}>
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                Question Navigator
              </h3>

              <div className="flex flex-wrap gap-3 mb-6">
                {data.questions.map((q, idx) => {
                  const status = getQuestionStatus(q);
                  const isCurrent = idx === currentIndex;

                  const baseClassMap = {
                    correct: 'bg-emerald-600 text-white',
                    incorrect: 'bg-red-500 text-white',
                    unanswered: isDarkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  };

                  const currentOverlay = isCurrent ? 'ring-2 ring-emerald-300 border-2 border-emerald-500' : '';

                  const title = `Q${idx + 1}: ${isCurrent ? 'Current' : status}`;

                  return (
                    <button
                      key={q.questionId}
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative w-10 h-10 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 ${baseClassMap[status]} ${currentOverlay}`}
                      title={title}
                      aria-current={isCurrent ? 'true' : undefined}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Counts */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    Correct ({data.questions.filter(q => getQuestionStatus(q) === 'correct').length})
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    Incorrect ({data.questions.filter(q => getQuestionStatus(q) === 'incorrect').length})
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded-full`}></div>
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    Unanswered ({data.questions.filter(q => getQuestionStatus(q) === 'unanswered').length})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DetailedReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
      <DetailedReviewPageInner />
    </Suspense>
  );
}
