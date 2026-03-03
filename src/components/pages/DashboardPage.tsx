import { useState, useEffect } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import { DocumentCardSkeleton } from '../common/LoadingSpinner';
import AnalysisAnimation from '../common/AnalysisAnimation';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

interface DashboardProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
  initialMode?: 'analyze' | 'citations' | 'humanize' | 'summarize' | 'quiz';
}

const Dashboard = ({ onNavigate, user, onLogout, initialMode = 'analyze' }: DashboardProps) => {
  const [inputText, setInputText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showWordWarning, setShowWordWarning] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnalysisPopup, setShowAnalysisPopup] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [mode, setMode] = useState<'analyze' | 'citations' | 'humanize' | 'summarize' | 'quiz'>(initialMode);

  // Sync tab when navigating to dashboard via footer (e.g. "Analyze Essay" or "Citations")
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const [citationStyle, setCitationStyle] = useState('APA');
  const [citationYearRange, setCitationYearRange] = useState('all');
  const [isSearchingCitations, setIsSearchingCitations] = useState(false);
  const [showSearchAnimation, setShowSearchAnimation] = useState(false);
  const [humanizeMode, setHumanizeMode] = useState<'standard' | 'academic' | 'casual' | 'creative'>('standard');
  const [humanizeIntensity, setHumanizeIntensity] = useState<'light' | 'medium' | 'aggressive'>('medium');
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [humanizedResult, setHumanizedResult] = useState('');
  const [showHumanizeResult, setShowHumanizeResult] = useState(false);
  const [humanizeCopied, setHumanizeCopied] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  
  // Summarizer state
  const [summaryStyle, setSummaryStyle] = useState<'bullet' | 'paragraph' | 'tldr' | 'detailed'>('bullet');
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<{ summary: string; originalWordCount: number; summaryWordCount: number } | null>(null);
  const [summaryError, setSummaryError] = useState('');
  const [summaryCopied, setSummaryCopied] = useState(false);
  
  // Quiz generator state
  const [quizType, setQuizType] = useState<'mixed' | 'multiple_choice' | 'true_false' | 'fill_blank'>('mixed');
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [quizQuestionCount, setQuizQuestionCount] = useState(10);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [quizError, setQuizError] = useState('');
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{questionId: number; answer: string; isCorrect: boolean}[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const [usageStats, setUsageStats] = useState({
    documentsUploaded: 0,
    documentsAnalyzed: 0,
    storageUsed: 0,
    storageLimit: 0,
    uploadsRemaining: 0,
    analysesRemaining: 0,
    plan: 'free',
    planLimits: {
      documentsPerMonth: 3,
      analysesPerMonth: 3,
      maxDocumentSize: 1024 * 1024,
      name: 'Free'
    }
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const analyzePlaceholders = [
    "Paste your essay or research paper here...",
    "Get instant AI feedback on your writing...",
    "Improve your academic writing in seconds..."
  ];

  const citationPlaceholders = [
    "Enter your research topic to find citations...",
    "What are you researching? Find sources instantly...",
    "Type your essay question and discover literature..."
  ];

  const humanizePlaceholders = [
    "Paste your AI-generated text here to humanize it...",
    "Transform AI text into natural human writing...",
    "Make your text undetectable by AI checkers..."
  ];

  const summarizePlaceholders = [
    "Paste your article, paper, or document to summarize...",
    "Transform lengthy content into key points...",
    "Get concise summaries in seconds..."
  ];

  const quizPlaceholders = [
    "Paste content to generate quiz questions...",
    "Turn any text into an interactive quiz...",
    "Test your knowledge with AI-generated questions..."
  ];

  const placeholders = mode === 'humanize' ? humanizePlaceholders 
    : mode === 'summarize' ? summarizePlaceholders 
    : mode === 'quiz' ? quizPlaceholders 
    : mode === 'analyze' ? analyzePlaceholders 
    : citationPlaceholders;

  const suggestedTopics = mode === 'analyze' ? [
    "Analyze my essay structure",
    "Check my thesis statement",
    "Review my argument flow",
    "Improve my conclusion"
  ] : [
    "Effects of social media on teenagers",
    "Climate change mitigation strategies",
    "AI in healthcare applications",
    "Remote work productivity research"
  ];

  // Character illustration component - same as landing page (man with hands gripping the box)
  const CharacterIllustration = () => (
    <>
      {/* Mobile version - small head peeking over top-right corner */}
      <div className="absolute -right-2 -top-9 w-14 h-14 sm:hidden pointer-events-none z-20">
        <svg viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="35" cy="28" r="20" fill="#E8B796" />
          <path d="M15 24 Q14 8 28 4 Q35 1 42 4 Q56 8 55 24 Q52 16 42 12 Q35 8 28 12 Q18 16 15 24" fill="#4A3728" />
          <path d="M15 24 Q10 30 15 36" fill="#4A3728" />
          <path d="M55 24 Q60 30 55 36" fill="#4A3728" />
          <ellipse cx="28" cy="28" rx="3" ry="3.5" fill="#1F2937" />
          <ellipse cx="42" cy="28" rx="3" ry="3.5" fill="#1F2937" />
          <circle cx="29" cy="26.5" r="1.2" fill="white" />
          <circle cx="43" cy="26.5" r="1.2" fill="white" />
          <path d="M28 40 Q35 46 42 40" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="20" cy="34" r="3" fill="#FECACA" opacity="0.5" />
          <circle cx="50" cy="34" r="3" fill="#FECACA" opacity="0.5" />
          <ellipse cx="26" cy="55" rx="6" ry="5" fill="#E8B796" />
          <ellipse cx="44" cy="55" rx="6" ry="5" fill="#E8B796" />
        </svg>
      </div>

      {/* Desktop - man peeking from behind right edge, hands gripping the top */}
      <div className="absolute hidden sm:block -right-4 xl:-right-10 pointer-events-none z-20" style={{ top: '-110px', width: '120px', height: '160px' }}>
        <svg viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Body - light blue shirt, cut off at bottom (behind the box) */}
          <path d="M35 105 Q35 130 60 138 Q85 130 85 105" fill="#60A5FA" />
          <path d="M48 101 L60 112 L72 101" stroke="#3B82F6" strokeWidth="2" fill="none" />
          {/* Neck */}
          <rect x="52" y="88" width="16" height="18" rx="2" fill="#E8B796" />
          {/* Head */}
          <ellipse cx="60" cy="52" rx="30" ry="34" fill="#E8B796" />
          {/* Hair - short neat brown male hair */}
          <path d="M30 44 Q28 18 44 10 Q60 2 76 10 Q92 18 90 44 Q88 30 76 22 Q60 12 44 22 Q32 30 30 44" fill="#4A3728" />
          <path d="M30 44 Q24 52 30 62" fill="#4A3728" />
          <path d="M90 44 Q96 52 90 62" fill="#4A3728" />
          {/* Eyes - looking left toward the text box */}
          <ellipse cx="48" cy="50" rx="4.5" ry="5.5" fill="#1F2937" />
          <ellipse cx="72" cy="50" rx="4.5" ry="5.5" fill="#1F2937" />
          <circle cx="46" cy="48" r="2" fill="white" />
          <circle cx="70" cy="48" r="2" fill="white" />
          {/* Eyebrows - friendly */}
          <path d="M38 38 Q48 33 58 38" stroke="#4A3728" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M62 38 Q72 33 82 38" stroke="#4A3728" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Warm smile */}
          <path d="M47 70 Q60 82 73 70" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Cheeks */}
          <ellipse cx="34" cy="62" rx="5" ry="3.5" fill="#FECACA" opacity="0.5" />
          <ellipse cx="86" cy="62" rx="5" ry="3.5" fill="#FECACA" opacity="0.5" />
          {/* Left arm reaching down to grip the edge of the box */}
          <path d="M34 110 Q18 125 12 145" stroke="#E8B796" strokeWidth="11" fill="none" strokeLinecap="round" />
          {/* Left hand - fingers curled over edge */}
          <ellipse cx="10" cy="148" rx="8" ry="6" fill="#E8B796" />
          <path d="M4 144 Q3 148 5 152" stroke="#D4A574" strokeWidth="1.2" fill="none" />
          <path d="M9 143 Q8 148 10 153" stroke="#D4A574" strokeWidth="1.2" fill="none" />
          <path d="M14 144 Q13 148 15 152" stroke="#D4A574" strokeWidth="1.2" fill="none" />
          {/* Right arm reaching down */}
          <path d="M86 110 Q100 125 106 145" stroke="#E8B796" strokeWidth="11" fill="none" strokeLinecap="round" />
          {/* Right hand */}
          <ellipse cx="108" cy="148" rx="8" ry="6" fill="#E8B796" />
          <path d="M102 144 Q101 148 103 152" stroke="#D4A574" strokeWidth="1.2" fill="none" />
          <path d="M107 143 Q106 148 108 153" stroke="#D4A574" strokeWidth="1.2" fill="none" />
          <path d="M112 144 Q111 148 113 152" stroke="#D4A574" strokeWidth="1.2" fill="none" />
        </svg>
      </div>
    </>
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  useEffect(() => {
    fetchDocuments();
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/subscriptions/usage`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsageStats(data);
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const processDocuments = async (documents: any[]) => {
    const docsWithAnalysis = await Promise.all(
      documents.map(async (doc: any) => {
        const analysisResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/document/${doc.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        });
        
        let hasAnalysis = false;
        if (analysisResponse.ok) {
          const analysisResult = await analysisResponse.json();
          hasAnalysis = analysisResult.data && analysisResult.data.length > 0;
        }
        
        return { ...doc, hasAnalysis };
      })
    );
    setDocuments(docsWithAnalysis);
  };

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const { BulletproofAPI } = await import('../../config/api');
      const result = await BulletproofAPI.safeRequest(
        () => BulletproofAPI.get('/documents', token),
        { documents: [] }
      );

      if (result.success) {
        await processDocuments(result.data.documents || []);
      } else if (result.error?.includes('401')) {
          try {
            const refreshResult = await BulletproofAPI.safeRequest(
              () => BulletproofAPI.post('/auth/refresh', {}, token),
              { token: null }
            );
            
            if (refreshResult.success && refreshResult.data?.token) {
            localStorage.setItem('authToken', refreshResult.data.token);
              const retryToken = refreshResult.data.token ?? undefined;
              const retryResult = await BulletproofAPI.safeRequest(
                () => BulletproofAPI.get('/documents', retryToken),
                { documents: [] }
              );
              if (retryResult.success) {
                await processDocuments(retryResult.data.documents || []);
              }
            } else {
            onLogout();
          }
        } catch {
          onLogout();
        }
      } else {
        await processDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      await processDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isPremiumUser = usageStats.plan === 'premium';
  const isPaidUser = usageStats.plan === 'starter' || usageStats.plan === 'premium';
  const canUseQuiz = isPaidUser;
  
  const isTextValid = () => {
    if (mode === 'citations') return inputText.trim().length > 0;
    if (mode === 'humanize') return inputText.trim().length > 0;
    if (mode === 'summarize') return getWordCount(inputText) >= 50;
    if (mode === 'quiz') return getWordCount(inputText) >= 100;
    return getWordCount(inputText) >= 200;
  };

  const handleCitationSearch = async () => {
    if (inputText.trim().length === 0) {
      setShowWordWarning(true);
      setTimeout(() => setShowWordWarning(false), 3000);
      return;
    }

    try {
      setIsSearchingCitations(true);
      setShowSearchAnimation(true);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Please log in to search for citations');
        onNavigate('login');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Calculate year filter
      const currentYear = new Date().getFullYear();
      let minYear = null;
      if (citationYearRange !== 'all') {
        minYear = currentYear - parseInt(citationYearRange);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/citation-search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          researchTopic: inputText,
          citationStyle: citationStyle,
          numberOfCitations: 10,
          minYear: minYear,
          yearRange: citationYearRange
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Citation search failed');
      }

      if (data.success && data.data) {
        localStorage.setItem('citationSearchResults', JSON.stringify(data.data));
        onNavigate('citation-results');
      } else {
        throw new Error('No citation results received');
      }

    } catch (error) {
      console.error('Citation search error:', error);
      alert(error instanceof Error ? error.message : 'Failed to search for citations. Please try again.');
    } finally {
      setIsSearchingCitations(false);
      setShowSearchAnimation(false);
    }
  };

  const handleAnalyze = () => {
    const wordCount = getWordCount(inputText);
    
    if (wordCount < 200) {
      setShowWordWarning(true);
      setTimeout(() => setShowWordWarning(false), 3000);
      return;
    }
    
    setShowAnalysisPopup(true);
    setAnalysisComplete(false);
    localStorage.setItem('textAnalysisContent', inputText);
    
    setTimeout(() => setAnalysisComplete(true), 2000);
    setTimeout(() => {
      setShowAnalysisPopup(false);
      setAnalysisComplete(false);
      onNavigate('analysis');
    }, 4000);
  };

  const [humanizeWordsUsed, setHumanizeWordsUsed] = useState(0);
  const [humanizeWordLimit, setHumanizeWordLimit] = useState(1000);
  const [humanizeError, setHumanizeError] = useState('');

  useEffect(() => {
    if (mode === 'humanize') {
      const token = localStorage.getItem('authToken');
      if (token) {
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/humanize-usage`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(r => r.json())
          .then(data => {
            if (data.success) {
              setHumanizeWordsUsed(data.data.wordsUsed);
              setHumanizeWordLimit(data.data.wordLimit);
            }
          })
          .catch(() => {});
      }
    }
  }, [mode, showHumanizeResult]);

  const handleHumanize = async () => {
    if (inputText.trim().length === 0) return;

    setIsHumanizing(true);
    setHumanizedResult('');
    setShowHumanizeResult(false);
    setHumanizeError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/humanize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: inputText,
          mode: humanizeMode,
          intensity: humanizeIntensity
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429 && data.upgrade) {
          setHumanizeError(data.message);
        } else if (response.status === 429) {
          setHumanizeError(data.message);
        } else {
          throw new Error(data.message || 'Humanization failed');
        }
        return;
      }

      setHumanizedResult(data.data.humanizedText);
      setShowHumanizeResult(true);
      if (data.data.wordsUsed !== undefined) {
        setHumanizeWordsUsed(data.data.wordsUsed);
        setHumanizeWordLimit(data.data.wordLimit);
      }
    } catch (error: any) {
      console.error('Humanize error:', error);
      setHumanizeError(error.message || 'Humanization failed. Please try again.');
    } finally {
      setIsHumanizing(false);
    }
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setSummaryError('');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: inputText, style: summaryStyle, length: summaryLength })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Summarization failed');
      setSummaryResult(data.data);
    } catch (error: any) {
      setSummaryError(error.message || 'Summarization failed. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!canUseQuiz) {
      setQuizError('Quiz Generator requires a paid subscription. Upgrade to Starter or Premium to access.');
      return;
    }
    setIsGeneratingQuiz(true);
    setQuizError('');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/analysis/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: inputText, quizType, difficulty: quizDifficulty, questionCount: quizQuestionCount })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Quiz generation failed');
      setQuizResult(data.data);
      setIsQuizMode(true);  // Go directly to quiz mode
      setCurrentQuestion(0);
      setUserAnswers([]);
      setQuizCompleted(false);
      setSelectedAnswer('');
      setShowQuizResult(false);
    } catch (error: any) {
      setQuizError(error.message || 'Quiz generation failed. Please try again.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const exportQuizToPDF = () => {
    if (!quizResult) return;
    const doc = new jsPDF();
    let yPos = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const titleText = doc.splitTextToSize(quizResult.title || 'Quiz', 170);
    doc.text(titleText, margin, yPos);
    yPos += titleText.length * 8 + 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Type: ${quizResult.quizType} | Difficulty: ${quizResult.difficulty} | Questions: ${quizResult.questions.length}`, margin, yPos);
    yPos += 15;

    quizResult.questions.forEach((q: any, idx: number) => {
      if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const questionText = `${idx + 1}. ${q.question}`;
      const splitQuestion = doc.splitTextToSize(questionText, 170);
      doc.text(splitQuestion, margin, yPos);
      yPos += splitQuestion.length * lineHeight + 3;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (q.type === 'true_false') {
        doc.text('   [ ] True    [ ] False', margin, yPos);
        yPos += lineHeight;
      } else if (q.options) {
        q.options.forEach((opt: string) => {
          if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
          const optText = `   [ ] ${opt}`;
          const splitOpt = doc.splitTextToSize(optText, 165);
          doc.text(splitOpt, margin, yPos);
          yPos += splitOpt.length * lineHeight;
        });
      }
      yPos += 8;
    });

    doc.addPage();
    yPos = 20;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Answer Key', margin, yPos);
    yPos += 12;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    quizResult.questions.forEach((q: any, idx: number) => {
      if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
      doc.text(`${idx + 1}. ${q.correctAnswer}`, margin, yPos);
      yPos += lineHeight;
      if (q.explanation) {
        const expText = doc.splitTextToSize(`   Explanation: ${q.explanation}`, 165);
        doc.text(expText, margin, yPos);
        yPos += expText.length * lineHeight + 3;
      }
    });

    doc.save(`quiz-${Date.now()}.pdf`);
  };

  const exportQuizToDOCX = async () => {
    if (!quizResult) return;
    const children: any[] = [];

    children.push(new Paragraph({ text: quizResult.title || 'Quiz', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ children: [new TextRun({ text: `Type: ${quizResult.quizType} | Difficulty: ${quizResult.difficulty} | Questions: ${quizResult.questions.length}`, size: 20, color: '666666' })] }));
    children.push(new Paragraph({ text: '' }));

    quizResult.questions.forEach((q: any, idx: number) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${idx + 1}. ${q.question}`, bold: true })] }));
      if (q.type === 'true_false') {
        children.push(new Paragraph({ text: '   ☐ True    ☐ False' }));
      } else if (q.options) {
        q.options.forEach((opt: string) => {
          children.push(new Paragraph({ text: `   ☐ ${opt}` }));
        });
      }
      children.push(new Paragraph({ text: '' }));
    });

    children.push(new Paragraph({ text: 'Answer Key', heading: HeadingLevel.HEADING_2 }));
    quizResult.questions.forEach((q: any, idx: number) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${idx + 1}. `, bold: true }), new TextRun({ text: q.correctAnswer })] }));
      if (q.explanation) {
        children.push(new Paragraph({ children: [new TextRun({ text: `   Explanation: ${q.explanation}`, italics: true, size: 20, color: '666666' })] }));
      }
    });

    const docFile = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(docFile);
    saveAs(blob, `quiz-${Date.now()}.docx`);
  };

  const handleSubmit = () => {
    if (mode === 'humanize') {
      handleHumanize();
    } else if (mode === 'citations') {
      handleCitationSearch();
    } else if (mode === 'summarize') {
      handleSummarize();
    } else if (mode === 'quiz') {
      handleGenerateQuiz();
    } else {
      handleAnalyze();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="dashboard" />

      {/* Usage Stats Bar */}
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-center flex-wrap gap-4 sm:gap-8 text-sm">
              <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Documents:</span>
              <span className="font-medium text-gray-900">
                    {loadingStats ? '...' : `${usageStats.documentsUploaded}/${usageStats.planLimits.documentsPerMonth === -1 ? '∞' : usageStats.planLimits.documentsPerMonth}`}
              </span>
              </div>
              <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Analyses:</span>
              <span className="font-medium text-gray-900">
                    {loadingStats ? '...' : `${usageStats.documentsAnalyzed}/${usageStats.planLimits.analysesPerMonth === -1 ? '∞' : usageStats.planLimits.analysesPerMonth}`}
              </span>
              </div>
              <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">Storage:</span>
              <span className="font-medium text-gray-900">
                {loadingStats ? '...' : formatBytes(usageStats.storageUsed)}
              </span>
              </div>
              {usageStats.plan === 'free' && !loadingStats && (
                  <button
                    onClick={() => onNavigate('pricing')}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-full transition-colors"
                  >
                Upgrade
                  </button>
              )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-14 w-full min-w-0 overflow-x-hidden">
        {/* Welcome */}
        <div className="text-center mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
            {mode === 'humanize' ? (
              <>Make AI text <span className="text-violet-600">undetectable</span></>
            ) : mode === 'summarize' ? (
              <>Summarize <span className="text-teal-600">any document</span></>
            ) : mode === 'quiz' ? (
              <>Generate <span className="text-amber-600">quiz questions</span></>
            ) : mode === 'analyze' ? (
              <>Analyze your <span className="text-blue-600">academic writing</span></>
            ) : (
              <>Find <span className="text-cyan-600">citations</span> for your research</>
            )}
          </h1>
          <p className="text-lg text-gray-600">
            {mode === 'humanize'
              ? 'Paste AI-generated text to transform it into natural human writing'
              : mode === 'summarize'
              ? 'Transform lengthy papers into concise key points instantly'
              : mode === 'quiz'
              ? 'Turn any content into interactive quiz questions'
              : mode === 'analyze' 
              ? 'Paste your text to get AI-powered feedback on structure, grammar, and citations'
              : 'Enter your topic to discover relevant academic sources'
            }
          </p>
          </div>

          {/* Mode Toggle */}
        <div className="flex justify-center mb-7">
          <div className="inline-flex flex-wrap justify-center bg-gray-100 rounded-full p-1.5 gap-1">
              <button
              onClick={() => { setMode('analyze'); setInputText(''); setShowWordWarning(false); setShowHumanizeResult(false); setSummaryResult(null); setQuizResult(null); }}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all ${
                mode === 'analyze' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              Analyze Essay
              </button>
              <button
              onClick={() => { setMode('citations'); setInputText(''); setShowWordWarning(false); setShowHumanizeResult(false); setSummaryResult(null); setQuizResult(null); }}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all ${
                mode === 'citations' ? 'bg-white text-cyan-700 shadow-sm' : 'text-cyan-600 hover:text-cyan-700'
              }`}
            >
              Citations
              </button>
              <button
              onClick={() => { setMode('humanize'); setInputText(''); setShowWordWarning(false); setSummaryResult(null); setQuizResult(null); }}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all relative ${
                mode === 'humanize' ? 'bg-white text-violet-700 shadow-sm' : 'text-violet-600 hover:text-violet-700'
              }`}
            >
              Humanize
              {usageStats.plan === 'free' && <span className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-violet-600 text-white text-[10px] font-bold rounded-full leading-none">PRO</span>}
              </button>
              <button
              onClick={() => { setMode('summarize'); setInputText(''); setShowWordWarning(false); setShowHumanizeResult(false); setQuizResult(null); }}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all relative ${
                mode === 'summarize' ? 'bg-white text-teal-700 shadow-sm' : 'text-teal-600 hover:text-teal-700'
              }`}
            >
              Summarize
              </button>
              <button
              onClick={() => { setMode('quiz'); setInputText(''); setShowWordWarning(false); setShowHumanizeResult(false); setSummaryResult(null); }}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all relative ${
                mode === 'quiz' ? 'bg-white text-amber-700 shadow-sm' : 'text-amber-600 hover:text-amber-700'
              }`}
            >
              Quiz
              {usageStats.plan === 'free' && <span className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-amber-600 text-white text-[10px] font-bold rounded-full leading-none">PRO</span>}
              </button>
            </div>
          </div>

        {/* ANALYZE MODE - Upload First Design */}
        {mode === 'analyze' && (
          <>
            {/* Primary: Upload Section */}
            <div className="relative mb-8 overflow-visible">
              {/* Character illustration */}
              <CharacterIllustration />
              
              <div 
                onClick={() => onNavigate('upload')}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-blue-200 hover:border-blue-400 cursor-pointer transition-all hover:shadow-lg group"
              >
                <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Upload Your Document</h2>
                <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
                  Drop your essay, thesis, or research paper here for comprehensive AI analysis
                </p>
                <button 
                  className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-lg shadow-lg group-hover:shadow-xl"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Choose File
                </button>
                <div className="flex justify-center gap-3 mt-6">
                  <span className="px-4 py-1.5 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200">PDF</span>
                  <span className="px-4 py-1.5 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200">DOCX</span>
                  <span className="px-4 py-1.5 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200">TXT</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="px-4 text-gray-400 text-sm font-medium">or paste your text directly</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Secondary: Text Input (smaller) */}
            <div className="mb-12">
              <div className="relative bg-white rounded-2xl border border-gray-200 hover:border-gray-300 focus-within:border-blue-500 transition-colors">
                <textarea
                  value={inputText}
                  onChange={(e) => { setInputText(e.target.value); setShowWordWarning(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && isTextValid()) { e.preventDefault(); handleSubmit(); }}}
                  placeholder={placeholders[placeholderIndex]}
                  className="w-full min-h-[120px] p-5 text-gray-800 text-base border-none outline-none resize-none bg-transparent placeholder-gray-400 leading-relaxed"
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 280) + 'px';
                  }}
                />
                
                {/* Word count */}
                <div className="absolute bottom-3 left-5 text-sm text-gray-400">
                  {getWordCount(inputText)} words{getWordCount(inputText) < 200 ? ' (min 200)' : ''}
                </div>

                {/* Warning */}
                {showWordWarning && (
                  <div className="absolute -bottom-7 left-0 right-0 text-center">
                    <span className="text-sm text-red-500">Minimum 200 words required for analysis</span>
                  </div>
                )}
              </div>
              
              {/* Submit button */}
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleSubmit}
                  disabled={!isTextValid()}
                  className={`px-6 py-3 rounded-xl flex items-center justify-center transition-all font-semibold text-base ${
                    isTextValid()
                      ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-md cursor-pointer'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span className="mr-2">✨</span>
                  Analyze Text
                </button>
              </div>
            </div>
          </>
        )}

        {/* CITATIONS MODE - Text Input Primary */}
        {mode === 'citations' && (
          <>
            {/* Citation Options */}
            <div className="flex justify-center mb-5">
              <div className="inline-flex items-center gap-3 flex-wrap justify-center">
                <div className="inline-flex items-center bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200">
                  <span className="text-gray-500 mr-2 text-sm">Style:</span>
                  <select
                    value={citationStyle}
                    onChange={(e) => setCitationStyle(e.target.value)}
                    className="bg-transparent font-medium text-gray-900 outline-none cursor-pointer text-sm"
                  >
                    <option value="APA">APA 7th</option>
                    <option value="MLA">MLA 9th</option>
                    <option value="Chicago">Chicago</option>
                    <option value="Harvard">Harvard</option>
                    <option value="IEEE">IEEE</option>
                    <option value="Vancouver">Vancouver</option>
                  </select>
                </div>
                
                <div className="inline-flex items-center bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200">
                  <span className="text-gray-500 mr-2 text-sm">Year:</span>
                  <select
                    value={citationYearRange}
                    onChange={(e) => setCitationYearRange(e.target.value)}
                    className="bg-transparent font-medium text-gray-900 outline-none cursor-pointer text-sm"
                  >
                    <option value="all">All Time</option>
                    <option value="3">Last 3 Years</option>
                    <option value="5">Last 5 Years</option>
                    <option value="10">Last 10 Years</option>
                    <option value="15">Last 15 Years</option>
                    <option value="20">Last 20 Years</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="mb-8 relative overflow-visible">
              <CharacterIllustration />
              
              <div className="relative bg-white rounded-2xl border-2 border-gray-200 hover:border-gray-300 focus-within:border-blue-500 transition-colors">
                <textarea
                  value={inputText}
                  onChange={(e) => { setInputText(e.target.value); setShowWordWarning(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && isTextValid()) { e.preventDefault(); handleSubmit(); }}}
                  placeholder={placeholders[placeholderIndex]}
                  className="w-full min-h-[160px] sm:min-h-[180px] p-5 sm:p-6 text-gray-800 text-lg border-none outline-none resize-none bg-transparent placeholder-gray-400 leading-relaxed"
                  style={{ fontSize: '18px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 320) + 'px';
                  }}
                />
                
                <div className="absolute bottom-4 left-5 text-sm text-gray-400">
                  {inputText.length} characters
                </div>

                {showWordWarning && (
                  <div className="absolute -bottom-8 left-0 right-0 text-center">
                    <span className="text-sm text-red-500">Please enter a research topic</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleSubmit}
                  disabled={!isTextValid() || isSearchingCitations}
                  className={`px-8 py-3.5 rounded-xl flex items-center justify-center transition-all font-semibold text-base ${
                    isTextValid() && !isSearchingCitations
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg cursor-pointer'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSearchingCitations ? (
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>
                      <span className="mr-2">✨</span>
                      Find Sources
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Suggested Topics */}
            <div className="mb-12">
              <p className="text-sm text-gray-500 text-center mb-4">Suggestions</p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {suggestedTopics.map((topic, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setInputText(topic)}
                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm sm:text-base rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* HUMANIZE MODE - matches HumanizerPage design */}
        {mode === 'humanize' && (
          <>
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-violet-100/50 border border-gray-100 overflow-hidden mb-6 min-w-0">
              {/* Toolbar */}
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-gray-100 px-3 sm:px-5 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 overflow-x-auto sm:overflow-visible">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <span className="text-xs font-medium text-gray-500 flex-shrink-0">Mode:</span>
                      <div className="flex items-center bg-white rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-gray-200">
                      {([
                        { id: 'standard', label: 'Standard', tooltip: 'Natural college-student writing, clear and slightly informal' },
                        { id: 'academic', label: 'Academic', tooltip: 'Formal academic tone with technical terms, keeps citations' },
                        { id: 'casual', label: 'Casual', tooltip: 'Conversational tone, like explaining to a friend' },
                        { id: 'creative', label: 'Creative', tooltip: 'Personal essay style with varied rhythm' }
                      ] as const).map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setHumanizeMode(m.id)}
                          title={m.tooltip}
                          className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                            humanizeMode === m.id ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <span className="text-xs font-medium text-gray-500 flex-shrink-0">Intensity:</span>
                      <div className="flex items-center bg-white rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-gray-200">
                      {([
                        { id: 'light', label: 'Light', tooltip: 'Minimal changes (~15-20%), fixes obvious AI phrases' },
                        { id: 'medium', label: 'Medium', tooltip: 'Balanced rewrite (~40-50%), adds natural variation' },
                        { id: 'aggressive', label: 'Heavy', tooltip: 'Full rewrite, completely different wording, same meaning' }
                      ] as const).map((intensity) => (
                        <button
                          key={intensity.id}
                          onClick={() => setHumanizeIntensity(intensity.id)}
                          title={intensity.tooltip}
                          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                            humanizeIntensity === intensity.id ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          {intensity.label}
                        </button>
                      ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={!isTextValid() || isHumanizing}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-xl flex items-center justify-center transition-all font-semibold text-sm flex-shrink-0 ${
                      isTextValid() && !isHumanizing
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 cursor-pointer transform hover:-translate-y-0.5'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isHumanizing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Humanizing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Humanize
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Editor Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 min-w-0">
                {/* Left Panel */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-gray-50/50 border-b border-gray-100 gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0"></div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">Original</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <button onClick={() => setInputText('')} className={`text-xs text-gray-400 hover:text-gray-600 transition-colors ${!inputText ? 'invisible' : ''}`}>Clear</button>
                      <button onClick={() => navigator.clipboard.readText().then(text => setInputText(text))} className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        Paste
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={inputText}
                    onChange={(e) => { setInputText(e.target.value); setShowWordWarning(false); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && isTextValid()) { e.preventDefault(); handleSubmit(); }}}
                    placeholder={placeholders[placeholderIndex]}
                    disabled={isHumanizing}
                    className="w-full min-w-0 min-h-[240px] sm:min-h-[280px] md:min-h-[350px] p-3 sm:p-5 text-gray-800 text-[15px] border-none outline-none resize-none bg-transparent placeholder-gray-400 leading-relaxed"
                  />
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-gray-50/30 border-t border-gray-100">
                    <span className="text-xs text-gray-400 font-medium">{inputText.split(/\s+/).filter(Boolean).length} words</span>
                  </div>
                </div>

                {/* Right Panel */}
                <div className="flex flex-col bg-gradient-to-br from-violet-50/30 to-purple-50/30 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-2.5 sm:py-3 bg-violet-50/50 border-b border-violet-100/50 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0"></div>
                      <span className="text-xs font-semibold text-violet-600 uppercase tracking-wider">Humanized</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      {showHumanizeResult && humanizedResult && (
                        <>
                          <button
                            onClick={() => setShowHighlights(!showHighlights)}
                            className={`flex items-center gap-1 sm:gap-1.5 text-xs font-medium transition-all px-1.5 sm:px-2 py-1 rounded-lg ${
                              showHighlights ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                            <span className="hidden sm:inline">Highlights</span>
                          </button>
                          <button
                            onClick={() => { navigator.clipboard.writeText(humanizedResult); setHumanizeCopied(true); setTimeout(() => setHumanizeCopied(false), 2000); }}
                            className={`flex items-center gap-1 text-xs font-medium transition-all ${humanizeCopied ? 'text-green-600' : 'text-violet-600 hover:text-violet-700'}`}
                          >
                            {humanizeCopied ? (<> <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg> Copied! </>) : (<> <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy All </>)}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-h-[240px] sm:min-h-[280px] md:min-h-[350px] max-h-[260px] sm:max-h-[280px] md:max-h-[350px] overflow-y-auto overflow-x-hidden min-w-0">
                    {showHumanizeResult && humanizedResult ? (
                      <div className="p-3 sm:p-5 text-gray-800 text-[15px] leading-relaxed break-words">
                        {showHighlights ? (
                          (() => {
                            // Build a Set of normalized original words for O(1) lookup
                            const normalize = (word: string) => word.toLowerCase().replace(/[^\w]/g, '');
                            const originalWordSet = new Set(inputText.split(/\s+/).filter(Boolean).map(normalize));
                            const humanizedTokens = humanizedResult.split(/(\s+)/);
                            
                            return humanizedTokens.map((token, idx) => {
                              if (/^\s+$/.test(token)) {
                                return <span key={idx}>{token}</span>;
                              }
                              const existsInOriginal = originalWordSet.has(normalize(token));
                              if (!existsInOriginal) {
                                return <span key={idx} className="bg-violet-100/80 text-violet-900 underline decoration-violet-400/60 decoration-2 underline-offset-2 rounded-sm px-0.5">{token}</span>;
                              }
                              return <span key={idx}>{token}</span>;
                            });
                          })()
                        ) : (
                          humanizedResult
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 p-5">
                        {isHumanizing ? (
                          <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                              <div className="w-12 h-12 border-4 border-violet-200 rounded-full"></div>
                              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-violet-600 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium text-gray-600">Humanizing your text...</p>
                              <p className="text-xs text-gray-400 mt-1">This usually takes 5-10 seconds</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-100/50 flex items-center justify-center">
                              <svg className="w-8 h-8 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </div>
                            <p className="text-sm text-gray-500">Your humanized text will appear here</p>
                            <p className="text-xs text-gray-400 mt-1">Paste text on the left and click Humanize</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-violet-50/30 border-t border-violet-100/50">
                    <span className="text-xs text-gray-400 font-medium">{showHumanizeResult ? `${humanizedResult.split(/\s+/).filter(Boolean).length} words` : ''}</span>
                    {showHumanizeResult && humanizedResult && (
                      <button onClick={() => { setShowHumanizeResult(false); setHumanizedResult(''); }} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Clear result</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Usage Bar */}
              <div className="px-3 sm:px-5 py-3 sm:py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Monthly usage:</span>
                    {humanizeWordLimit >= 999999 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700">{humanizeWordsUsed.toLocaleString()} words used</span>
                        <span className="px-2 py-0.5 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 text-[10px] font-bold rounded-full">UNLIMITED</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${humanizeWordsUsed / humanizeWordLimit > 0.9 ? 'bg-red-500' : 'bg-gradient-to-r from-violet-500 to-purple-500'}`}
                            style={{ width: `${Math.min(100, (humanizeWordsUsed / humanizeWordLimit) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{humanizeWordsUsed.toLocaleString()} / {humanizeWordLimit.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  {humanizeWordLimit < 999999 && (
                    <button onClick={() => onNavigate('pricing')} className="text-xs text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1 transition-colors">
                      Upgrade for unlimited
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {humanizeError && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-2xl text-center">
                <p className="text-red-700 text-sm font-medium">{humanizeError}</p>
                {humanizeWordLimit < 999999 && (
                  <button onClick={() => onNavigate('pricing')} className="mt-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors">
                    Upgrade for unlimited words/month
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* SUMMARIZE MODE */}
        {mode === 'summarize' && (
          <>
            {/* Plan info banner */}
            {!isPremiumUser && (
              <div className="mb-6 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📝</span>
                  <div>
                    <p className="text-teal-800 font-medium text-sm">
                      {usageStats.plan === 'free' ? 'Free plan: 1,000 words/month' : 'Starter plan: 999,999 words/month'}
                      {!isPremiumUser && ' • Bullet + Medium only'}
                    </p>
                    <p className="text-teal-600 text-xs mt-0.5">Upgrade to Premium for all styles, lengths, and GPT-4.1 Mini</p>
                  </div>
                </div>
                <button onClick={() => onNavigate('pricing')} className="px-4 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-all">
                  Upgrade
                </button>
              </div>
            )}
            
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-teal-100/50 border border-gray-100 overflow-hidden mb-6 min-w-0">
              {/* Toolbar */}
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-gray-100 px-3 sm:px-5 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 overflow-x-auto sm:overflow-visible">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <span className="text-xs font-medium text-gray-500 flex-shrink-0">Style:</span>
                      <div className="flex items-center bg-white rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-gray-200">
                        {(['bullet', 'paragraph', 'tldr', 'detailed'] as const).map((s) => {
                          const locked = !isPremiumUser && s !== 'bullet';
                          return (
                            <button
                              key={s}
                              onClick={() => !locked && setSummaryStyle(s)}
                              disabled={locked}
                              title={locked ? 'Premium only' : ''}
                              className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap relative ${
                                locked ? 'text-gray-300 cursor-not-allowed' :
                                summaryStyle === s ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                              }`}
                            >
                              {s === 'bullet' ? 'Bullet' : s === 'paragraph' ? 'Paragraph' : s === 'tldr' ? 'TL;DR' : 'Detailed'}
                              {locked && <span className="ml-1 text-[9px]">🔒</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <span className="text-xs font-medium text-gray-500 flex-shrink-0">Length:</span>
                      <div className="flex items-center bg-white rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-gray-200">
                        {(['short', 'medium', 'long'] as const).map((l) => {
                          const locked = !isPremiumUser && l !== 'medium';
                          return (
                            <button
                              key={l}
                              onClick={() => !locked && setSummaryLength(l)}
                              disabled={locked}
                              title={locked ? 'Premium only' : ''}
                              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                                locked ? 'text-gray-300 cursor-not-allowed' :
                                summaryLength === l ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                              }`}
                            >
                              {l.charAt(0).toUpperCase() + l.slice(1)}
                              {locked && <span className="ml-1 text-[9px]">🔒</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={!isTextValid() || isSummarizing}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-xl flex items-center justify-center transition-all font-semibold text-sm flex-shrink-0 ${
                      isTextValid() && !isSummarizing
                        ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-200 cursor-pointer'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isSummarizing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Summarizing...
                      </>
                    ) : (
                      <>✨ Summarize</>
                    )}
                  </button>
                </div>
              </div>

              {/* Editor Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 min-w-0">
                {/* Left Panel */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-gray-50/50 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Original</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setInputText('')} className={`text-xs text-gray-400 hover:text-gray-600 ${!inputText ? 'invisible' : ''}`}>Clear</button>
                      <button onClick={() => navigator.clipboard.readText().then(text => setInputText(text))} className="text-xs text-teal-600 hover:text-teal-700 font-medium">Paste</button>
                    </div>
                  </div>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={placeholders[placeholderIndex]}
                    disabled={isSummarizing}
                    className="w-full min-h-[280px] sm:min-h-[350px] p-3 sm:p-5 text-gray-800 text-[15px] border-none outline-none resize-none bg-transparent placeholder-gray-400 leading-relaxed"
                  />
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-gray-50/30 border-t border-gray-100">
                    <span className={`text-xs font-medium ${getWordCount(inputText) < 50 ? 'text-amber-600' : 'text-gray-400'}`}>
                      {getWordCount(inputText)} words {getWordCount(inputText) < 50 && '(min 50)'}
                    </span>
                  </div>
                </div>

                {/* Right Panel */}
                <div className="flex flex-col bg-gradient-to-br from-teal-50/30 to-emerald-50/30 min-w-0">
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-teal-50/50 border-b border-teal-100/50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                      <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Summary</span>
                      {summaryResult && (
                        <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-[10px] font-bold rounded-full">
                          {Math.round((1 - summaryResult.summaryWordCount / summaryResult.originalWordCount) * 100)}% shorter
                        </span>
                      )}
                    </div>
                    {summaryResult && (
                      <button
                        onClick={() => { navigator.clipboard.writeText(summaryResult.summary); setSummaryCopied(true); setTimeout(() => setSummaryCopied(false), 2000); }}
                        className={`text-xs font-medium ${summaryCopied ? 'text-green-600' : 'text-teal-600 hover:text-teal-700'}`}
                      >
                        {summaryCopied ? '✓ Copied!' : 'Copy'}
                      </button>
                    )}
                  </div>
                  <div className="flex-1 min-h-[280px] sm:min-h-[350px] max-h-[350px] overflow-y-auto">
                    {summaryResult ? (
                      <div className="p-3 sm:p-5 text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                        {summaryResult.summary}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 p-5">
                        {isSummarizing ? (
                          <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                              <div className="w-12 h-12 border-4 border-teal-200 rounded-full"></div>
                              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-teal-600 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <p className="text-sm font-medium text-gray-600">Creating your summary...</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-100/50 flex items-center justify-center text-3xl">📝</div>
                            <p className="text-sm text-gray-500">Your summary will appear here</p>
                            <p className="text-xs text-gray-400 mt-1">Paste text on the left and click Summarize</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-teal-50/30 border-t border-teal-100/50">
                    <span className="text-xs text-gray-400 font-medium">{summaryResult ? `${summaryResult.summaryWordCount} words` : ''}</span>
                    {summaryResult && (
                      <button onClick={() => setSummaryResult(null)} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {summaryError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-center">
                <p className="text-red-700 text-sm font-medium">{summaryError}</p>
                {usageStats.plan === 'free' && (
                  <button onClick={() => onNavigate('pricing')} className="mt-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg">
                    Upgrade Plan
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* QUIZ MODE */}
        {mode === 'quiz' && (
          <>
            {/* Lock for free users */}
            {!canUseQuiz && (
              <div className="mb-6 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-6 text-white text-center">
                <span className="text-4xl mb-3 block">🔒</span>
                <h3 className="text-xl font-bold mb-2">Paid Feature</h3>
                <p className="text-amber-100 mb-4">Quiz Generator requires a Starter or Premium subscription</p>
                <button
                  onClick={() => onNavigate('pricing')}
                  className="px-6 py-2.5 bg-white text-amber-700 font-semibold rounded-xl hover:bg-amber-50 transition-all inline-flex items-center gap-2"
                >
                  👑 View Plans
                </button>
              </div>
            )}

            {/* Plan info banner for starter users */}
            {isPaidUser && !isPremiumUser && (
              <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🧠</span>
                  <div>
                    <p className="text-amber-800 font-medium text-sm">Starter plan: Mixed type + Medium difficulty only</p>
                    <p className="text-amber-600 text-xs mt-0.5">Upgrade to Premium for all quiz types, difficulties, and GPT-4.1 Mini</p>
                  </div>
                </div>
                <button onClick={() => onNavigate('pricing')} className="px-4 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-all">
                  Upgrade
                </button>
              </div>
            )}

            {/* Quiz Taking View */}
            {quizResult && isQuizMode && (
              <div className={`bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-6 ${!canUseQuiz ? 'opacity-50 pointer-events-none' : ''}`}>
                {quizCompleted ? (
                  <div className="p-8 text-center">
                    <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 text-4xl ${userAnswers.filter(a => a.isCorrect).length / userAnswers.length >= 0.7 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}>🏆</div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
                    <div className="text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent my-4">
                      {Math.round((userAnswers.filter(a => a.isCorrect).length / userAnswers.length) * 100)}%
                    </div>
                    <p className="text-gray-600">{userAnswers.filter(a => a.isCorrect).length} out of {userAnswers.length} correct</p>
                    
                    {/* Export Buttons */}
                    <div className="flex justify-center gap-2 mt-6 mb-4">
                      <button onClick={exportQuizToPDF} className="px-4 py-2 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                        Download PDF
                      </button>
                      <button onClick={exportQuizToDOCX} className="px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                        Download DOCX
                      </button>
                    </div>
                    
                    <div className="flex justify-center gap-3">
                      <button onClick={() => { setCurrentQuestion(0); setUserAnswers([]); setQuizCompleted(false); setSelectedAnswer(''); setShowQuizResult(false); }} className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl">Try Again</button>
                      <button onClick={() => { setQuizResult(null); setIsQuizMode(false); }} className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl">New Quiz</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="h-2 bg-gray-100"><div className="h-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${((currentQuestion + 1) / quizResult.questions.length) * 100}%` }}></div></div>
                    <div className="p-6">
                      <div className="flex justify-between mb-4">
                        <span className="text-sm text-gray-500">Question {currentQuestion + 1} of {quizResult.questions.length}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${quizResult.questions[currentQuestion]?.type === 'multiple_choice' ? 'bg-blue-100 text-blue-700' : quizResult.questions[currentQuestion]?.type === 'true_false' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                          {quizResult.questions[currentQuestion]?.type?.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">{quizResult.questions[currentQuestion]?.question}</h3>
                      <div className="space-y-3 mb-6">
                        {quizResult.questions[currentQuestion]?.type === 'multiple_choice' && quizResult.questions[currentQuestion]?.options?.map((opt: string, idx: number) => {
                          const letter = opt.charAt(0);
                          const isSelected = selectedAnswer === letter;
                          const isCorrect = showQuizResult && letter === quizResult.questions[currentQuestion].correctAnswer;
                          const isWrong = showQuizResult && isSelected && letter !== quizResult.questions[currentQuestion].correctAnswer;
                          return (
                            <button key={idx} onClick={() => !showQuizResult && setSelectedAnswer(letter)} disabled={showQuizResult}
                              className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 ${isCorrect ? 'border-green-500 bg-green-50' : isWrong ? 'border-red-500 bg-red-50' : isSelected ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-300'}`}
                            >
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-amber-500 text-white' : 'bg-gray-100'}`}>{letter}</span>
                              <span>{opt.substring(3)}</span>
                            </button>
                          );
                        })}
                        {quizResult.questions[currentQuestion]?.type === 'true_false' && ['true', 'false'].map((opt) => {
                          const isSelected = selectedAnswer === opt;
                          const isCorrect = showQuizResult && opt === quizResult.questions[currentQuestion].correctAnswer;
                          const isWrong = showQuizResult && isSelected && opt !== quizResult.questions[currentQuestion].correctAnswer;
                          return (
                            <button key={opt} onClick={() => !showQuizResult && setSelectedAnswer(opt)} disabled={showQuizResult}
                              className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 ${isCorrect ? 'border-green-500 bg-green-50' : isWrong ? 'border-red-500 bg-red-50' : isSelected ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-300'}`}
                            >
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-amber-500 text-white' : 'bg-gray-100'}`}>{opt === 'true' ? '✓' : '✗'}</span>
                              <span className="capitalize font-medium">{opt}</span>
                            </button>
                          );
                        })}
                        {quizResult.questions[currentQuestion]?.type === 'fill_blank' && quizResult.questions[currentQuestion]?.options?.map((opt: string, idx: number) => {
                          const letter = opt.charAt(0);
                          const isSelected = selectedAnswer === letter;
                          const isCorrect = showQuizResult && letter === quizResult.questions[currentQuestion].correctAnswer;
                          const isWrong = showQuizResult && isSelected && letter !== quizResult.questions[currentQuestion].correctAnswer;
                          return (
                            <button key={idx} onClick={() => !showQuizResult && setSelectedAnswer(letter)} disabled={showQuizResult}
                              className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 ${isCorrect ? 'border-green-500 bg-green-50' : isWrong ? 'border-red-500 bg-red-50' : isSelected ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-300'}`}
                            >
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-amber-500 text-white' : 'bg-gray-100'}`}>{letter}</span>
                              <span>{opt.substring(3)}</span>
                            </button>
                          );
                        })}
                      </div>
                      {showQuizResult && quizResult.questions[currentQuestion]?.explanation && (
                        <div className="p-4 bg-blue-50 rounded-xl mb-6 border border-blue-100">
                          <p className="text-sm text-blue-700">💡 {quizResult.questions[currentQuestion].explanation}</p>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <button onClick={() => { if (currentQuestion > 0) { setCurrentQuestion(currentQuestion - 1); setShowQuizResult(false); setSelectedAnswer(''); } }} disabled={currentQuestion === 0} className="px-4 py-2 text-gray-600 disabled:opacity-30">← Previous</button>
                        {!showQuizResult ? (
                          <button onClick={() => {
                            const q = quizResult.questions[currentQuestion];
                            const ans = selectedAnswer;
                            const correct = ans === q.correctAnswer;
                            setUserAnswers([...userAnswers, { questionId: q.id, answer: ans, isCorrect: correct }]);
                            setShowQuizResult(true);
                          }} disabled={!selectedAnswer} className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl disabled:opacity-50">Submit</button>
                        ) : (
                          <button onClick={() => {
                            if (currentQuestion + 1 >= quizResult.questions.length) { setQuizCompleted(true); }
                            else { setCurrentQuestion(currentQuestion + 1); setSelectedAnswer(''); setShowQuizResult(false); }
                          }} className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl">
                            {currentQuestion + 1 >= quizResult.questions.length ? '🏆 See Results' : 'Next →'}
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Quiz Input Form */}
            {!quizResult && (
              <div className={`bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-amber-100/50 border border-gray-100 overflow-hidden mb-6 min-w-0 ${!canUseQuiz ? 'opacity-50 pointer-events-none' : ''}`}>
                {/* Toolbar */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-100 px-3 sm:px-5 py-3 sm:py-4">
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 overflow-x-auto sm:overflow-visible">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <span className="text-xs font-medium text-gray-500 flex-shrink-0">Type:</span>
                        <div className="flex items-center bg-white rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-gray-200">
                          {(['mixed', 'multiple_choice', 'true_false', 'fill_blank'] as const).map((t) => {
                            const locked = !isPremiumUser && t !== 'mixed';
                            return (
                              <button key={t} onClick={() => !locked && setQuizType(t)} disabled={locked} title={locked ? 'Premium only' : ''}
                                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                                  locked ? 'text-gray-300 cursor-not-allowed' :
                                  quizType === t ? 'bg-amber-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                              >
                                {t === 'mixed' ? 'Mixed' : t === 'multiple_choice' ? 'MCQ' : t === 'true_false' ? 'T/F' : 'Fill'}
                                {locked && <span className="ml-1 text-[9px]">🔒</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <span className="text-xs font-medium text-gray-500">Difficulty:</span>
                        <div className="flex items-center bg-white rounded-xl px-0.5 sm:px-1 py-1 shadow-sm border border-gray-200">
                          {(['easy', 'medium', 'hard'] as const).map((d) => {
                            const locked = !isPremiumUser && d !== 'medium';
                            return (
                              <button key={d} onClick={() => !locked && setQuizDifficulty(d)} disabled={locked} title={locked ? 'Premium only' : ''}
                                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                                  locked ? 'text-gray-300 cursor-not-allowed' :
                                  quizDifficulty === d ? 'bg-amber-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                              >
                                {d.charAt(0).toUpperCase() + d.slice(1)}
                                {locked && <span className="ml-1 text-[9px]">🔒</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs font-medium text-gray-500">Questions:</span>
                        <select value={quizQuestionCount} onChange={(e) => setQuizQuestionCount(Number(e.target.value))}
                          className="px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium"
                        >
                          {[5, 10, 15, 20, 25].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={!isTextValid() || isGeneratingQuiz || !canUseQuiz}
                      className={`w-full sm:w-auto px-6 py-2.5 rounded-xl flex items-center justify-center transition-all font-semibold text-sm flex-shrink-0 ${
                        isTextValid() && !isGeneratingQuiz && canUseQuiz
                          ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-200 cursor-pointer'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isGeneratingQuiz ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>✨ Generate Quiz</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Input Area */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-gray-50/50 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Source Material</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setInputText('')} className={`text-xs text-gray-400 hover:text-gray-600 ${!inputText ? 'invisible' : ''}`}>Clear</button>
                      <button onClick={() => navigator.clipboard.readText().then(text => setInputText(text))} className="text-xs text-amber-600 hover:text-amber-700 font-medium">Paste</button>
                    </div>
                  </div>
                  <div className="relative">
                    {isGeneratingQuiz ? (
                      <div className="min-h-[350px] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="relative">
                            <div className="w-12 h-12 border-4 border-amber-200 rounded-full"></div>
                            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-amber-600 rounded-full border-t-transparent animate-spin"></div>
                          </div>
                          <p className="text-sm font-medium text-gray-600">Creating quiz questions...</p>
                        </div>
                      </div>
                    ) : (
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={placeholders[placeholderIndex]}
                        className="w-full min-h-[300px] sm:min-h-[350px] p-3 sm:p-5 text-gray-800 text-[15px] border-none outline-none resize-none bg-transparent placeholder-gray-400 leading-relaxed"
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-gray-50/30 border-t border-gray-100">
                    <span className={`text-xs font-medium ${getWordCount(inputText) < 100 ? 'text-amber-600' : 'text-gray-400'}`}>
                      {getWordCount(inputText)} words {getWordCount(inputText) < 100 && '(min 100)'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {quizError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-center">
                <p className="text-red-700 text-sm font-medium">{quizError}</p>
                {!canUseQuiz && (
                  <button onClick={() => onNavigate('pricing')} className="mt-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg">
                    View Plans
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Recent Documents */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Recent Documents</h2>
            {documents.length > 0 && (
              <button onClick={() => onNavigate('library')} className="text-base text-blue-600 hover:text-blue-700 font-medium">
                View all →
              </button>
            )}
              </div>
          
            {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => <DocumentCardSkeleton key={i} />)}
            </div>
            ) : documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {documents.slice(0, 6).map((doc) => (
                <div 
                  key={doc.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => onNavigate('library')}
              >
                <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    {doc.hasAnalysis && (
                      <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">Analyzed</span>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 text-base mb-2 truncate">{doc.title}</h3>
                  <p className="text-sm text-gray-500">
                    {doc.fileType?.toUpperCase() || 'DOC'} • {doc.wordCount || 0} words • {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
            ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              </div>
              <p className="text-gray-500 text-base">No documents yet</p>
              <button onClick={() => onNavigate('upload')} className="mt-4 text-base text-blue-600 hover:text-blue-700 font-medium">
                Upload your first document →
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Analysis Popup */}
      {showAnalysisPopup && (
        <AnalysisAnimation
          isPopup={true}
          text="Analyzing your writing"
          isComplete={analysisComplete}
          onComplete={() => {
            setShowAnalysisPopup(false);
            setAnalysisComplete(false);
          }}
        />
      )}

      {/* Citation Search Animation - same as landing page */}
      {showSearchAnimation && (
        <AnalysisAnimation
          isPopup={true}
          text="Finding citations for your topic"
          isComplete={false}
          variant="citations"
        />
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default Dashboard;
