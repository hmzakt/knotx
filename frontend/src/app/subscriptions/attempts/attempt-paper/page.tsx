"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Clock, CheckCircle, Trophy } from "lucide-react";


interface Option {
  index: number;
  optionText: string;
}

interface Question {
  questionId: string;
  text: string;
  options: Option[];
}

interface StartAttemptResponse {
  attemptId: string;
  paperId: string;
  totalQuestions: number;
  questions: Question[];
}

export default function AttemptPaperPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paperId = searchParams.get('paperId') || undefined;
  const existingAttemptId = searchParams.get('attemptId') || undefined;

  const [attemptId, setAttemptId] = useState<string | null>(existingAttemptId || null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [savedIndexes, setSavedIndexes] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedTimerRef = useRef<boolean>(false);

  // local storage key per attempt or paper
  const storageKey = attemptId ? `attempt_${attemptId}` : `attempt_paper_${paperId}`;

  useEffect(() => {
    // try to load from localstorage first
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.questions) {
          setAttemptId(parsed.attemptId || null);
          setQuestions(parsed.questions);
          setTotalQuestions(parsed.totalQuestions || parsed.questions.length);
          setAnswers(parsed.answers || {});
          setSavedIndexes(parsed.savedIndexes || {});
          if (parsed.timeLeft != null) setTimeLeft(parsed.timeLeft);
          return;
        }
      } catch (e) {
        // ignore
      }
    }

    // else start attempt if paperId given
    if (paperId && !attemptId) {
      startAttemptForPaper(paperId);
    }
    // if attemptId present but no questions, fetch attempt (in-progress)
    if (attemptId && !questions.length) {
      fetchAttempt(attemptId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // persist to localstorage
    if (!questions.length) return;
    const payload = { attemptId, questions, totalQuestions, answers, savedIndexes, timeLeft };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [attemptId, questions, totalQuestions, answers, savedIndexes, timeLeft]);

  // Robust timer: start a single interval when timeLeft is set (non-null)
  useEffect(() => {
    if (timeLeft == null) {
      // no timer required, ensure any running timer is cleared
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      startedTimerRef.current = false;
      return;
    }

    if (startedTimerRef.current) return; // already running
    startedTimerRef.current = true;

    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev == null) return prev;
        if (prev <= 1) {
          // about to reach zero: clear timer and submit
          if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
          startedTimerRef.current = false;
          // submit on next tick to avoid state mutation inside reducer
          setTimeout(() => {
            try { handleSubmit(); } catch (e) { console.error(e); }
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      startedTimerRef.current = false;
    };
  }, [timeLeft, attemptId]);

  // ensure cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      startedTimerRef.current = false;
    };
  }, []);

  const startAttemptForPaper = async (paperId: string) => {
    try {
      setLoading(true);
      let res;
      try {
        res = await apiClient.post(`/attempts/start/${paperId}`);
      } catch (err: any) {
        throw new Error(err?.response?.data?.message || err.message || 'Failed to start attempt');
      }
      const json: any = res.data;
      // support both ApiResponse wrapper and raw payload
      const payload = json?.data ?? json;
      setAttemptId(payload.attemptId || payload._id || null);
      setQuestions(payload.questions || []);
      setTotalQuestions(payload.totalQuestions || (payload.questions || []).length);
      // prefer server-driven remainingSec when present
      if (typeof payload.remainingSec === 'number') {
        setTimeLeft(payload.remainingSec);
      } else if (payload.remainingSec === null) {
        // server indicates no limit
        setTimeLeft(null);
      } else {
        const ds = payload.durationSec ?? payload.timeLeft ?? null;
        setTimeLeft(ds && ds > 0 ? ds : null);
      }
      // If paper has duration it might be provided in headers or nested; try fetch paper duration if present
      // Save to localstorage via effect
    } catch (err) {
      console.error(err);
      alert('Could not start attempt');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttempt = async (id: string) => {
    try {
      setLoading(true);
      let res;
      try {
        res = await apiClient.get(`/attempts/${id}`);
      } catch (err: any) {
        throw new Error(err?.response?.data?.message || err.message || 'Failed to fetch attempt');
      }
      const data = res.data;
      const payload = data?.data || data;
      // If in-progress, server returns questions without correctIndex
      setQuestions(
        (payload.questionSnapshot || payload.questions || []).map((q: any) => ({
          questionId: q.questionId || q._id,
          text: q.text,
          options: q.options.map((opt: any, idx: number) => ({ index: idx, optionText: opt.optionText }))
        }))
      );
      setTotalQuestions(payload.totalQuestions || (payload.questionSnapshot || []).length);
      // try to set time if included
      if (typeof payload.remainingSec === 'number') {
        setTimeLeft(payload.remainingSec);
      } else if (payload.remainingSec === null) {
        setTimeLeft(null);
      } else if (payload.durationSec) {
        setTimeLeft(payload.durationSec > 0 ? payload.durationSec : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qIndex: number, optIndex: number) => {
    setAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleSaveAndNext = () => {
    setSavedIndexes(prev => ({ ...prev, [currentIndex]: true }));
    // persist server-side
    persistAnswer(currentIndex);
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleSubmit = async () => {
    if (!attemptId) {
      alert('Attempt not initialized');
      return;
    }

    // Prepare answers payload expected by backend (answers: [{questionId, selectedIndex}])
    const answersArr = Object.keys(answers).map(k => ({
      questionId: questions[Number(k)].questionId,
      selectedIndex: answers[Number(k)]
    }));

    try {
      setLoading(true);
      let res;
      try {
        res = await apiClient.post(`/attempts/${attemptId}/submit`, { answers: answersArr });
      } catch (err: any) {
        throw new Error(err?.response?.data?.message || err.message || 'Submit failed');
      }
      const data = res.data;
      const payload = data?.data || data;
      // clear localstorage for this attempt
      localStorage.removeItem(storageKey);
      // redirect to review page
      router.push(`/subscriptions/attempts/attempt-reviews?attemptId=${attemptId}`);
    } catch (err) {
      console.error(err);
      alert('Submit failed');
    } finally {
      setLoading(false);
    }
  };

  const persistAnswer = async (qIndex: number) => {
    if (!attemptId) return;
    const selected = answers[qIndex] ?? null;
    const questionId = questions[qIndex]?.questionId;
    if (!questionId) return;
    try {
      await apiClient.post(`/attempts/${attemptId}/answer`, { questionId, selectedIndex: selected });
    } catch (err) {
      console.error('Failed to persist answer', err);
    }
  };

  const renderQuestionIndexGrid = () => {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
        {questions.map((q, idx) => {
          const answered = answers[idx] != null;
          const saved = !!savedIndexes[idx];
          const isCurrent = idx === currentIndex;
          const bg = isCurrent ? '#2b6cb0' : answered ? '#48bb78' : saved ? '#f6e05e' : '#e2e8f0';
          return (
            <button
              key={q.questionId}
              onClick={() => setCurrentIndex(idx)}
              style={{ padding: 8, background: bg, borderRadius: 4 }}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading your attempt...</p>
      </div>
    </div>
  );
  
  if (!questions.length) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Questions Loaded</h2>
        <p className="text-gray-600 mb-6">There was an issue loading the questions for this attempt.</p>
        <Button onClick={() => router.push('/subscriptions')} className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white">
          Back to Subscriptions
        </Button>
      </div>
    </div>
  );

  const currentQ = questions[currentIndex];
  const minutes = timeLeft != null ? Math.floor(timeLeft / 60) : null;
  const seconds = timeLeft != null ? (timeLeft % 60) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/subscriptions')}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back</span>
              </Button>
              <div className="text-sm text-gray-600">
                Question {currentIndex + 1} of {totalQuestions}
              </div>
            </div>
            
            {/* Timer */}
            <div className="flex items-center space-x-4">
              {timeLeft !== null ? (
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold ${
                  timeLeft < 300 ? 'bg-red-100 text-red-700' : 
                  timeLeft < 900 ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-green-100 text-green-700'
                }`}>
                  <Clock className="w-5 h-5" />
                  <span className="text-lg">
                    {minutes}:{seconds != null ? String(seconds).padStart(2, '0') : '00'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold">
                  <Clock className="w-5 h-5" />
                  <span>No Time Limit</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Question {currentIndex + 1}</h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className={`w-3 h-3 rounded-full ${
                      answers[currentIndex] !== null ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    <span>{answers[currentIndex] !== null ? 'Answered' : 'Not Answered'}</span>
                  </div>
                </div>
                
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-800 leading-relaxed mb-8">{currentQ.text}</p>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4 mb-8">
                {currentQ.options.map((opt, optIndex) => (
                  <label
                    key={opt.index}
                    className={`block p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      answers[currentIndex] === optIndex
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name={`q_${currentQ.questionId}`}
                        checked={answers[currentIndex] === optIndex}
                        onChange={() => handleSelectOption(currentIndex, optIndex)}
                        className="sr-only"
                      />
                      <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                        answers[currentIndex] === optIndex
                          ? 'border-indigo-500 bg-indigo-500'
                          : 'border-gray-300'
                      }`}>
                        {answers[currentIndex] === optIndex && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className="text-gray-800 font-medium">{opt.optionText}</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center">
                <Button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Previous</span>
                </Button>

                <div className="flex space-x-3">
                  <Button
                    onClick={handleSaveAndNext}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save & Next
                  </Button>
                  
                  <Button
                    onClick={handleNext}
                    disabled={currentIndex === questions.length - 1}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <span>Next</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </div>

                <Button
                  onClick={handleSubmit}
                  variant="destructive"
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Submit & Exit
                </Button>
              </div>
            </div>
          </div>

          {/* Question Navigator Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Question Navigator</h3>
              <div className="grid grid-cols-5 gap-2 mb-6">
                {questions.map((q, idx) => {
                  const answered = answers[idx] !== null;
                  const saved = !!savedIndexes[idx];
                  const isCurrent = idx === currentIndex;
                  
                  return (
                    <button
                      key={q.questionId}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 ${
                        isCurrent
                          ? 'bg-indigo-500 text-white shadow-lg'
                          : answered
                          ? 'bg-green-500 text-white'
                          : saved
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Answered ({Object.values(answers).filter(a => a !== null).length})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600">Saved ({Object.values(savedIndexes).filter(Boolean).length})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span className="text-gray-600">Not Attempted ({questions.length - Object.values(answers).filter(a => a !== null).length})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
