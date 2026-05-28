import { HIDE_FRIENDS, HIDE_STREAK_AND_BADGES } from '../config/featureFlags';

/** Derive app page id from pathname — used for routing, SEO, and workspace chrome. */
export function getPageFromPath(pathname: string): string {
  const p = pathname.replace(/\/$/, '') || '/';
  if (/^\/embed\//.test(p)) return 'embed';
  if (/^\/(study|alternatives|guides|best)\//.test(p)) return 'programmatic';
  if (p === '/email-verification') return 'email-verification';
  if (p === '/onboarding') return 'onboarding';
  if (p === '/onboarding-test') return 'onboarding-test';
  if (p === '/auth/callback') return 'auth-callback';
  if (p === '/get-started' || p === '/welcome') return 'signup';
  if (p === '/signup') return 'signup';
  if (p === '/login') return 'login';
  if (p === '/reset-password') return 'reset-password';
  if (p === '/dashboard') return 'dashboard';
  if (p === '/study-tools') return 'study-tools';
  if (p === '/pricing') return 'pricing';
  if (p === '/features') return 'features';
  if (p === '/ai-essay-editor' || p === '/essay-grader' || p === '/ai-essay-grader' || p === '/grade-my-essay') return 'ai-essay-editor';
  if (p === '/focus-mode' || p === '/focus') return 'focus-mode';
  if (p === '/why-students-choose' || p === '/compare') return 'why-students-choose';
  if (p === '/vs-quizlet-knowt' || p === '/study-tools-comparison' || p === '/compare-study-tools') return 'study-tools-comparison';
  if (p === '/contact') return 'contact';
  if (p === '/about') return 'about';
  if (p === '/analysis') return 'analysis';
  if (p === '/analysis-history') return 'analysis-history';
  if (p === '/citation-results') return 'citation-results';
  if (p === '/citation-history') return 'citation-history';
  if (p === '/quiz-history') return 'quiz-history';
  if (p === '/friends') return HIDE_FRIENDS ? 'dashboard' : 'friends';
  if (p === '/share-friends') return HIDE_FRIENDS ? 'dashboard' : 'share-friends';
  if (p === '/upload') return 'documents';
  if (p === '/write') return 'documents';
  if (p === '/settings') return 'account';
  if (p === '/unlock-quiz' || p.startsWith('/unlock-quiz?')) return 'unlock-quiz';
  if (p === '/profile') return 'profile';
  if (p === '/documents' || p.startsWith('/documents/')) return 'documents';
  if (p === '/library') return 'documents';
  if (p === '/account') return 'account';
  if (p === '/billing') return 'billing';
  if (p === '/help' || p === '/help-center') return 'help';
  if (p === '/press' || p === '/media-kit' || p === '/press-kit') return 'press';
  if (p === '/privacy' || p === '/privacy-policy') return 'privacy';
  if (p === '/terms' || p === '/terms-of-service') return 'terms';
  if (p === '/unsubscribe') return 'unsubscribe';
  if (p === '/admin') return 'admin';
  if (p === '/collaboration') return 'collaboration';
  if (p === '/blog') return 'blog';
  if (p.startsWith('/blog/')) {
    const slug = p.replace(/^\/blog\/?/, '').split('/')[0]?.trim() ?? '';
    return slug ? 'blog-post' : 'blog';
  }
  if (p === '/tools/word-counter' || p === '/word-counter') return 'word-counter';
  if (p === '/tools/citation-generator' || p === '/citation-generator-tool') return 'citation-generator-tool';
  if (p === '/tools/readability-score' || p === '/readability-score') return 'readability-score';
  if (p === '/tools/paraphrasing-tips' || p === '/paraphrasing-tips') return 'paraphrasing-tips';
  if (p === '/tools/essay-outline' || p === '/essay-outline') return 'essay-outline';
  if (p === '/tools/text-case-converter' || p === '/text-case-converter') return 'text-case-converter';
  if (p === '/tools/thesis-generator' || p === '/thesis-generator') return 'thesis-generator';
  if (p === '/tools/grammar-checker' || p === '/grammar-checker') return 'grammar-checker';
  if (p === '/tools/humanizer' || p === '/humanizer') return 'dashboard';
  if (p === '/tools/summarizer' || p === '/summarizer') return 'summarizer';
  if (p === '/tools/quiz-generator' || p === '/quiz-generator') return 'quiz-generator';
  if (p === '/tools/flashcard-generator' || p === '/flashcard-generator') return 'create-flashcards';
  if (p === '/tools/create-flashcards' || p === '/create-flashcards') return 'create-flashcards';
  if (p === '/tools/crossword-generator' || p === '/crossword-generator') {
    try {
      const s = typeof window !== 'undefined' ? localStorage.getItem('savedCrossword') : null;
      if (!s) return 'dashboard';
      const parsed = JSON.parse(s);
      const q = parsed?.questions || parsed;
      if (q?.grid && q?.placedWords) return 'crossword-generator';
    } catch { /* fall through */ }
    return 'dashboard';
  }
  if (p === '/tools/gpa-calculator' || p === '/gpa-calculator') return 'gpa-calculator';
  if (p === '/tools/pomodoro-timer' || p === '/pomodoro-timer') return 'pomodoro-timer';
  if (p === '/tools/calculator' || p === '/calculator') return 'calculator';
  if (p === '/tools/converter' || p === '/converter') return 'converter';
  if (p === '/tools/crater-blast' || p === '/crater-blast' || p === '/tools/lightning-reflex-quiz' || p === '/lightning-reflex-quiz') return 'crater-blast';
  if (p === '/tools/word-tower' || p === '/word-tower' || p === '/games/word-tower') return 'word-tower';
  if (p === '/word-blitz' || p === '/tools/word-blitz' || p === '/games/word-blitz') return 'word-blitz';
  if (p === '/games/crater-blast-launcher' || p === '/game-launcher-crater-blast') return 'game-launcher-crater-blast';
  if (p === '/games/word-tower-launcher' || p === '/game-launcher-word-tower') return 'game-launcher-word-tower';
  if (p === '/tools/interactive-lesson' || p === '/interactive-lesson' || p === '/lesson-generator') return 'dashboard';
  if (p === '/study-pack-viewer' || p === '/tools/study-pack-viewer') return 'study-pack-viewer';
  if (p === '/tools/more' || p === '/more-tools' || p === '/view-more-tools') return 'more-tools';
  if (p === '/badges' || p === '/achievements') return HIDE_STREAK_AND_BADGES ? 'dashboard' : 'badges';
  if (p === '/tools/analyze' || p === '/analyze') return 'analyze';
  if (p === '/tools/citations' || p === '/citations') return 'citations';
  if (p === '/tools/study-pack' || p === '/study-pack') return 'study-pack';
  if (p === '/study-packs' || p === '/study-pack-hub' || p === '/tools/study-pack-hub') return 'study-pack-hub';
  if (p === '/papers' || p === '/analyze-hub' || p === '/tools/analyze-hub') return 'analyze-hub';
  if (p === '/citations-hub' || p === '/tools/citations-hub') return 'citations-hub';
  return 'landing';
}
