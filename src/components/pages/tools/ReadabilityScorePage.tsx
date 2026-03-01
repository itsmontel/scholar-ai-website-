import { useState, useEffect } from 'react';
import Header from '../../common/Header';
import Footer from '../../common/Footer';

interface ReadabilityScorePageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout: () => void;
}

interface ReadabilityScores {
  fleschKincaid: number;
  fleschReadingEase: number;
  gunningFog: number;
  smogIndex: number;
  colemanLiau: number;
  automatedReadability: number;
  averageGradeLevel: number;
  gradeLevel: string;
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;
  avgCharsPerWord: number;
  complexWords: number;
  complexWordsPercent: number;
  longSentences: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  characterCount: number;
}

const ReadabilityScorePage = ({ onNavigate, user, onLogout }: ReadabilityScorePageProps) => {
  const [text, setText] = useState('');
  const [scores, setScores] = useState<ReadabilityScores | null>(null);

  const countSyllables = (word: string): number => {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;
    
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    
    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? Math.max(1, syllables.length) : 1;
  };

  const isComplexWord = (word: string): boolean => {
    return countSyllables(word) >= 3;
  };

  const isPolysyllabic = (word: string): boolean => {
    const syllables = countSyllables(word);
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    const isCommonSuffix = /(?:es|ed|ing|ly)$/.test(cleanWord);
    return syllables >= 3 && !(syllables === 3 && isCommonSuffix);
  };

  useEffect(() => {
    if (!text.trim()) {
      setScores(null);
      return;
    }

    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    if (words.length === 0 || sentences.length === 0) {
      setScores(null);
      return;
    }

    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const paragraphCount = Math.max(1, paragraphs.length);
    const characterCount = text.replace(/\s/g, '').length;
    
    const totalSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
    const complexWordCount = words.filter(isComplexWord).length;
    const polysyllabicCount = words.filter(isPolysyllabic).length;
    const totalChars = words.reduce((sum, word) => sum + word.replace(/[^a-zA-Z]/g, '').length, 0);

    const avgWordsPerSentence = wordCount / sentenceCount;
    const avgSyllablesPerWord = totalSyllables / wordCount;
    const avgCharsPerWord = totalChars / wordCount;
    
    const longSentences = sentences.filter(s => s.trim().split(/\s+/).length > 25).length;

    // Flesch-Kincaid Grade Level
    const fleschKincaid = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
    
    // Flesch Reading Ease
    const fleschReadingEase = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

    // Gunning Fog Index
    const gunningFog = 0.4 * (avgWordsPerSentence + 100 * (complexWordCount / wordCount));

    // SMOG Index (Simple Measure of Gobbledygook)
    const smogIndex = sentenceCount >= 30 
      ? 1.0430 * Math.sqrt(polysyllabicCount * (30 / sentenceCount)) + 3.1291
      : 1.0430 * Math.sqrt(polysyllabicCount * (30 / Math.max(sentenceCount, 1))) + 3.1291;

    // Coleman-Liau Index
    const L = (totalChars / wordCount) * 100;
    const S = (sentenceCount / wordCount) * 100;
    const colemanLiau = 0.0588 * L - 0.296 * S - 15.8;

    // Automated Readability Index
    const automatedReadability = 4.71 * (totalChars / wordCount) + 0.5 * (wordCount / sentenceCount) - 21.43;

    // Average grade level from all formulas
    const validScores = [fleschKincaid, gunningFog, smogIndex, colemanLiau, automatedReadability].filter(s => !isNaN(s) && isFinite(s));
    const averageGradeLevel = validScores.reduce((a, b) => a + b, 0) / validScores.length;

    // Determine grade level description
    let gradeLevel = '';
    const avg = Math.round(averageGradeLevel);
    if (avg <= 5) gradeLevel = '5th Grade or below';
    else if (avg <= 6) gradeLevel = '6th Grade';
    else if (avg <= 7) gradeLevel = '7th Grade';
    else if (avg <= 8) gradeLevel = '8th Grade';
    else if (avg <= 9) gradeLevel = '9th Grade (Freshman)';
    else if (avg <= 10) gradeLevel = '10th Grade (Sophomore)';
    else if (avg <= 11) gradeLevel = '11th Grade (Junior)';
    else if (avg <= 12) gradeLevel = '12th Grade (Senior)';
    else if (avg <= 14) gradeLevel = 'College';
    else if (avg <= 16) gradeLevel = 'College Graduate';
    else gradeLevel = 'Professional / Graduate';

    setScores({
      fleschKincaid: Math.max(0, fleschKincaid),
      fleschReadingEase: Math.min(100, Math.max(0, fleschReadingEase)),
      gunningFog: Math.max(0, gunningFog),
      smogIndex: Math.max(0, smogIndex),
      colemanLiau: Math.max(0, colemanLiau),
      automatedReadability: Math.max(0, automatedReadability),
      averageGradeLevel: Math.max(0, averageGradeLevel),
      gradeLevel,
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
      avgCharsPerWord: Math.round(avgCharsPerWord * 10) / 10,
      complexWords: complexWordCount,
      complexWordsPercent: Math.round((complexWordCount / wordCount) * 100),
      longSentences,
      wordCount,
      sentenceCount,
      paragraphCount,
      characterCount
    });
  }, [text]);

  const getReadingEaseLabel = (score: number): { label: string; color: string; audience: string } => {
    if (score >= 90) return { label: 'Very Easy', color: 'text-green-600', audience: 'Average 5th grader' };
    if (score >= 80) return { label: 'Easy', color: 'text-green-500', audience: 'Average 6th grader' };
    if (score >= 70) return { label: 'Fairly Easy', color: 'text-blue-500', audience: '7th grader' };
    if (score >= 60) return { label: 'Standard', color: 'text-blue-600', audience: '8th-9th grader' };
    if (score >= 50) return { label: 'Fairly Difficult', color: 'text-yellow-600', audience: 'High school student' };
    if (score >= 30) return { label: 'Difficult', color: 'text-orange-500', audience: 'College student' };
    return { label: 'Very Difficult', color: 'text-red-500', audience: 'College graduate' };
  };

  const getProgressColor = (score: number): string => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-blue-500';
    if (score >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getGradeLevelColor = (grade: number): string => {
    if (grade <= 8) return 'text-green-600';
    if (grade <= 12) return 'text-blue-600';
    if (grade <= 16) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-white">
      {user ? (
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="readability-score" />
      ) : (
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-18 py-4">
              <a href="/" onClick={(e) => { e.preventDefault(); onNavigate('landing'); }} className="flex items-center space-x-2.5">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">W</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">WriteScholar</span>
              </a>
              
              <div className="hidden md:flex items-center space-x-2">
                <a href="/features" onClick={(e) => { e.preventDefault(); onNavigate('features'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">Features</a>
                <a href="/pricing" onClick={(e) => { e.preventDefault(); onNavigate('pricing'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">Pricing</a>
                <a href="/blog" onClick={(e) => { e.preventDefault(); onNavigate('blog'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">Blog</a>
                <a href="/about" onClick={(e) => { e.preventDefault(); onNavigate('about'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">About</a>
              </div>
              
              <div className="flex items-center space-x-3">
                <a href="/login" onClick={(e) => { e.preventDefault(); onNavigate('login'); }} className="hidden sm:inline-flex px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-colors">Log in</a>
                <a href="/signup" onClick={(e) => { e.preventDefault(); onNavigate('signup'); }} className="px-5 py-2.5 bg-gray-900 text-white text-base font-medium rounded-xl hover:bg-gray-800 transition-colors">
                  Get Started
                </a>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Hero Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-purple-50/50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 mb-6 shadow-lg shadow-purple-100">
              <svg viewBox="0 0 56 56" fill="none" className="w-16 h-16">
                <circle cx="28" cy="28" r="28" fill="#F3E8FF"/>
                <ellipse cx="28" cy="30" rx="14" ry="15" fill="#FCD9B6"/>
                <path d="M14 24 Q12 12 22 10 Q28 8 34 10 Q44 12 42 24 Q40 18 34 14 Q28 10 22 14 Q16 18 14 24" fill="#8B6914"/>
                <path d="M14 24 Q10 28 14 34" fill="#8B6914"/>
                <path d="M42 24 Q46 28 42 34" fill="#8B6914"/>
                <ellipse cx="21" cy="30" rx="6" ry="5" fill="none" stroke="#374151" strokeWidth="2"/>
                <ellipse cx="35" cy="30" rx="6" ry="5" fill="none" stroke="#374151" strokeWidth="2"/>
                <path d="M27 30 L29 30" stroke="#374151" strokeWidth="2"/>
                <path d="M15 28 L12 26" stroke="#374151" strokeWidth="2"/>
                <path d="M41 28 L44 26" stroke="#374151" strokeWidth="2"/>
                <ellipse cx="21" cy="31" rx="2.5" ry="3" fill="#1F2937"/>
                <ellipse cx="35" cy="31" rx="2.5" ry="3" fill="#1F2937"/>
                <circle cx="22" cy="30" r="0.8" fill="white"/>
                <circle cx="36" cy="30" r="0.8" fill="white"/>
                <path d="M24 42 Q28 47 32 42" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <ellipse cx="17" cy="36" rx="3" ry="2" fill="#FECACA" opacity="0.4"/>
                <ellipse cx="39" cy="36" rx="3" ry="2" fill="#FECACA" opacity="0.4"/>
              </svg>
            </div>
            <span className="inline-flex items-center px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-5">
              Free Tool
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
              Readability Score Calculator
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
              Analyze your text with 6 different readability formulas including Flesch-Kincaid, Gunning Fog, SMOG, Coleman-Liau, and more.
            </p>
          </div>
        </div>
      </section>

      {/* Main Tool Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Text Input Area */}
            <div className="lg:col-span-3">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Your Text</h2>
                  <button
                    onClick={() => setText('')}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all font-medium"
                  >
                    Clear
                  </button>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste or type your text here to analyze its readability. For best results, use at least 100 words..."
                  className="w-full h-80 p-4 text-gray-700 bg-gray-50 border-0 rounded-xl outline-none resize-none placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                />
                
                {/* Quick Stats */}
                {scores && (
                  <div className="mt-4 grid grid-cols-4 gap-4 text-center">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-2xl font-bold text-gray-900">{scores.wordCount}</div>
                      <div className="text-xs text-gray-500">Words</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-2xl font-bold text-gray-900">{scores.sentenceCount}</div>
                      <div className="text-xs text-gray-500">Sentences</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-2xl font-bold text-gray-900">{scores.paragraphCount}</div>
                      <div className="text-xs text-gray-500">Paragraphs</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-2xl font-bold text-gray-900">{scores.characterCount}</div>
                      <div className="text-xs text-gray-500">Characters</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scores Panel */}
            <div className="lg:col-span-2 space-y-6">
              {scores ? (
                <>
                  {/* Main Score */}
                  <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
                    <h3 className="text-lg font-semibold mb-2 opacity-90">Flesch Reading Ease</h3>
                    <div className="text-5xl font-bold mb-1">{Math.round(scores.fleschReadingEase)}</div>
                    <div className={`text-lg font-medium text-white/90`}>
                      {getReadingEaseLabel(scores.fleschReadingEase).label}
                    </div>
                    <div className="text-sm opacity-70 mt-1">
                      Suitable for: {getReadingEaseLabel(scores.fleschReadingEase).audience}
                    </div>
                    <div className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full ${getProgressColor(scores.fleschReadingEase)} transition-all duration-500`}
                        style={{ width: `${scores.fleschReadingEase}%` }}
                      />
                    </div>
                  </div>

                  {/* Average Grade Level */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Grade Level</h3>
                    <div className="text-center py-2">
                      <div className={`text-4xl font-bold ${getGradeLevelColor(scores.averageGradeLevel)}`}>
                        {scores.averageGradeLevel.toFixed(1)}
                      </div>
                      <div className="text-purple-600 font-medium mt-1">{scores.gradeLevel}</div>
                      <p className="text-xs text-gray-500 mt-2">Average across 5 readability formulas</p>
                    </div>
                  </div>

                  {/* Individual Formula Scores */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Readability Formulas</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">Flesch-Kincaid Grade</span>
                          <span className={`font-bold ${getGradeLevelColor(scores.fleschKincaid)}`}>{scores.fleschKincaid.toFixed(1)}</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-purple-500 transition-all" style={{ width: `${Math.min(100, (scores.fleschKincaid / 20) * 100)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">Gunning Fog Index</span>
                          <span className={`font-bold ${getGradeLevelColor(scores.gunningFog)}`}>{scores.gunningFog.toFixed(1)}</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, (scores.gunningFog / 20) * 100)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">SMOG Index</span>
                          <span className={`font-bold ${getGradeLevelColor(scores.smogIndex)}`}>{scores.smogIndex.toFixed(1)}</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-green-500 transition-all" style={{ width: `${Math.min(100, (scores.smogIndex / 20) * 100)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">Coleman-Liau Index</span>
                          <span className={`font-bold ${getGradeLevelColor(scores.colemanLiau)}`}>{scores.colemanLiau.toFixed(1)}</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-orange-500 transition-all" style={{ width: `${Math.min(100, (scores.colemanLiau / 20) * 100)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">Automated Readability</span>
                          <span className={`font-bold ${getGradeLevelColor(scores.automatedReadability)}`}>{scores.automatedReadability.toFixed(1)}</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-pink-500 transition-all" style={{ width: `${Math.min(100, (scores.automatedReadability / 20) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Text Statistics */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Writing Analysis</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Avg. words per sentence</span>
                        <span className={`font-semibold ${scores.avgWordsPerSentence > 25 ? 'text-red-600' : scores.avgWordsPerSentence > 20 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {scores.avgWordsPerSentence}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Avg. syllables per word</span>
                        <span className={`font-semibold ${scores.avgSyllablesPerWord > 2 ? 'text-red-600' : scores.avgSyllablesPerWord > 1.6 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {scores.avgSyllablesPerWord}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Avg. characters per word</span>
                        <span className="font-semibold text-gray-900">{scores.avgCharsPerWord}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Complex words (3+ syllables)</span>
                        <span className={`font-semibold ${scores.complexWordsPercent > 30 ? 'text-red-600' : scores.complexWordsPercent > 20 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {scores.complexWords} ({scores.complexWordsPercent}%)
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Long sentences (25+ words)</span>
                        <span className={`font-semibold ${scores.longSentences > 3 ? 'text-red-600' : scores.longSentences > 1 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {scores.longSentences}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter Your Text</h3>
                  <p className="text-gray-500 text-sm">Paste or type text in the editor to see readability scores from 6 different formulas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Formula Explanations */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Understanding Readability Formulas</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                <span className="text-purple-600 font-bold">FK</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Flesch-Kincaid</h3>
              <p className="text-gray-600 text-sm">Based on sentence length and syllables per word. The most widely used formula, especially in education.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <span className="text-blue-600 font-bold">GF</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Gunning Fog</h3>
              <p className="text-gray-600 text-sm">Estimates years of formal education needed. Focuses on complex words (3+ syllables) and sentence length.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                <span className="text-green-600 font-bold">SM</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">SMOG Index</h3>
              <p className="text-gray-600 text-sm">Designed for healthcare materials. Counts polysyllabic words to determine reading level.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                <span className="text-orange-600 font-bold">CL</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Coleman-Liau</h3>
              <p className="text-gray-600 text-sm">Uses characters per word instead of syllables. More reliable for machine-processed text.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center mb-4">
                <span className="text-pink-600 font-bold">AR</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Automated Readability</h3>
              <p className="text-gray-600 text-sm">Uses character count and sentence length. Good for real-time text analysis.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                <span className="text-indigo-600 font-bold">FE</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Flesch Reading Ease</h3>
              <p className="text-gray-600 text-sm">Scores 0-100 (higher = easier). The inverse of Flesch-Kincaid, focused on ease rather than grade.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Tips to Improve Readability</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Shorter Sentences</h3>
              <p className="text-gray-600 text-sm">Aim for 15-20 words per sentence. Break long sentences into smaller ones.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Simple Words</h3>
              <p className="text-gray-600 text-sm">Use common words when possible. Replace "utilize" with "use", "commence" with "start".</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Active Voice</h3>
              <p className="text-gray-600 text-sm">Prefer "The team completed" over "It was completed by the team".</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Break It Up</h3>
              <p className="text-gray-600 text-sm">Use paragraphs, bullet points, and headings to organize content visually.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Score Guide */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Flesch Reading Ease Score Guide</h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Score</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Difficulty</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Grade Level</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td className="px-6 py-3 text-green-600 font-medium">90-100</td><td className="px-6 py-3 text-gray-700">Very Easy</td><td className="px-6 py-3 text-gray-700">5th grade</td><td className="px-6 py-3 text-gray-500 hidden sm:table-cell">Comics, children's books</td></tr>
                <tr><td className="px-6 py-3 text-green-500 font-medium">80-89</td><td className="px-6 py-3 text-gray-700">Easy</td><td className="px-6 py-3 text-gray-700">6th grade</td><td className="px-6 py-3 text-gray-500 hidden sm:table-cell">Consumer ads, tabloids</td></tr>
                <tr><td className="px-6 py-3 text-blue-500 font-medium">70-79</td><td className="px-6 py-3 text-gray-700">Fairly Easy</td><td className="px-6 py-3 text-gray-700">7th grade</td><td className="px-6 py-3 text-gray-500 hidden sm:table-cell">Movie reviews, sports news</td></tr>
                <tr><td className="px-6 py-3 text-blue-600 font-medium">60-69</td><td className="px-6 py-3 text-gray-700">Standard</td><td className="px-6 py-3 text-gray-700">8-9th grade</td><td className="px-6 py-3 text-gray-500 hidden sm:table-cell">Time, Newsweek</td></tr>
                <tr><td className="px-6 py-3 text-yellow-600 font-medium">50-59</td><td className="px-6 py-3 text-gray-700">Fairly Difficult</td><td className="px-6 py-3 text-gray-700">High school</td><td className="px-6 py-3 text-gray-500 hidden sm:table-cell">Wall Street Journal</td></tr>
                <tr><td className="px-6 py-3 text-orange-500 font-medium">30-49</td><td className="px-6 py-3 text-gray-700">Difficult</td><td className="px-6 py-3 text-gray-700">College</td><td className="px-6 py-3 text-gray-500 hidden sm:table-cell">Academic papers</td></tr>
                <tr><td className="px-6 py-3 text-red-500 font-medium">0-29</td><td className="px-6 py-3 text-gray-700">Very Difficult</td><td className="px-6 py-3 text-gray-700">Graduate</td><td className="px-6 py-3 text-gray-500 hidden sm:table-cell">Scientific journals, legal docs</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Want deeper writing analysis?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            WriteScholar provides comprehensive AI feedback on grammar, structure, academic style, and more to help perfect your papers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <button 
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button 
                  onClick={() => onNavigate('signup')}
                  className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Try WriteScholar Free
                </button>
                <button 
                  onClick={() => onNavigate('features')}
                  className="px-6 py-3 border border-gray-600 text-white font-medium rounded-xl hover:border-gray-500 transition-colors"
                >
                  Learn More
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default ReadabilityScorePage;
