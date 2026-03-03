import { useState, useEffect } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';

interface QuizQuestion {
  id: number;
  type: 'multiple_choice' | 'true_false' | 'fill_blank';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  quiz_type: string;
  difficulty: string;
  question_count: number;
  questions: QuizQuestion[];
  source_word_count: number;
  created_at: string;
  expires_at: string;
}

interface QuizHistoryProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

const QuizHistoryPage = ({ onNavigate, user, onLogout }: QuizHistoryProps) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchQuizHistory();
  }, []);

  const fetchQuizHistory = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        onNavigate('login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/quiz-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch quiz history');
      }

      if (data.success) {
        setQuizzes(data.data || []);
      } else {
        throw new Error('Failed to fetch quiz history');
      }

    } catch (error) {
      console.error('Quiz history error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load quiz history');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const startQuiz = (quiz: Quiz) => {
    localStorage.setItem('savedQuiz', JSON.stringify(quiz));
    onNavigate('quiz-generator');
  };

  const startNewQuiz = () => {
    onNavigate('quiz-generator');
  };

  const handleDeleteClick = (quizId: string) => {
    setDeleteConfirmId(quizId);
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const confirmDelete = async (quizId: string) => {
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        onNavigate('login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/quiz/${quizId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete quiz');
      }

      setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
      setDeleteConfirmId(null);

    } catch (error) {
      console.error('Delete quiz error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete quiz');
    } finally {
      setIsDeleting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-50 text-green-700';
      case 'medium': return 'bg-amber-50 text-amber-700';
      case 'hard': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'Multiple Choice';
      case 'true_false': return 'True/False';
      case 'fill_blank': return 'Fill in the Blank';
      case 'mixed': return 'Mixed';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="quiz-history" />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading quiz history...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="quiz-history" />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading History</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchQuizHistory}
              className="px-6 py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="quiz-history" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🧠</span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              My Quizzes
            </h1>
          </div>
          <p className="text-lg text-gray-600 mb-6">
            Retake your saved quizzes or create new ones from your study materials
          </p>
          
          <button
            onClick={startNewQuiz}
            className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg shadow-amber-200/50"
          >
            <span className="mr-2">✨</span>
            Create New Quiz
          </button>
        </div>

        {/* Storage Notice */}
        <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex items-start">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 text-white">
              ⏰
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-amber-800 mb-1">Quiz Expiration Notice</h3>
              <p className="text-sm text-amber-700">
                Quizzes are automatically removed <strong>7 days</strong> after creation. Make sure to retake any quizzes you want to study before they expire.
              </p>
            </div>
          </div>
        </div>

        {/* Quiz History */}
        {quizzes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl">
              🧠
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Quizzes Yet</h2>
            <p className="text-gray-600 mb-6">Generate your first quiz from any study material to get started</p>
            <button
              onClick={startNewQuiz}
              className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all"
            >
              Create Your First Quiz
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => {
              const daysRemaining = getDaysRemaining(quiz.expires_at);
              return (
                <div
                  key={quiz.id}
                  className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md hover:border-amber-200 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        {quiz.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDate(quiz.created_at)}
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                          {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                        </span>
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                          {getTypeLabel(quiz.quiz_type)}
                        </span>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                          {quiz.question_count} Questions
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                          daysRemaining <= 2 ? 'bg-red-50 text-red-700' : 'bg-purple-50 text-purple-700'
                        }`}>
                          {daysRemaining <= 0 ? 'Expires today' : `${daysRemaining} days left`}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startQuiz(quiz)}
                        className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all font-medium text-sm"
                      >
                        Take Quiz
                      </button>
                      
                      <button
                        onClick={() => handleDeleteClick(quiz.id)}
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Delete quiz"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Question Types Preview */}
                  {quiz.questions && quiz.questions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                      <span className="text-sm text-gray-500 font-medium">Sample questions:</span>
                      {quiz.questions.slice(0, 2).map((q, index) => (
                        <span
                          key={index}
                          className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs max-w-xs truncate"
                        >
                          {q.question.length > 50 ? q.question.substring(0, 50) + '...' : q.question}
                        </span>
                      ))}
                      {quiz.questions.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{quiz.questions.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Quiz?</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this quiz? This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center font-medium"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default QuizHistoryPage;
