"use client";
import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  
  CheckCircle, 
  Trophy, 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Moon, 
  Sun,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useRouteLoading } from '@/contexts/RouteLoadingContext';


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

function AttemptPaperPageInner() {
  const router = useRouter();
  const { start } = useRouteLoading();
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
  // timer removed: timeLeft/endTimestamp/attemptStartedAt/paperDurationSec intentionally omitted
  const [conflictInfo, setConflictInfo] = useState<{ attemptId?: string; remainingSec?: number; message?: string } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true); // Dark mode first
  const [storedPayloadDebug, setStoredPayloadDebug] = useState<any>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  // timer refs removed

  // Keep attemptId state in sync with the URL query param. When client-side navigation
  // updates the query (router.push ?attemptId=...), we must update our state so
  // the main effect (which depends on attemptId / storageKey) runs and fetches the
  // attempt including remaining time. Without this sync, navigating to a resume
  // attempt would not trigger fetchAttempt and the timer would not start.
  useEffect(() => {
    // If we just learned attemptId but a paper-scoped payload exists, migrate it to attempt-specific key
    if (attemptId && paperId) {
      try {
        const paperKey = `attempt_paper_${paperId}`;
        const attemptKey = `attempt_${attemptId}`;
        const paperSaved = localStorage.getItem(paperKey);
        const attemptSaved = localStorage.getItem(attemptKey);
        if (paperSaved && !attemptSaved) {
          localStorage.setItem(attemptKey, paperSaved);
        }
      } catch (e) {
        console.error('Failed to migrate paper payload to attempt key', e);
      }
    }
    if (existingAttemptId && existingAttemptId !== attemptId) {
      setAttemptId(existingAttemptId);
    }
  }, [existingAttemptId, attemptId]);

  // local storage key per attempt or paper
  const storageKey = attemptId ? `attempt_${attemptId}` : `attempt_paper_${paperId}`;

  // React when storageKey / paperId / attemptId / questions.length change.
  // This fixes a bug where navigating to this page with a new attemptId via router.push
  // didn't trigger fetchAttempt (the initial empty-deps effect ran only once).
  useEffect(() => {
    // try to load from localstorage first
    // Prefer attempt_{attemptId} if present, otherwise fallback to attempt_paper_{paperId}
    let saved = null;
    if (attemptId) saved = localStorage.getItem(`attempt_${attemptId}`);
    if (!saved && paperId) saved = localStorage.getItem(`attempt_paper_${paperId}`);
    if (!saved) saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.questions) {
          setAttemptId(parsed.attemptId || null);
          setQuestions(parsed.questions);
          setTotalQuestions(parsed.totalQuestions || parsed.questions.length);
          setAnswers(parsed.answers || {});
          setSavedIndexes(parsed.savedIndexes || {});
          console.debug('Loaded attempt from localStorage', { key: storageKey, parsed });
          // continue to fetch server attempt if we have an attemptId to ensure snapshot is fresh
          const candidateAttemptId = parsed.attemptId || attemptId || existingAttemptId;
          if (candidateAttemptId) {
            fetchAttempt(candidateAttemptId);
            return;
          }
        }
      } catch (e) {
        // ignore
      }
    }

    // else start attempt if paperId given and no attemptId present
    if (paperId && !attemptId) {
      startAttemptForPaper(paperId);
      return;
    }

    // if attemptId present but no questions, fetch attempt (in-progress)
    if (attemptId && !questions.length) {
      fetchAttempt(attemptId);
    }
  }, [storageKey, paperId, attemptId, questions.length]);

  useEffect(() => {
    // persist to localstorage
    if (!questions.length) return;
    const payload = { attemptId, questions, totalQuestions, answers, savedIndexes };
    try {
      // Always write to the paper-specific key when paperId exists (helps after start/migrate)
      if (paperId) {
        localStorage.setItem(`attempt_paper_${paperId}`, JSON.stringify(payload));
      }
      // If we have an attemptId, also write to its key
      if (attemptId) {
        localStorage.setItem(`attempt_${attemptId}`, JSON.stringify(payload));
      } else {
        // fallback: write to computed storageKey
        localStorage.setItem(storageKey, JSON.stringify(payload));
      }
    } catch (e) {
      console.error('Failed to persist attempt payload', e);
    }
  }, [attemptId, questions, totalQuestions, answers, savedIndexes]);

  // dev-only: read back stored payload for debugging timer issues
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    try {
      const s = localStorage.getItem(storageKey);
      setStoredPayloadDebug(s ? JSON.parse(s) : null);
    } catch (e) {
      setStoredPayloadDebug(null);
    }
  }, [storageKey, questions.length]);

  // timer removed: no interval/tick logic

  const startAttemptForPaper = async (paperId: string) => {
    try {
      setLoading(true);
      let res;
      try {
        res = await apiClient.post(`/attempts/start/${paperId}`);
      } catch (err: any) {
        // If attempt already exists (conflict), surface remaining time and offer resume
        const status = err?.response?.status;
        const respData = err?.response?.data;
        if (status === 409) {
          const attemptIdFromResp = respData?.data?.attemptId || respData?.attemptId || respData?.existingAttemptId || respData?.data?.id;
          // Set conflict info so UI can offer resume option
          setConflictInfo({ attemptId: attemptIdFromResp, message: respData?.message });
          return;
        }
        throw new Error(err?.response?.data?.message || err.message || 'Failed to start attempt');
      }
      const json: any = res.data;
      // support both ApiResponse wrapper and raw payload
      const payload = json?.data ?? json;
      setAttemptId(payload.attemptId || payload._id || null);
      setQuestions(payload.questions || []);
      setTotalQuestions(payload.totalQuestions || (payload.questions || []).length);
      // Start attempt: only set attempt id and questions; timer handled server-side (removed from client)
      setAttemptId(payload.attemptId || payload._id || null);
      setQuestions(payload.questions || []);
      setTotalQuestions(payload.totalQuestions || (payload.questions || []).length);
      // If paper has duration it might be provided in headers or nested; try fetch paper duration if present
      // Save to localstorage via effect
    } catch (err) {
      console.error(err);
      alert('Could not start attempt');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeAttempt = async (id?: string) => {
    if (!id) return;
    try {
      setLoading(true);
      setAttemptId(id);
      await fetchAttempt(id);
      setConflictInfo(null);
    } catch (e) {
      console.error('Failed to resume attempt', e);
      alert('Could not resume attempt');
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
        const msg = err?.response?.data?.message || err.message || 'Failed to fetch attempt';
        console.error('fetchAttempt network error', err?.response?.data || err);
        setFetchError(msg);
        throw new Error(msg);
      }
      const data = res.data;
  const payload = data?.data || data;
  console.debug('fetchAttempt payload', { id, payload });
      // If in-progress, server returns questions without correctIndex
      setQuestions(
        (payload.questionSnapshot || payload.questions || []).map((q: any) => ({
          questionId: q.questionId || q._id,
          text: q.text,
          options: q.options.map((opt: any, idx: number) => ({ index: idx, optionText: opt.optionText }))
        }))
      );
      setTotalQuestions(payload.totalQuestions || (payload.questionSnapshot || []).length);
      
    } catch (err) {
      console.error('fetchAttempt failed', err);
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

  // Helper to robustly determine if an answer exists for an index.
  // Handles numeric and string keys (from localStorage) and treats null/undefined as not answered.
  const isAnsweredAt = (idx: number) => {
    // answers may come from localStorage with string keys, cast to any to safely read both
    const v = answers[idx] ?? (answers as any)[String(idx)];
    return v != null;
  };


  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className={`mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading your attempt...</p>
      </div>
    </div>
  );
  
  if (!questions.length) return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="text-center">
        <div className={`w-16 h-16 ${isDarkMode ? 'bg-red-900' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <svg className={`w-8 h-8 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>No Questions Loaded</h2>
        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>There was an issue loading the questions for this attempt.</p>
        <Button 
          onClick={() => { start('nav'); router.push('/subscriptions'); }} 
          className={`${isDarkMode 
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
          }`}
        >
          Back to Subscriptions
        </Button>
      </div>
    </div>
  );

  const currentQ = questions[currentIndex];
  // timers removed; no displaySeconds or fmtSec

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => { start('nav'); router.push('/subscriptions'); }}
                variant="outline"
                className={`flex items-center space-x-2 ${isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Question {currentIndex + 1} of {totalQuestions}
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
        </div>
      </div>

      {/* Conflict banner: shown if a start attempt returned 409 with remaining time */}
      {conflictInfo && (
        <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4`}> 
          <div className={`${isDarkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'} rounded-lg p-4 flex items-center justify-between`}> 
            <div>
              <div className="font-semibold">An attempt is already in progress</div>
              <div className="text-sm">
                {conflictInfo.message || 'You cannot start a new attempt right now.'}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {conflictInfo.attemptId && (
                <Button onClick={() => handleResumeAttempt(conflictInfo.attemptId)} className="bg-emerald-600 text-white">Resume Attempt</Button>
              )}
              <Button variant="outline" onClick={() => setConflictInfo(null)}>Dismiss</Button>
            </div>
          </div>
        </div>
      )}

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
                  <div className={`flex items-center space-x-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className={`w-3 h-3 rounded-full ${
                        answers[currentIndex] != null ? 'bg-emerald-500' : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')
                      }`}></div>
                      <span>{answers[currentIndex] != null ? 'Answered' : 'Not Answered'}</span>
                    </div>
                </div>
                
                <div className="prose prose-lg max-w-none">
                  <p className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'} leading-relaxed mb-8`}>
                    {currentQ.text}
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4 mb-8">
                {currentQ.options.map((opt, optIndex) => (
                  <label
                    key={opt.index}
                    className={`block p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      (isAnsweredAt(currentIndex) && Number(answers[currentIndex]) === optIndex)
                        ? (isDarkMode ? 'border-emerald-500 bg-emerald-900/30 shadow-md' : 'border-emerald-500 bg-emerald-50 shadow-md')
                        : (isDarkMode ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50')
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name={`q_${currentQ.questionId}`}
                        checked={isAnsweredAt(currentIndex) && Number(answers[currentIndex]) === optIndex}
                        onChange={() => handleSelectOption(currentIndex, optIndex)}
                        className="sr-only"
                      />
                      <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                        (isAnsweredAt(currentIndex) && Number(answers[currentIndex]) === optIndex)
                          ? 'border-emerald-500 bg-emerald-500'
                          : (isDarkMode ? 'border-gray-500' : 'border-gray-300')
                      }`}>
                        {isAnsweredAt(currentIndex) && Number(answers[currentIndex]) === optIndex && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'} font-medium`}>
                        {opt.optionText}
                      </span>
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
                  className={`flex items-center space-x-2 ${isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex space-x-3">
                  <Button
                    onClick={handleSaveAndNext}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save & Next
                  </Button>
                  
                  <Button
                    onClick={handleNext}
                    disabled={currentIndex === questions.length - 1}
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

                <Button
                  onClick={handleSubmit}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Submit & Exit
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

              {/* Helper getters to account for numeric and string keys from localStorage */}
              {/** render navigator */}
              <div className="flex flex-wrap gap-3 mb-6">
                {questions.map((q, idx) => {
                  const raw = (answers as any)[idx] ?? (answers as any)[String(idx)];
                  const savedRaw = (savedIndexes as any)[idx] ?? (savedIndexes as any)[String(idx)];
                  const hasAnswer = raw != null; // true for numbers (including 0)
                  const isSaved = !!savedRaw;
                  const isCurrent = idx === currentIndex;

                  // Determine base status with clear priority: saved > answered > notAttempted
                  type BaseStatus = 'answered' | 'saved' | 'notAttempted';
                  const baseStatus: BaseStatus = isSaved ? 'saved' : (hasAnswer ? 'answered' : 'notAttempted');

                  const baseClassMap: Record<BaseStatus, string> = {
                    answered: 'bg-emerald-600 text-white',
                    saved: isDarkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-500 text-white',
                    notAttempted: isDarkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  };

                  // If the question is the current one, overlay a green border/ring but keep the base background
                  const currentOverlay = isCurrent ? 'ring-2 ring-emerald-300 border-2 border-emerald-500' : '';

                  // Make title reflect combined state (e.g., Answered & Saved) and current
                  const title = `Q${idx + 1}: ${isCurrent ? 'Current' : (hasAnswer && isSaved ? 'Answered & Saved' : isSaved ? 'Saved' : hasAnswer ? 'Answered' : 'Not Attempted')}`;

                  return (
                    <button
                      key={q.questionId ?? idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative w-10 h-10 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 ${baseClassMap[baseStatus]} ${currentOverlay}`}
                      title={title}
                      aria-current={isCurrent ? 'true' : undefined}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Counts */}
              {(() => {
                // compute counts robustly
                let answeredCount = 0;
                let savedCount = 0;
                for (let i = 0; i < questions.length; i++) {
                  const raw = (answers as any)[i] ?? (answers as any)[String(i)];
                  const savedRaw = (savedIndexes as any)[i] ?? (savedIndexes as any)[String(i)];
                  if (raw != null) answeredCount++;
                  if (savedRaw) savedCount++;
                }
                const notAttemptedCount = questions.length - answeredCount;

                return (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        Answered ({answeredCount})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 ${isDarkMode ? 'bg-yellow-600' : 'bg-yellow-500'} rounded-full`}></div>
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        Saved ({savedCount})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded-full`}></div>
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        Not Attempted ({notAttemptedCount})
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Debug Panel removed */}
            </div>
          </div>
        </div>
      </div>
      {/* time UI removed */}
    </div>
  );
}

export default function AttemptPaperPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
      <AttemptPaperPageInner />
    </Suspense>
  );
}
