"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAttempts } from '@/hooks/useAttempts';
import { useContent } from '@/hooks/useContent';
import { 
  Clock, 
  CheckCircle, 
  Play, 
  Eye, 
  Trophy, 
  Calendar,
  Filter,
  Search,
  BarChart3,
  TrendingUp,
  Award,
  Target
} from 'lucide-react';

interface Attempt {
  _id: string;
  paperId: string;
  status: 'in-progress' | 'completed';
  score?: number;
  totalQuestions: number;
  correctAnswers?: number;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  paper?: {
    title: string;
    subject: string;
    price: number;
  };
}

type FilterType = 'all' | 'in-progress' | 'completed';
type SortType = 'newest' | 'oldest' | 'score-high' | 'score-low';

export default function AttemptsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);
  
  const router = useRouter();
  const { attempts, loading, error } = useAttempts();
  const { papers } = useContent();

  // Get paper details for each attempt
  const getAttemptWithPaper = (attempt: any) => {
    const paper = papers.find(p => p._id === attempt.paperId);
    return {
      ...attempt,
      paper: paper ? {
        title: paper.title,
        subject: paper.subject,
        price: paper.price
      } : null
    };
  };

  // Filter and sort attempts
  const getFilteredAttempts = () => {
    if (!attempts) return [];
    
    let filtered = attempts.map(getAttemptWithPaper);
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(attempt => 
        attempt.paper?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attempt.paper?.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(attempt => 
        filter === 'completed' ? attempt.status === 'submitted' : attempt.status === filter
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'score-high':
          return (b.score || 0) - (a.score || 0);
        case 'score-low':
          return (a.score || 0) - (b.score || 0);
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  const filteredAttempts = getFilteredAttempts();

  // Calculate statistics
  const stats = {
    total: attempts?.length || 0,
    completed: attempts?.filter(a => a.status === 'submitted').length || 0,
    inProgress: attempts?.filter(a => a.status === 'in-progress').length || 0,
    averageScore: attempts?.filter(a => a.status === 'submitted' && a.score !== undefined)
      .reduce((sum, a) => sum + (a.score || 0), 0) / 
      (attempts?.filter(a => a.status === 'submitted' && a.score !== undefined).length || 1) || 0
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
    if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
    return `${diffMins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold mb-4 text-white drop-shadow-lg">
                My Attempts
              </h1>
              <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                Track your progress and review your performance across all attempts
              </p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-white/5 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/10 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Play className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Score</p>
                <p className="text-3xl font-bold text-purple-600">{stats.averageScore.toFixed(1)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search attempts by paper title or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Filter */}
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Attempts</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="score-high">Score: High to Low</option>
                <option value="score-low">Score: Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Attempts List */}
        <div className="space-y-4">
          {filteredAttempts.length > 0 ? (
            filteredAttempts.map((attempt) => (
              <div
                key={attempt._id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">
                          {attempt.paper?.title || 'Unknown Paper'}
                        </h3>
                        <span className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-sm font-semibold px-3 py-1.5 rounded-full">
                          {attempt.paper?.subject || 'Unknown Subject'}
                        </span>
                        <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                          attempt.status === 'submitted' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {attempt.status === 'submitted' ? 'Completed' : 'In Progress'}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          Started: {formatDate(attempt.createdAt)}
                        </div>
                        {attempt.submittedAt && (
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completed: {formatDate(attempt.submittedAt)}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          Duration: {formatDuration(attempt.createdAt, attempt.submittedAt)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {attempt.status === 'submitted' && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {attempt.score || 0}/{attempt.totalQuestions}
                          </div>
                          <div className="text-sm text-gray-500">
                            {attempt.correctAnswers || 0} correct
                          </div>
                        </div>
                      )}
                      
                      <Button
                        onClick={() => {
                          if (attempt.status === 'in-progress') {
                            router.push(`/subscriptions/attempts/attempt-paper?attemptId=${attempt._id}`);
                          } else {
                            router.push(`/subscriptions/attempts/attempt-reviews?attemptId=${attempt._id}`);
                          }
                        }}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                      >
                        {attempt.status === 'in-progress' ? (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Resume
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            View Results
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20">
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 max-w-md mx-auto shadow-lg border border-white/50">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchQuery || filter !== 'all' ? 'No attempts found' : 'No attempts yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || filter !== 'all' 
                    ? 'Try adjusting your search or filter criteria' 
                    : 'Start attempting papers to see your progress here'
                  }
                </p>
                {!searchQuery && filter === 'all' && (
                  <Button 
                    onClick={() => router.push('/subscriptions')}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                  >
                    Go to Subscriptions
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
