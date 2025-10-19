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
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className={`mt-4 font-mono ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>LOADING...</p>
      </div>
    </div>
  );
  
  if (!questions.length) return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="text-center px-4">
        <div className={`w-16 h-16 border-2 ${isDarkMode ? 'border-emerald-500 bg-emerald-500' : 'border-emerald-600 bg-emerald-600'} flex items-center justify-center mx-auto mb-4`}>
          <svg className={`w-8 h-8 ${isDarkMode ? 'text-black' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className={`text-2xl font-bold font-mono ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'} mb-2`}>NO QUESTIONS LOADED</h2>
        <p className={`${isDarkMode ? 'text-white' : 'text-black'} mb-6`}>There was an issue loading the questions for this attempt.</p>
        <Button 
          onClick={() => { start('nav'); router.push('/subscriptions'); }} 
          className={`border-2 ${isDarkMode 
            ? 'border-emerald-500 bg-emerald-500 text-black hover:bg-emerald-400' 
            : 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-500'
          }`}
        >
          BACK TO SUBSCRIPTIONS
        </Button>
      </div>
    </div>
  );

  const currentQ = questions[currentIndex];
  // timers removed; no displaySeconds or fmtSec

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-black border-emerald-500' : 'bg-white border-emerald-600'} border-b-2`}>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => { start('nav'); router.push('/subscriptions'); }}
                variant="outline"
                size="sm"
                className={`border-2 ${isDarkMode 
                  ? 'border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-black' 
                  : 'border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                }`}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className={`text-sm font-mono ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>
                {currentIndex + 1} / {totalQuestions}
              </div>
            </div>
            
            {/* Dark Mode Toggle */}
            <Button
              onClick={() => setIsDarkMode(!isDarkMode)}
              variant="outline"
              size="sm"
              className={`border-2 ${isDarkMode 
                ? 'border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-black' 
                : 'border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white'
              }`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Conflict banner: shown if a start attempt returned 409 with remaining time */}
      {conflictInfo && (
        <div className="max-w-6xl mx-auto px-4 py-3"> 
          <div className={`${isDarkMode ? 'bg-emerald-500 text-black' : 'bg-emerald-600 text-white'} p-4 border-l-4 border-emerald-400`}> 
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold">Attempt in Progress</div>
                <div className="text-sm opacity-90">
                  {conflictInfo.message || 'You cannot start a new attempt right now.'}
                </div>
              </div>
              <div className="flex space-x-2">
                {conflictInfo.attemptId && (
                  <Button onClick={() => handleResumeAttempt(conflictInfo.attemptId)} className="bg-black text-white hover:bg-gray-800 border-0">Resume</Button>
                )}
                <Button variant="outline" onClick={() => setConflictInfo(null)} className={`border-2 ${isDarkMode ? 'border-black text-black hover:bg-black hover:text-white' : 'border-white text-white hover:bg-white hover:text-black'}`}>Dismiss</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <div className={`${isDarkMode ? 'bg-black border-emerald-500' : 'bg-white border-emerald-600'} border-2 p-4 sm:p-6 lg:p-8`}>
              <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
                  <h2 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>
                    Q{currentIndex + 1}
                  </h2>
                  <div className={`flex items-center space-x-2 text-xs sm:text-sm ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>
                      <div className={`w-2 h-2 sm:w-3 sm:h-3 ${
                        answers[currentIndex] != null ? (isDarkMode ? 'bg-emerald-500' : 'bg-emerald-600') : 'bg-gray-400'
                      }`}></div>
                      <span className="font-mono">{answers[currentIndex] != null ? 'ANSWERED' : 'NOT ANSWERED'}</span>
                    </div>
                </div>
                
                <div className="mb-6 sm:mb-8">
                  <p className={`${isDarkMode ? 'text-white' : 'text-black'} text-base sm:text-lg leading-relaxed`}>
                    {currentQ.text}
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {currentQ.options.map((opt, optIndex) => (
                  <label
                    key={opt.index}
                    className={`block p-3 sm:p-4 border-2 cursor-pointer transition-all duration-150 ${
                      (isAnsweredAt(currentIndex) && Number(answers[currentIndex]) === optIndex)
                        ? (isDarkMode ? 'border-emerald-500 bg-emerald-500 text-black' : 'border-emerald-600 bg-emerald-600 text-white')
                        : (isDarkMode ? 'border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-black' : 'border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white')
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
                      <div className={`w-3 h-3 sm:w-4 sm:h-4 border-2 mr-3 sm:mr-4 flex items-center justify-center flex-shrink-0 ${
                        (isAnsweredAt(currentIndex) && Number(answers[currentIndex]) === optIndex)
                          ? (isDarkMode ? 'border-black bg-black' : 'border-white bg-white')
                          : (isDarkMode ? 'border-emerald-500' : 'border-emerald-600')
                      }`}>
                        {isAnsweredAt(currentIndex) && Number(answers[currentIndex]) === optIndex && (
                          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${isDarkMode ? 'bg-emerald-500' : 'bg-emerald-600'}`}></div>
                        )}
                      </div>
                      <span className="font-medium text-sm sm:text-base leading-relaxed">
                        {opt.optionText}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
                <Button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  variant="outline"
                  className={`border-2 w-full sm:w-auto ${isDarkMode 
                    ? 'border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-black disabled:border-gray-600 disabled:text-gray-600' 
                    : 'border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white disabled:border-gray-400 disabled:text-gray-400'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  <Button
                    onClick={handleSaveAndNext}
                    className={`border-2 w-full sm:w-auto ${isDarkMode 
                      ? 'border-emerald-500 bg-emerald-500 text-black hover:bg-emerald-400' 
                      : 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-500'
                    }`}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save & Next
                  </Button>
                  
                  <Button
                    onClick={handleNext}
                    disabled={currentIndex === questions.length - 1}
                    variant="outline"
                    className={`border-2 w-full sm:w-auto ${isDarkMode 
                      ? 'border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-black disabled:border-gray-600 disabled:text-gray-600' 
                      : 'border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white disabled:border-gray-400 disabled:text-gray-400'
                    }`}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                <Button
                  onClick={handleSubmit}
                  className={`border-2 w-full sm:w-auto ${isDarkMode 
                    ? 'border-black bg-black text-emerald-500 hover:bg-gray-800' 
                    : 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Submit
                </Button>
              </div>
            </div>
          </div>

          {/* Question Navigator Sidebar */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <div className={`${isDarkMode ? 'bg-black border-emerald-500' : 'bg-white border-emerald-600'} border-2 p-4 sm:p-6 sticky top-4`}>
              <h3 className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'} mb-3 sm:mb-4 font-mono`}>
                NAVIGATOR
              </h3>

              {/* Helper getters to account for numeric and string keys from localStorage */}
              {/** render navigator */}
              <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
                {questions.map((q, idx) => {
                  const raw = (answers as any)[idx] ?? (answers as any)[String(idx)];
                  const savedRaw = (savedIndexes as any)[idx] ?? (savedIndexes as any)[String(idx)];
                  const hasAnswer = raw != null; // true for numbers (including 0)
                  const isSaved = !!savedRaw;
                  const isCurrent = idx === currentIndex;

                  // Determine base status with clear priority: saved > answered > notAttempted
                  type BaseStatus = 'answered' | 'saved' | 'notAttempted';
                  const baseStatus: BaseStatus = isSaved ? 'saved' : (hasAnswer ? 'answered' : 'notAttempted');

                  // Different colors and styles for each status while showing question numbers
                  let buttonClass = '';
                  let textColor = '';
                  let borderColor = '';
                  
                  if (isSaved) {
                    // Saved: Solid emerald background with white/black text
                    buttonClass = isDarkMode 
                      ? 'bg-emerald-500 text-black' 
                      : 'bg-emerald-600 text-white';
                    borderColor = isDarkMode ? 'border-emerald-500' : 'border-emerald-600';
                  } else if (hasAnswer) {
                    // Answered: Yellow/orange background with black text
                    buttonClass = isDarkMode 
                      ? 'bg-yellow-500 text-black' 
                      : 'bg-yellow-500 text-black';
                    borderColor = isDarkMode ? 'border-yellow-500' : 'border-yellow-500';
                  } else {
                    // Not attempted: Hollow with emerald border
                    buttonClass = isDarkMode 
                      ? 'bg-black text-emerald-500 hover:bg-emerald-500 hover:text-black' 
                      : 'bg-white text-emerald-600 hover:bg-emerald-600 hover:text-white';
                    borderColor = isDarkMode ? 'border-emerald-500' : 'border-emerald-600';
                  }

                  // Current question gets a thicker border
                  const currentOverlay = isCurrent ? 'border-4 border-emerald-400' : '';

                  const title = `Q${idx + 1}: ${isCurrent ? 'Current' : (hasAnswer && isSaved ? 'Answered & Saved' : isSaved ? 'Saved' : hasAnswer ? 'Answered' : 'Not Attempted')}`;

                  return (
                    <button
                      key={q.questionId ?? idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 border-2 font-bold text-xs sm:text-sm transition-all duration-150 flex items-center justify-center ${buttonClass} ${borderColor} ${currentOverlay}`}
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
                  <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500"></div>
                      <span className={`font-mono ${isDarkMode ? 'text-yellow-500' : 'text-yellow-600'}`}>
                        ANSWERED ({answeredCount})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className={`w-2 h-2 sm:w-3 sm:h-3 ${isDarkMode ? 'bg-emerald-500' : 'bg-emerald-600'}`}></div>
                      <span className={`font-mono ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>
                        SAVED ({savedCount})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className={`w-2 h-2 sm:w-3 sm:h-3 border-2 ${isDarkMode ? 'border-emerald-500' : 'border-emerald-600'}`}></div>
                      <span className={`font-mono ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>
                        NOT ATTEMPTED ({notAttemptedCount})
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
