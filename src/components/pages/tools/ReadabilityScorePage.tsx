import { useState, useEffect } from 'react';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import ScholarMascot from '../../common/ScholarMascot';

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

  // SEO: Set page title and meta description
  useEffect(() => {
    document.title = 'Free Readability Score Calculator - Flesch-Kincaid & More | WriteScholar';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Free readability score calculator. Get Flesch-Kincaid, Gunning Fog, SMOG Index, and more. Check your text\'s grade level and reading difficulty. No signup required.');
    }
  }, []);

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

  const getReadingEaseLabel = (score: number): { label: string; color: string; bg: string; audience: string } => {
    if (score >= 90) return { label: 'Very Easy', color: 'text-[#58CC02]', bg: 'bg-[#EAFFD6]', audience: 'Average 5th grader' };
    if (score >= 80) return { label: 'Easy', color: 'text-[#58CC02]', bg: 'bg-[#EAFFD6]', audience: 'Average 6th grader' };
    if (score >= 70) return { label: 'Fairly Easy', color: 'text-[#1CB0F6]', bg: 'bg-[#DDF4FF]', audience: '7th grader' };
    if (score >= 60) return { label: 'Standard', color: 'text-[#1CB0F6]', bg: 'bg-[#DDF4FF]', audience: '8th-9th grader' };
    if (score >= 50) return { label: 'Fairly Difficult', color: 'text-[#FF9600]', bg: 'bg-[#FFF4E0]', audience: 'High school student' };
    if (score >= 30) return { label: 'Difficult', color: 'text-[#FF9600]', bg: 'bg-[#FFF4E0]', audience: 'College student' };
    return { label: 'Very Difficult', color: 'text-[#FF4B4B]', bg: 'bg-[#FFE8E8]', audience: 'College graduate' };
  };

  const getProgressColor = (score: number): string => {
    if (score >= 70) return 'bg-[#58CC02]';
    if (score >= 50) return 'bg-[#1CB0F6]';
    if (score >= 30) return 'bg-[#FF9600]';
    return 'bg-[#FF4B4B]';
  };

  const getGradeLevelColor = (grade: number): string => {
    if (grade <= 8) return 'text-[#58CC02]';
    if (grade <= 12) return 'text-[#1CB0F6]';
    if (grade <= 16) return 'text-[#FF9600]';
    return 'text-[#FF4B4B]';
  };

  const getGradeLevelBg = (grade: number): string => {
    if (grade <= 8) return 'bg-[#EAFFD6]';
    if (grade <= 12) return 'bg-[#DDF4FF]';
    if (grade <= 16) return 'bg-[#FFF4E0]';
    return 'bg-[#FFE8E8]';
  };

  const getStatColor = (value: number, warnAt: number, dangerAt: number): string => {
    if (value > dangerAt) return 'text-[#FF4B4B]';
    if (value > warnAt) return 'text-[#FF9600]';
    return 'text-[#58CC02]';
  };

  return (
    <div className="relative min-h-screen bg-stone-50 dark:bg-stone-950" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="readability-score" />

      {/* Hero Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center mb-6">
              <ScholarMascot size={80} animated={false} pose="default" />
            </div>
            <span className="inline-flex items-center px-4 py-1.5 bg-[#EAFFD6] text-[#46A302] border-2 border-[#46A302]/30 rounded-full text-sm font-extrabold uppercase tracking-wide mb-5">
              Free Tool
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 dark:text-stone-50 mb-5 leading-tight">
              Readability Score Calculator
            </h1>
            <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl mx-auto">
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
              <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-extrabold text-stone-900 dark:text-stone-50">Your Text</h2>
                  <button
                    onClick={() => setText('')}
                    className="px-4 py-2 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border-2 border-b-4 border-stone-200 dark:border-stone-600 active:border-b-2 active:translate-y-0.5 transition-all font-extrabold uppercase tracking-wide rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800"
                  >
                    Clear
                  </button>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste or type your text here to analyze its readability. For best results, use at least 100 words..."
                  className="w-full h-80 p-4 text-stone-700 dark:text-stone-200 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-600 rounded-xl outline-none resize-none placeholder-stone-400 dark:placeholder-stone-500 focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 transition-all"
                />

                {/* Quick Stats */}
                {scores && (
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    <div className="bg-[#DDF4FF] dark:bg-[#1CB0F6]/20 border-2 border-[#1CB0F6]/30 rounded-xl p-3 text-center">
                      <div className="text-2xl font-extrabold text-[#1899D6]">{scores.wordCount}</div>
                      <div className="text-xs font-extrabold text-[#1899D6]/70 uppercase tracking-wide">Words</div>
                    </div>
                    <div className="bg-[#EAFFD6] dark:bg-[#58CC02]/20 border-2 border-[#58CC02]/30 rounded-xl p-3 text-center">
                      <div className="text-2xl font-extrabold text-[#46A302]">{scores.sentenceCount}</div>
                      <div className="text-xs font-extrabold text-[#46A302]/70 uppercase tracking-wide">Sentences</div>
                    </div>
                    <div className="bg-[#F3EAFF] dark:bg-[#A560E8]/20 border-2 border-[#A560E8]/30 rounded-xl p-3 text-center">
                      <div className="text-2xl font-extrabold text-[#8A48C7]">{scores.paragraphCount}</div>
                      <div className="text-xs font-extrabold text-[#8A48C7]/70 uppercase tracking-wide">Paragraphs</div>
                    </div>
                    <div className="bg-[#FFF4E0] dark:bg-[#FF9600]/20 border-2 border-[#FF9600]/30 rounded-xl p-3 text-center">
                      <div className="text-2xl font-extrabold text-[#D97F00]">{scores.characterCount}</div>
                      <div className="text-xs font-extrabold text-[#D97F00]/70 uppercase tracking-wide">Characters</div>
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
                  <div className="border-2 border-b-4 border-[#46A302] bg-[#58CC02] rounded-2xl p-6 text-white">
                    <h3 className="text-lg font-extrabold mb-2 opacity-90 uppercase tracking-wide">Flesch Reading Ease</h3>
                    <div className="text-5xl font-extrabold mb-1">{Math.round(scores.fleschReadingEase)}</div>
                    <div className="text-lg font-extrabold text-white/90">
                      {getReadingEaseLabel(scores.fleschReadingEase).label}
                    </div>
                    <div className="text-sm font-extrabold opacity-70 mt-1">
                      Suitable for: {getReadingEaseLabel(scores.fleschReadingEase).audience}
                    </div>
                    <div className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden border border-white/10">
                      <div
                        className={`h-full ${getProgressColor(scores.fleschReadingEase)} transition-all duration-500`}
                        style={{ width: `${scores.fleschReadingEase}%` }}
                      />
                    </div>
                  </div>

                  {/* Average Grade Level */}
                  <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
                    <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-50 mb-4">Average Grade Level</h3>
                    <div className="text-center py-2">
                      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl ${getGradeLevelBg(scores.averageGradeLevel)} border-2 border-b-4 ${scores.averageGradeLevel <= 8 ? 'border-[#46A302]/30' : scores.averageGradeLevel <= 12 ? 'border-[#1899D6]/30' : scores.averageGradeLevel <= 16 ? 'border-[#D97F00]/30' : 'border-[#E04343]/30'}`}>
                        <span className={`text-3xl font-extrabold ${getGradeLevelColor(scores.averageGradeLevel)}`}>
                          {scores.averageGradeLevel.toFixed(1)}
                        </span>
                      </div>
                      <div className="text-[#1CB0F6] font-extrabold mt-3">{scores.gradeLevel}</div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 font-extrabold">Average across 5 readability formulas</p>
                    </div>
                  </div>

                  {/* Individual Formula Scores */}
                  <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
                    <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-50 mb-4">Readability Formulas</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-extrabold text-stone-600 dark:text-stone-400">Flesch-Kincaid Grade</span>
                          <span className={`font-extrabold ${getGradeLevelColor(scores.fleschKincaid)}`}>{scores.fleschKincaid.toFixed(1)}</span>
                        </div>
                        <div className="bg-stone-100 dark:bg-stone-800 rounded-full h-2.5 overflow-hidden border border-stone-200 dark:border-stone-700">
                          <div className="h-full bg-[#1CB0F6] transition-all rounded-full" style={{ width: `${Math.min(100, (scores.fleschKincaid / 20) * 100)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-extrabold text-stone-600 dark:text-stone-400">Gunning Fog Index</span>
                          <span className={`font-extrabold ${getGradeLevelColor(scores.gunningFog)}`}>{scores.gunningFog.toFixed(1)}</span>
                        </div>
                        <div className="bg-stone-100 dark:bg-stone-800 rounded-full h-2.5 overflow-hidden border border-stone-200 dark:border-stone-700">
                          <div className="h-full bg-[#A560E8] transition-all rounded-full" style={{ width: `${Math.min(100, (scores.gunningFog / 20) * 100)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-extrabold text-stone-600 dark:text-stone-400">SMOG Index</span>
                          <span className={`font-extrabold ${getGradeLevelColor(scores.smogIndex)}`}>{scores.smogIndex.toFixed(1)}</span>
                        </div>
                        <div className="bg-stone-100 dark:bg-stone-800 rounded-full h-2.5 overflow-hidden border border-stone-200 dark:border-stone-700">
                          <div className="h-full bg-[#58CC02] transition-all rounded-full" style={{ width: `${Math.min(100, (scores.smogIndex / 20) * 100)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-extrabold text-stone-600 dark:text-stone-400">Coleman-Liau Index</span>
                          <span className={`font-extrabold ${getGradeLevelColor(scores.colemanLiau)}`}>{scores.colemanLiau.toFixed(1)}</span>
                        </div>
                        <div className="bg-stone-100 dark:bg-stone-800 rounded-full h-2.5 overflow-hidden border border-stone-200 dark:border-stone-700">
                          <div className="h-full bg-[#FF9600] transition-all rounded-full" style={{ width: `${Math.min(100, (scores.colemanLiau / 20) * 100)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-extrabold text-stone-600 dark:text-stone-400">Automated Readability</span>
                          <span className={`font-extrabold ${getGradeLevelColor(scores.automatedReadability)}`}>{scores.automatedReadability.toFixed(1)}</span>
                        </div>
                        <div className="bg-stone-100 dark:bg-stone-800 rounded-full h-2.5 overflow-hidden border border-stone-200 dark:border-stone-700">
                          <div className="h-full bg-[#FF4B4B] transition-all rounded-full" style={{ width: `${Math.min(100, (scores.automatedReadability / 20) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Text Statistics */}
                  <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
                    <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-50 mb-4">Writing Analysis</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b-2 border-stone-100 dark:border-stone-800">
                        <span className="text-stone-600 dark:text-stone-400 font-extrabold text-sm">Avg. words per sentence</span>
                        <span className={`font-extrabold ${getStatColor(scores.avgWordsPerSentence, 20, 25)}`}>
                          {scores.avgWordsPerSentence}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b-2 border-stone-100 dark:border-stone-800">
                        <span className="text-stone-600 dark:text-stone-400 font-extrabold text-sm">Avg. syllables per word</span>
                        <span className={`font-extrabold ${getStatColor(scores.avgSyllablesPerWord, 1.6, 2)}`}>
                          {scores.avgSyllablesPerWord}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b-2 border-stone-100 dark:border-stone-800">
                        <span className="text-stone-600 dark:text-stone-400 font-extrabold text-sm">Avg. characters per word</span>
                        <span className="font-extrabold text-stone-900 dark:text-stone-100">{scores.avgCharsPerWord}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b-2 border-stone-100 dark:border-stone-800">
                        <span className="text-stone-600 dark:text-stone-400 font-extrabold text-sm">Complex words (3+ syllables)</span>
                        <span className={`font-extrabold ${getStatColor(scores.complexWordsPercent, 20, 30)}`}>
                          {scores.complexWords} ({scores.complexWordsPercent}%)
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-stone-600 dark:text-stone-400 font-extrabold text-sm">Long sentences (25+ words)</span>
                        <span className={`font-extrabold ${getStatColor(scores.longSentences, 1, 3)}`}>
                          {scores.longSentences}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-[#DDF4FF] border-2 border-[#1CB0F6]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#1CB0F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-50 mb-2">Enter Your Text</h3>
                  <p className="text-stone-500 dark:text-stone-400 text-sm font-extrabold">Paste or type text in the editor to see readability scores from 6 different formulas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Formula Explanations */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-50 mb-8 text-center">Understanding Readability Formulas</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
              <div className="w-12 h-12 bg-[#DDF4FF] border-2 border-[#1CB0F6]/30 rounded-xl flex items-center justify-center mb-4">
                <span className="text-[#1899D6] font-extrabold">FK</span>
              </div>
              <h3 className="font-extrabold text-stone-900 dark:text-stone-50 mb-2">Flesch-Kincaid</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Based on sentence length and syllables per word. The most widely used formula, especially in education.</p>
            </div>
            <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
              <div className="w-12 h-12 bg-[#F3EAFF] border-2 border-[#A560E8]/30 rounded-xl flex items-center justify-center mb-4">
                <span className="text-[#8A48C7] font-extrabold">GF</span>
              </div>
              <h3 className="font-extrabold text-stone-900 dark:text-stone-50 mb-2">Gunning Fog</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Estimates years of formal education needed. Focuses on complex words (3+ syllables) and sentence length.</p>
            </div>
            <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
              <div className="w-12 h-12 bg-[#EAFFD6] border-2 border-[#58CC02]/30 rounded-xl flex items-center justify-center mb-4">
                <span className="text-[#46A302] font-extrabold">SM</span>
              </div>
              <h3 className="font-extrabold text-stone-900 dark:text-stone-50 mb-2">SMOG Index</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Designed for healthcare materials. Counts polysyllabic words to determine reading level.</p>
            </div>
            <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
              <div className="w-12 h-12 bg-[#FFF4E0] border-2 border-[#FF9600]/30 rounded-xl flex items-center justify-center mb-4">
                <span className="text-[#D97F00] font-extrabold">CL</span>
              </div>
              <h3 className="font-extrabold text-stone-900 dark:text-stone-50 mb-2">Coleman-Liau</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Uses characters per word instead of syllables. More reliable for machine-processed text.</p>
            </div>
            <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
              <div className="w-12 h-12 bg-[#FFE8E8] border-2 border-[#FF4B4B]/30 rounded-xl flex items-center justify-center mb-4">
                <span className="text-[#E04343] font-extrabold">AR</span>
              </div>
              <h3 className="font-extrabold text-stone-900 dark:text-stone-50 mb-2">Automated Readability</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Uses character count and sentence length. Good for real-time text analysis.</p>
            </div>
            <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6">
              <div className="w-12 h-12 bg-[#DDF4FF] border-2 border-[#1CB0F6]/30 rounded-xl flex items-center justify-center mb-4">
                <span className="text-[#1899D6] font-extrabold">FE</span>
              </div>
              <h3 className="font-extrabold text-stone-900 dark:text-stone-50 mb-2">Flesch Reading Ease</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Scores 0-100 (higher = easier). The inverse of Flesch-Kincaid, focused on ease rather than grade.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-12 sm:py-16 bg-white dark:bg-stone-900 border-y-2 border-stone-200 dark:border-stone-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-50 mb-8 text-center">Tips to Improve Readability</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 rounded-2xl p-6">
              <div className="w-12 h-12 bg-[#DDF4FF] border-2 border-[#1CB0F6]/30 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#1CB0F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
              </div>
              <h3 className="font-extrabold text-stone-900 dark:text-stone-50 mb-2">Shorter Sentences</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Aim for 15-20 words per sentence. Break long sentences into smaller ones.</p>
            </div>
            <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 rounded-2xl p-6">
              <div className="w-12 h-12 bg-[#EAFFD6] border-2 border-[#58CC02]/30 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#58CC02]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="font-extrabold text-stone-900 dark:text-stone-50 mb-2">Simple Words</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Use common words when possible. Replace "utilize" with "use", "commence" with "start".</p>
            </div>
            <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 rounded-2xl p-6">
              <div className="w-12 h-12 bg-[#F3EAFF] border-2 border-[#A560E8]/30 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#A560E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-extrabold text-stone-900 dark:text-stone-50 mb-2">Active Voice</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Prefer "The team completed" over "It was completed by the team".</p>
            </div>
            <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 rounded-2xl p-6">
              <div className="w-12 h-12 bg-[#FFF4E0] border-2 border-[#FF9600]/30 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#FF9600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="font-extrabold text-stone-900 dark:text-stone-50 mb-2">Break It Up</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Use paragraphs, bullet points, and headings to organize content visually.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Score Guide */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-50 mb-8 text-center">Flesch Reading Ease Score Guide</h2>
          <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-stone-50 dark:bg-stone-800">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-extrabold text-stone-900 dark:text-stone-50 uppercase tracking-wide">Score</th>
                  <th className="px-6 py-3 text-left text-sm font-extrabold text-stone-900 dark:text-stone-50 uppercase tracking-wide">Difficulty</th>
                  <th className="px-6 py-3 text-left text-sm font-extrabold text-stone-900 dark:text-stone-50 uppercase tracking-wide">Grade Level</th>
                  <th className="px-6 py-3 text-left text-sm font-extrabold text-stone-900 dark:text-stone-50 uppercase tracking-wide hidden sm:table-cell">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-stone-100 dark:divide-stone-800">
                <tr><td className="px-6 py-3 text-[#58CC02] font-extrabold">90-100</td><td className="px-6 py-3 text-stone-700 dark:text-stone-300 font-extrabold">Very Easy</td><td className="px-6 py-3 text-stone-700 dark:text-stone-300">5th grade</td><td className="px-6 py-3 text-stone-500 dark:text-stone-400 hidden sm:table-cell">Comics, children's books</td></tr>
                <tr><td className="px-6 py-3 text-[#58CC02] font-extrabold">80-89</td><td className="px-6 py-3 text-stone-700 dark:text-stone-300 font-extrabold">Easy</td><td className="px-6 py-3 text-stone-700 dark:text-stone-300">6th grade</td><td className="px-6 py-3 text-stone-500 dark:text-stone-400 hidden sm:table-cell">Consumer ads, tabloids</td></tr>
                <tr><td className="px-6 py-3 text-[#1CB0F6] font-extrabold">70-79</td><td className="px-6 py-3 text-stone-700 dark:text-stone-300 font-extrabold">Fairly Easy</td><td className="px-6 py-3 text-stone-700 dark:text-stone-300">7th grade</td><td className="px-6 py-3 text-stone-500 dark:text-stone-400 hidden sm:table-cell">Movie reviews, sports news</td></tr>
                <tr><td className="px-6 py-3 text-[#1CB0F6] font-extrabold">60-69</td><td className="px-6 py-3 text-stone-700 dark:text-stone-300 font-extrabold">Standard</td><td className="px-6 py-3 text-stone-700 dark:text-stone-300">8-9th grade</td><td className="px-6 py-3 text-stone-500 dark:text-stone-400 hidden sm:table-cell">Time, Newsweek</td></tr>
                <tr><td className="px-6 py-3 text-[#FF9600] font-extrabold">50-59</td><td className="px-6 py-3 text-stone-700 dark:text-stone-300 font-extrabold">Fairly Difficult</td><td className="px-6 py-3 text-stone-700 dark:text-stone-300">High school</td><td className="px-6 py-3 text-stone-500 dark:text-stone-400 hidden sm:table-cell">Wall Street Journal</td></tr>
                <tr><td className="px-6 py-3 text-[#FF9600] font-extrabold">30-49</td><td className="px-6 py-3 text-stone-700 dark:text-stone-300 font-extrabold">Difficult</td><td className="px-6 py-3 text-stone-700 dark:text-stone-300">College</td><td className="px-6 py-3 text-stone-500 dark:text-stone-400 hidden sm:table-cell">Academic papers</td></tr>
                <tr><td className="px-6 py-3 text-[#FF4B4B] font-extrabold">0-29</td><td className="px-6 py-3 text-stone-700 dark:text-stone-300 font-extrabold">Very Difficult</td><td className="px-6 py-3 text-stone-700 dark:text-stone-300">Graduate</td><td className="px-6 py-3 text-stone-500 dark:text-stone-400 hidden sm:table-cell">Scientific journals, legal docs</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-[#58CC02] border-y-2 border-[#46A302]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
            Want deeper writing analysis?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto font-extrabold">
            WriteScholar provides comprehensive AI feedback on grammar, structure, academic style, and more to help perfect your papers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-3 bg-white text-[#58CC02] font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-stone-200 active:border-b-2 active:translate-y-0.5 transition-all hover:bg-stone-50"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('signup')}
                  className="px-6 py-3 bg-white text-[#58CC02] font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-stone-200 active:border-b-2 active:translate-y-0.5 transition-all hover:bg-stone-50"
                >
                  Try WriteScholar Free
                </button>
                <button
                  onClick={() => onNavigate('features')}
                  className="px-6 py-3 border-2 border-b-4 border-white/50 text-white font-extrabold uppercase tracking-wide rounded-xl active:border-b-2 active:translate-y-0.5 transition-all hover:bg-white/10"
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
