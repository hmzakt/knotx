"use client";
import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  Trophy, 
  ArrowLeft, 
  ChevronLeft,
  ChevronRight,
  Clock,
  Grid,
  AlertTriangle,
  Bell
} from "lucide-react";
import { useRouteLoading } from '@/contexts/RouteLoadingContext';
import { useTheme } from '@/contexts/ThemeContext';

interface Option {
  index: number;
  optionText: string;
}

interface Question {
  questionId: string;
  text: string;
  options: Option[];
  supportingImage?: string;
}

function AttemptPaperPageInner() {
  const router = useRouter();
  const { start } = useRouteLoading();
  const searchParams = useSearchParams();
  const { actualTheme } = useTheme();
  const isDarkMode = actualTheme === 'dark';

  const paperId = searchParams.get('paperId') || undefined;
  const existingAttemptId = searchParams.get('attemptId') || undefined;

  const [attemptId, setAttemptId] = useState<string | null>(existingAttemptId || null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [savedIndexes, setSavedIndexes] = useState<Record<number, boolean>>({});
  const [markedIndexes, setMarkedIndexes] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [conflictInfo, setConflictInfo] = useState<{ attemptId?: string; remainingSec?: number; message?: string } | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Sync attemptId with search parameters (resuming attempt case)
  useEffect(() => {
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

  const storageKey = attemptId ? `attempt_${attemptId}` : `attempt_paper_${paperId}`;

  // Load state from localStorage or fetch from API
  useEffect(() => {
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
          setMarkedIndexes(parsed.markedIndexes || {});
          if (parsed.timeLeft != null) {
            setTimeLeft(parsed.timeLeft);
          }
          
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

    if (paperId && !attemptId) {
      startAttemptForPaper(paperId);
      return;
    }

    if (attemptId && !questions.length) {
      fetchAttempt(attemptId);
    }
  }, [storageKey, paperId, attemptId, questions.length]);

  // Persist attempt state to localStorage
  useEffect(() => {
    if (!questions.length) return;
    const payload = { attemptId, questions, totalQuestions, answers, savedIndexes, markedIndexes, timeLeft };
    try {
      if (paperId) {
        localStorage.setItem(`attempt_paper_${paperId}`, JSON.stringify(payload));
      }
      if (attemptId) {
        localStorage.setItem(`attempt_${attemptId}`, JSON.stringify(payload));
      } else {
        localStorage.setItem(storageKey, JSON.stringify(payload));
      }
    } catch (e) {
      console.error('Failed to persist attempt payload', e);
    }
  }, [attemptId, questions, totalQuestions, answers, savedIndexes, markedIndexes, timeLeft]);

  // Ticking countdown timer logic
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const startAttemptForPaper = async (pId: string) => {
    try {
      setLoading(true);
      let res;
      try {
        res = await apiClient.post(`/attempts/start/${pId}`);
      } catch (err: any) {
        const status = err?.response?.status;
        const respData = err?.response?.data;
        if (status === 409) {
          const attemptIdFromResp = respData?.data?.attemptId || respData?.attemptId || respData?.existingAttemptId || respData?.data?.id;
          setConflictInfo({ attemptId: attemptIdFromResp, message: respData?.message });
          return;
        }
        throw new Error(err?.response?.data?.message || err.message || 'Failed to start attempt');
      }
      const json: any = res.data;
      const payload = json?.data ?? json;
      setAttemptId(payload.attemptId || payload._id || null);
      setQuestions(payload.questions || []);
      setTotalQuestions(payload.totalQuestions || (payload.questions || []).length);
      if (payload.remainingSec != null) {
        setTimeLeft(Number(payload.remainingSec));
      }
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
        setFetchError(msg);
        throw new Error(msg);
      }
      const data = res.data;
      const payload = data?.data || data;
      
      setQuestions(
        (payload.questionSnapshot || payload.questions || []).map((q: any) => ({
          questionId: q.questionId || q._id,
          text: q.text,
          options: q.options.map((opt: any, idx: number) => ({ index: idx, optionText: opt.optionText })),
          supportingImage: q.supportingImage || q.image
        }))
      );
      setTotalQuestions(payload.totalQuestions || (payload.questionSnapshot || []).length);
      
      if (payload.remainingSec != null) {
        setTimeLeft(Number(payload.remainingSec));
      }

      // Pre-populate answers from backend when resuming
      if (payload.answers && Array.isArray(payload.answers)) {
        const questionsList = payload.questionSnapshot || payload.questions || [];
        const loadedAnswers: Record<number, number | null> = {};
        const loadedSaved: Record<number, boolean> = {};
        
        questionsList.forEach((q: any, idx: number) => {
          const qId = q.questionId || q._id;
          const ansRecord = payload.answers.find((a: any) => a.questionId.toString() === qId.toString());
          if (ansRecord && ansRecord.selectedIndex != null) {
            loadedAnswers[idx] = ansRecord.selectedIndex;
            loadedSaved[idx] = true;
          }
        });
        setAnswers(prev => ({ ...prev, ...loadedAnswers }));
        setSavedIndexes(prev => ({ ...prev, ...loadedSaved }));
      }
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
    persistAnswer(currentIndex);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!attemptId) {
      alert('Attempt not initialized');
      return;
    }

    const answersArr = Object.keys(answers).map(k => ({
      questionId: questions[Number(k)].questionId,
      selectedIndex: answers[Number(k)]
    }));

    try {
      setLoading(true);
      try {
        await apiClient.post(`/attempts/${attemptId}/submit`, { answers: answersArr });
      } catch (err: any) {
        throw new Error(err?.response?.data?.message || err.message || 'Submit failed');
      }
      localStorage.removeItem(storageKey);
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

  const isAnsweredAt = (idx: number) => {
    const v = answers[idx] ?? (answers as any)[String(idx)];
    return v != null;
  };

  const formatTimeRemaining = (totalSeconds: number | null) => {
    if (totalSeconds === null) return "UNTIMED";
    if (totalSeconds <= 0) return "00:00";
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    const minStr = String(mins).padStart(2, '0');
    const secStr = String(secs).padStart(2, '0');
    
    if (hrs > 0) {
      return `${hrs}:${minStr}:${secStr}`;
    }
    return `${minStr}:${secStr}`;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#070c18]' : 'bg-[#f4f1eb]'}`}>
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className={`mt-4 font-mono font-bold tracking-widest ${isDarkMode ? 'text-[var(--av-amber)]' : 'text-[var(--av-amber-dark)]'}`}>
            PRE-FLIGHT SYSTEM INITIATING...
          </p>
        </div>
      </div>
    );
  }
  
  if (!questions.length) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#070c18]' : 'bg-[#f4f1eb]'}`}>
        <div className="text-center px-4 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className={`text-2xl font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            No Questions Loaded
          </h2>
          <p className={`text-sm mb-6 ${isDarkMode ? 'text-[#8a9bb5]' : 'text-[#4a4e5a]'}`}>
            There was a validation or connection error while syncronizing with the KnotX flight control system.
          </p>
          <Button 
            onClick={() => { start('nav'); router.push('/subscriptions'); }} 
            className="w-full py-3 bg-[var(--av-amber)] hover:bg-[var(--av-amber-dark)] text-black font-bold uppercase tracking-widest text-xs rounded-xl transition-all"
          >
            Back to Subscriptions
          </Button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).filter(k => answers[Number(k)] != null).length;
  const progressPercentage = Math.round((answeredCount / totalQuestions) * 100) || 0;

  return (
    <div 
      className="min-h-screen flex flex-col font-sans transition-colors duration-200"
      style={{ background: "var(--av-bg)", color: "var(--av-ink)" }}
    >
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-[var(--av-border)] bg-[var(--av-bg)]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          
          {/* Logo / Simulation Title */}
          <div className="flex items-center gap-3">
            <span className="font-display-black text-xl uppercase tracking-wider text-[var(--av-ink)]">
              KnotX
            </span>
            <span className="h-4 w-[1px] bg-[var(--av-border)] hidden sm:block" />
            <span className="text-xs uppercase tracking-widest text-[var(--av-ink-muted)] font-bold hidden sm:block">
              Simulation Room
            </span>
          </div>
          
          {/* Timer, Progress and Exit */}
          <div className="flex items-center gap-4 sm:gap-6 ml-auto">
            {/* Timer */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--av-bg-alt)] border border-[var(--av-border)] shadow-inner">
              <Clock className="w-4 h-4 text-[var(--av-amber)]" />
              <span className="font-mono text-sm font-bold tracking-wider text-[var(--av-ink)] t-minus">
                {formatTimeRemaining(timeLeft)}
              </span>
            </div>

            {/* Progress Bar (Desktop) */}
            <div className="hidden md:flex items-center gap-3">
              <span className="text-xs uppercase tracking-widest text-[var(--av-ink-muted)] font-bold">
                Progress
              </span>
              <div className="w-32 h-2 rounded-full bg-[var(--av-border)] overflow-hidden">
                <div 
                  className="h-full bg-[var(--av-cobalt)] transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-[var(--av-ink)]">
                {progressPercentage}%
              </span>
            </div>

            {/* Notification and Exit button */}
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg text-[var(--av-ink-muted)] hover:text-[var(--av-amber)] transition-colors">
                <Bell className="w-4 h-4" />
              </button>
              
              <button 
                onClick={() => { start('nav'); router.push('/subscriptions'); }}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--av-signal)] border border-[var(--av-signal)]/30 bg-[var(--av-signal)]/10 hover:bg-[var(--av-signal)]/20 rounded-lg transition-all"
                id="exit-simulation-btn"
              >
                Exit
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Conflict banner */}
      {conflictInfo && (
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 mt-4"> 
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-[var(--av-ink)] flex flex-wrap items-center justify-between gap-4"> 
            <div>
              <div className="font-bold text-amber-500">Attempt in Progress</div>
              <div className="text-xs text-[var(--av-ink-muted)]">
                {conflictInfo.message || 'You cannot start a new attempt right now.'}
              </div>
            </div>
            <div className="flex space-x-2">
              {conflictInfo.attemptId && (
                <Button 
                  onClick={() => handleResumeAttempt(conflictInfo.attemptId)} 
                  className="bg-[var(--av-amber)] hover:bg-[var(--av-amber-dark)] text-black font-bold text-xs uppercase"
                >
                  Resume
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setConflictInfo(null)} 
                className="border-[var(--av-border)] text-[var(--av-ink-muted)] hover:text-[var(--av-ink)] bg-transparent font-bold text-xs uppercase"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          
          {/* Left: Active Question Details */}
          <div className="space-y-6">
            <div className="dashboard-card p-6 sm:p-8 relative overflow-hidden shadow-xl border border-[var(--av-border)] bg-[var(--av-card-bg)]">
              {/* Cockpit Amber Indicator Strip */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--av-amber)] to-[var(--av-cobalt)]" />

              {/* Status Header */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs uppercase tracking-[0.2em] font-bold text-[var(--av-amber)]">
                  Question {currentIndex + 1} of {totalQuestions}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full`} style={{ background: answers[currentIndex] != null ? "var(--av-cobalt)" : "var(--av-signal)", animation: answers[currentIndex] != null ? "none" : "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
                  <span className="text-[10px] uppercase tracking-widest text-[var(--av-ink-muted)] font-bold">
                    {answers[currentIndex] != null ? 'Status: Answered' : 'Status: Awaiting Answer'}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <h2 className="text-xl sm:text-2xl md:text-3xl font-display-bold leading-tight text-[var(--av-ink)] mb-6">
                {currentQ.text}
              </h2>

              {/* Question supporting image (renders only if exist in database) */}
              {currentQ.supportingImage && (
                <div className="mb-6 rounded-xl overflow-hidden border border-[var(--av-border)] bg-black/20 p-2">
                  <img 
                    src={currentQ.supportingImage} 
                    alt={`Question ${currentIndex + 1}`} 
                    className="max-h-[320px] mx-auto object-contain rounded-lg"
                  />
                </div>
              )}

              {/* Option Cards */}
              <div className="space-y-3 mb-8">
                {currentQ.options.map((opt, optIndex) => {
                  const isSelected = isAnsweredAt(currentIndex) && Number(answers[currentIndex]) === optIndex;
                  const optionLetter = String.fromCharCode(65 + optIndex);
                  
                  return (
                    <label
                      key={opt.index}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isSelected 
                          ? 'border-[var(--av-cobalt)] bg-[var(--av-cobalt)]/10 shadow-md shadow-[var(--av-cobalt)]/5'
                          : 'border-[var(--av-border)] bg-transparent hover:bg-[var(--av-bg-alt)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q_${currentQ.questionId}`}
                        checked={isSelected}
                        onChange={() => handleSelectOption(currentIndex, optIndex)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-4 flex-1">
                        {/* Option Letter Icon */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border transition-colors ${
                          isSelected
                            ? 'bg-[var(--av-cobalt)] border-[var(--av-cobalt)] text-white'
                            : 'bg-[var(--av-bg-alt)] border-[var(--av-border)] text-[var(--av-ink-muted)]'
                        }`}>
                          {optionLetter}
                        </div>
                        {/* Text */}
                        <span className={`text-sm sm:text-base font-medium leading-relaxed ${
                          isSelected ? 'text-[var(--av-ink)] font-semibold' : 'text-[var(--av-ink-muted)]'
                        }`}>
                          {opt.optionText}
                        </span>
                      </div>
                      
                      {/* Checkbox indicator */}
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'border-[var(--av-cobalt)]'
                          : 'border-[var(--av-border)]'
                      }`}>
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[var(--av-cobalt)] animate-scaleIn" />
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Option Actions & Steppers */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--av-border)]">
                <Button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  variant="outline"
                  className="px-5 py-2.5 border border-[var(--av-border)] text-[var(--av-ink-muted)] hover:text-[var(--av-ink)] bg-transparent rounded-lg disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4 mr-1.5" />
                  Previous
                </Button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMarkedIndexes(prev => ({ ...prev, [currentIndex]: !prev[currentIndex] }))}
                    className={`px-5 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                      markedIndexes[currentIndex]
                        ? 'border-amber-500 bg-amber-500/20 text-amber-500'
                        : 'border-[var(--av-border)] bg-transparent text-[var(--av-ink-muted)] hover:border-amber-500 hover:text-amber-500'
                    }`}
                  >
                    {markedIndexes[currentIndex] ? 'Marked' : 'Mark For Review'}
                  </button>

                  <Button
                    onClick={handleSaveAndNext}
                    className="px-6 py-2.5 bg-[var(--av-cobalt)] hover:bg-[var(--av-cobalt-light)] text-white font-bold rounded-lg transition-all"
                  >
                    Save & Next
                    <ChevronRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>

            </div>
          </div>

          {/* Right: Flight Plan & Navigator grid */}
          <div className="space-y-6">
            
            {/* Grid selector */}
            <div className="dashboard-card p-5 border border-[var(--av-border)] bg-[var(--av-card-bg)] shadow-lg rounded-xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--av-border)]">
                <h3 className="font-display text-sm uppercase tracking-widest text-[var(--av-ink)] font-bold flex items-center gap-2">
                  <Grid className="w-4 h-4 text-[var(--av-amber)]" />
                  Navigator
                </h3>
                <span className="text-xs font-mono font-bold text-[var(--av-ink-muted)]">
                  {answeredCount}/{totalQuestions}
                </span>
              </div>

              {/* Grid Legend */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-5 text-[9px] uppercase font-bold tracking-widest text-[var(--av-ink-muted)]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 bg-[var(--av-cobalt)]/15 border border-[var(--av-cobalt)] rounded-md" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 bg-amber-500/15 border border-amber-500 rounded-md" />
                  <span>Marked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border border-[var(--av-border)] rounded-md" />
                  <span>Not Visited</span>
                </div>
              </div>

              {/* Numeric Selection Grid */}
              <div className="grid grid-cols-5 gap-2.5 mb-6 justify-items-center">
                {questions.map((q, idx) => {
                  const raw = (answers as any)[idx] ?? (answers as any)[String(idx)];
                  const hasAnswer = raw != null;
                  const isMarked = !!markedIndexes[idx];
                  const isCurrent = idx === currentIndex;

                  let cellStyle = '';
                  if (isCurrent) {
                    cellStyle = 'bg-[var(--av-cobalt)] border-2 border-[var(--av-amber)] text-white font-bold shadow-lg shadow-[var(--av-cobalt)]/25 scale-[1.05] z-10';
                  } else if (isMarked) {
                    cellStyle = 'border-amber-500 text-amber-500 bg-amber-500/5 hover:bg-amber-500/15';
                  } else if (hasAnswer) {
                    cellStyle = 'border-[var(--av-cobalt)] text-[var(--av-cobalt)] bg-[var(--av-cobalt)]/5 hover:bg-[var(--av-cobalt)]/15';
                  } else {
                    cellStyle = 'border-[var(--av-border)] text-[var(--av-ink-muted)] hover:border-[var(--av-ink)] bg-transparent';
                  }

                  return (
                    <button
                      key={q.questionId ?? idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-11 h-11 flex items-center justify-center font-mono font-bold text-xs border rounded-xl transition-all duration-200 ${cellStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Primary submit action */}
              <Button
                onClick={handleSubmit}
                className="w-full py-3 bg-[var(--av-signal)] hover:bg-[var(--av-signal)]/90 text-white font-bold rounded-lg uppercase tracking-wider text-xs transition-all shadow-md shadow-red-500/10"
              >
                Submit & Finish Exam
              </Button>
            </div>

            {/* Warning / Hint Alert Panel */}
            <div className="p-4 rounded-xl border border-amber-500/20 border-l-4 border-l-amber-500 bg-amber-500/5 text-amber-500/90 text-xs leading-relaxed flex gap-3 items-start shadow-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500" />
              <div className="space-y-1">
                <span className="font-bold uppercase tracking-wider block">Critical Alert</span>
                <span>Ensure all questions are reviewed. Unanswered questions will receive 0 marks. Negative marking applies to incorrect answers.</span>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

export default function AttemptPaperPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#070c18]"><LoadingSpinner size="lg" /></div>}>
      <AttemptPaperPageInner />
    </Suspense>
  );
}
