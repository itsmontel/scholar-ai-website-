export interface AchievementStats {
  uploads_count: number;
  analyses_count: number;
  humanize_count: number;
  summaries_count: number;
  quizzes_count: number;
  flashcards_count: number;
  crosswords_count: number;
  citations_count: number;
  longest_streak: number;
  current_streak: number;
  used_after_10pm: boolean;
  used_before_7am: boolean;
  // New fields for expanded badges
  is_paid_user: boolean;
  paid_since: string | null;
  midnight_usage: boolean;
  weekend_usage: boolean;
  tools_used_ever: string[];
  tools_used_session: number;
  study_tools_session: number;
  exports_count: number;
  copies_count: number;
  last_active_date: string | null;
  visited_badges: boolean;
  first_login: boolean;
}

export interface Badge {
  id: string;
  name: string;
  creatureName: string;
  description: string;
  xp: number;
  category: 'getting-started' | 'streak' | 'mastery' | 'subscription' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  condition: (stats: AchievementStats) => boolean;
  conditionText: string;
}

export interface LevelInfo {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
}

const LEVELS: LevelInfo[] = [
  { level: 1, name: 'Scholar Seedling', minXP: 0, maxXP: 50 },
  { level: 2, name: 'Curious Cat', minXP: 50, maxXP: 120 },
  { level: 3, name: 'Knowledge Keeper', minXP: 120, maxXP: 220 },
  { level: 4, name: 'Brain Explorer', minXP: 220, maxXP: 350 },
  { level: 5, name: 'Wisdom Warrior', minXP: 350, maxXP: 520 },
  { level: 6, name: 'Study Sage', minXP: 520, maxXP: 750 },
  { level: 7, name: 'Academic Ace', minXP: 750, maxXP: 1000 },
  { level: 8, name: 'Genius Guide', minXP: 1000, maxXP: 1400 },
  { level: 9, name: 'Master Mind', minXP: 1400, maxXP: 2000 },
  { level: 10, name: 'Supreme Scholar', minXP: 2000, maxXP: Infinity },
];

function monthsSincePaid(stats: AchievementStats): number {
  if (!stats.paid_since) return 0;
  const start = new Date(stats.paid_since);
  const now = new Date();
  return (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
}

export const BADGES: Badge[] = [
  // ═══════════════════════════════════════════════
  // GETTING STARTED (10 badges)
  // ═══════════════════════════════════════════════
  { id: 'first_login', name: 'Welcome!', creatureName: 'Greenie', description: 'Log in for the first time', xp: 5, category: 'getting-started', rarity: 'common', condition: (s) => s.first_login, conditionText: 'Log in to WriteScholar' },
  { id: 'first_steps', name: 'First Steps', creatureName: 'Blobby', description: 'Upload your first document', xp: 10, category: 'getting-started', rarity: 'common', condition: (s) => s.uploads_count >= 1, conditionText: 'Upload 1 document' },
  { id: 'brain_spark', name: 'Brain Spark', creatureName: 'Sparky', description: 'Analyze your first paper', xp: 15, category: 'getting-started', rarity: 'common', condition: (s) => s.analyses_count >= 1, conditionText: 'Analyze 1 paper' },
  { id: 'word_wizard', name: 'Word Wizard', creatureName: 'Mystiq', description: 'Humanize your first text', xp: 15, category: 'getting-started', rarity: 'common', condition: (s) => s.humanize_count >= 1, conditionText: 'Humanize 1 text' },
  { id: 'flash_master', name: 'Flash Master', creatureName: 'Flashy', description: 'Create your first flashcard set', xp: 10, category: 'getting-started', rarity: 'common', condition: (s) => s.flashcards_count >= 1, conditionText: 'Create 1 flashcard set' },
  { id: 'quiz_whiz', name: 'Quiz Whiz', creatureName: 'Hootsworth', description: 'Complete your first quiz', xp: 10, category: 'getting-started', rarity: 'common', condition: (s) => s.quizzes_count >= 1, conditionText: 'Complete 1 quiz' },
  { id: 'citation_hunter', name: 'Citation Hunter', creatureName: 'Snoop', description: 'Find your first citation', xp: 10, category: 'getting-started', rarity: 'common', condition: (s) => s.citations_count >= 1, conditionText: 'Find 1 citation' },
  { id: 'summary_sage', name: 'Summary Sage', creatureName: 'Scrollie', description: 'Summarize your first paper', xp: 10, category: 'getting-started', rarity: 'common', condition: (s) => s.summaries_count >= 1, conditionText: 'Summarize 1 paper' },
  { id: 'puzzle_pro', name: 'Puzzle Pro', creatureName: 'Puzzler', description: 'Complete your first crossword', xp: 15, category: 'getting-started', rarity: 'uncommon', condition: (s) => s.crosswords_count >= 1, conditionText: 'Complete 1 crossword' },
  { id: 'explorer', name: 'Badge Explorer', creatureName: 'Peeker', description: 'Visit the badges page', xp: 5, category: 'getting-started', rarity: 'common', condition: (s) => s.visited_badges, conditionText: 'Visit the Badges page' },

  // ═══════════════════════════════════════════════
  // STREAKS (8 badges)
  // ═══════════════════════════════════════════════
  { id: 'streak_starter', name: 'Streak Starter', creatureName: 'Emberly', description: 'Achieve a 3-day streak', xp: 20, category: 'streak', rarity: 'uncommon', condition: (s) => s.longest_streak >= 3, conditionText: '3-day streak' },
  { id: 'streak_warrior', name: 'Streak Warrior', creatureName: 'Blazer', description: 'Achieve a 5-day streak', xp: 30, category: 'streak', rarity: 'rare', condition: (s) => s.longest_streak >= 5, conditionText: '5-day streak' },
  { id: 'streak_legend', name: 'Streak Legend', creatureName: 'Phoenix', description: 'Achieve a 7-day streak', xp: 50, category: 'streak', rarity: 'epic', condition: (s) => s.longest_streak >= 7, conditionText: '7-day streak' },
  { id: 'two_week_titan', name: 'Two Week Titan', creatureName: 'Titan', description: 'Achieve a 14-day streak', xp: 60, category: 'streak', rarity: 'epic', condition: (s) => s.longest_streak >= 14, conditionText: '14-day streak' },
  { id: 'monthly_master', name: 'Monthly Master', creatureName: 'Inferno', description: 'Achieve a 30-day streak', xp: 100, category: 'streak', rarity: 'legendary', condition: (s) => s.longest_streak >= 30, conditionText: '30-day streak' },
  { id: 'streak_machine', name: 'Streak Machine', creatureName: 'Mechablaze', description: 'Achieve a 60-day streak', xp: 150, category: 'streak', rarity: 'legendary', condition: (s) => s.longest_streak >= 60, conditionText: '60-day streak' },
  { id: 'streak_immortal', name: 'Streak Immortal', creatureName: 'Eternox', description: 'Achieve a 100-day streak', xp: 200, category: 'streak', rarity: 'legendary', condition: (s) => s.longest_streak >= 100, conditionText: '100-day streak' },
  { id: 'streak_demigod', name: 'Streak Demigod', creatureName: 'Godflame', description: 'Achieve a 365-day streak', xp: 500, category: 'streak', rarity: 'legendary', condition: (s) => s.longest_streak >= 365, conditionText: '365-day streak' },

  // ═══════════════════════════════════════════════
  // MASTERY (18 badges)
  // ═══════════════════════════════════════════════
  { id: 'quiz_champion', name: 'Quiz Champion', creatureName: 'Champ', description: 'Complete 5 quizzes', xp: 25, category: 'mastery', rarity: 'rare', condition: (s) => s.quizzes_count >= 5, conditionText: 'Complete 5 quizzes' },
  { id: 'quiz_addict', name: 'Quiz Addict', creatureName: 'Quizilla', description: 'Complete 10 quizzes', xp: 40, category: 'mastery', rarity: 'epic', condition: (s) => s.quizzes_count >= 10, conditionText: 'Complete 10 quizzes' },
  { id: 'quiz_legend', name: 'Quiz Legend', creatureName: 'Quizor', description: 'Complete 25 quizzes', xp: 75, category: 'mastery', rarity: 'legendary', condition: (s) => s.quizzes_count >= 25, conditionText: 'Complete 25 quizzes' },
  { id: 'paper_shredder', name: 'Paper Shredder', creatureName: 'Shredz', description: 'Analyze 5 papers', xp: 25, category: 'mastery', rarity: 'rare', condition: (s) => s.analyses_count >= 5, conditionText: 'Analyze 5 papers' },
  { id: 'analysis_master', name: 'Analysis Master', creatureName: 'Analytix', description: 'Analyze 10 papers', xp: 40, category: 'mastery', rarity: 'epic', condition: (s) => s.analyses_count >= 10, conditionText: 'Analyze 10 papers' },
  { id: 'analysis_legend', name: 'Analysis Legend', creatureName: 'Analytor', description: 'Analyze 25 papers', xp: 75, category: 'mastery', rarity: 'legendary', condition: (s) => s.analyses_count >= 25, conditionText: 'Analyze 25 papers' },
  { id: 'flashcard_fiend', name: 'Flashcard Fiend', creatureName: 'Flippy', description: 'Create 3 flashcard sets', xp: 20, category: 'mastery', rarity: 'uncommon', condition: (s) => s.flashcards_count >= 3, conditionText: 'Create 3 flashcard sets' },
  { id: 'flash_genius', name: 'Flash Genius', creatureName: 'Cardano', description: 'Create 10 flashcard sets', xp: 40, category: 'mastery', rarity: 'epic', condition: (s) => s.flashcards_count >= 10, conditionText: 'Create 10 flashcard sets' },
  { id: 'humanize_hero', name: 'Humanize Hero', creatureName: 'Morpher', description: 'Humanize 5 texts', xp: 25, category: 'mastery', rarity: 'rare', condition: (s) => s.humanize_count >= 5, conditionText: 'Humanize 5 texts' },
  { id: 'humanize_legend', name: 'Humanize Legend', creatureName: 'Metamorph', description: 'Humanize 15 texts', xp: 50, category: 'mastery', rarity: 'epic', condition: (s) => s.humanize_count >= 15, conditionText: 'Humanize 15 texts' },
  { id: 'crossword_king', name: 'Crossword King', creatureName: 'Kingy', description: 'Complete 3 crosswords', xp: 20, category: 'mastery', rarity: 'uncommon', condition: (s) => s.crosswords_count >= 3, conditionText: 'Complete 3 crosswords' },
  { id: 'crossword_emperor', name: 'Crossword Emperor', creatureName: 'Gridlord', description: 'Complete 10 crosswords', xp: 40, category: 'mastery', rarity: 'epic', condition: (s) => s.crosswords_count >= 10, conditionText: 'Complete 10 crosswords' },
  { id: 'citation_master', name: 'Citation Master', creatureName: 'Bookwyrm', description: 'Find 10 citations', xp: 30, category: 'mastery', rarity: 'epic', condition: (s) => s.citations_count >= 10, conditionText: 'Find 10 citations' },
  { id: 'citation_legend', name: 'Citation Legend', creatureName: 'Librax', description: 'Find 25 citations', xp: 50, category: 'mastery', rarity: 'legendary', condition: (s) => s.citations_count >= 25, conditionText: 'Find 25 citations' },
  { id: 'summary_scholar', name: 'Summary Scholar', creatureName: 'Sage', description: 'Summarize 5 papers', xp: 25, category: 'mastery', rarity: 'rare', condition: (s) => s.summaries_count >= 5, conditionText: 'Summarize 5 papers' },
  { id: 'summary_master', name: 'Summary Master', creatureName: 'Condensor', description: 'Summarize 10 papers', xp: 40, category: 'mastery', rarity: 'epic', condition: (s) => s.summaries_count >= 10, conditionText: 'Summarize 10 papers' },
  { id: 'upload_champion', name: 'Upload Champion', creatureName: 'Uploader', description: 'Upload 10 documents', xp: 30, category: 'mastery', rarity: 'rare', condition: (s) => s.uploads_count >= 10, conditionText: 'Upload 10 documents' },
  { id: 'upload_legend', name: 'Upload Legend', creatureName: 'Cloudking', description: 'Upload 25 documents', xp: 50, category: 'mastery', rarity: 'epic', condition: (s) => s.uploads_count >= 25, conditionText: 'Upload 25 documents' },

  // ═══════════════════════════════════════════════
  // SUBSCRIPTION (4 badges) — drives revenue!
  // ═══════════════════════════════════════════════
  { id: 'premium_pioneer', name: 'Premium Pioneer', creatureName: 'Goldie', description: 'Become a paid subscriber', xp: 50, category: 'subscription', rarity: 'epic', condition: (s) => s.is_paid_user, conditionText: 'Subscribe to a paid plan' },
  { id: 'loyal_learner', name: 'Loyal Learner', creatureName: 'Loyalist', description: '3 months as a paid subscriber', xp: 75, category: 'subscription', rarity: 'epic', condition: (s) => s.is_paid_user && monthsSincePaid(s) >= 3, conditionText: '3 months as paid subscriber' },
  { id: 'dedicated_scholar', name: 'Dedicated Scholar', creatureName: 'Devotion', description: '6 months as a paid subscriber', xp: 100, category: 'subscription', rarity: 'legendary', condition: (s) => s.is_paid_user && monthsSincePaid(s) >= 6, conditionText: '6 months as paid subscriber' },
  { id: 'scholar_supreme', name: 'Scholar Supreme', creatureName: 'Eternia', description: '1 year as a paid subscriber', xp: 200, category: 'subscription', rarity: 'legendary', condition: (s) => s.is_paid_user && monthsSincePaid(s) >= 12, conditionText: '1 year as paid subscriber' },

  // ═══════════════════════════════════════════════
  // SPECIAL (10 badges)
  // ═══════════════════════════════════════════════
  { id: 'night_owl', name: 'Night Owl', creatureName: 'Nyx', description: 'Use WriteScholar after 10 PM', xp: 15, category: 'special', rarity: 'uncommon', condition: (s) => s.used_after_10pm, conditionText: 'Use app after 10 PM' },
  { id: 'early_bird', name: 'Early Bird', creatureName: 'Sol', description: 'Use WriteScholar before 7 AM', xp: 15, category: 'special', rarity: 'uncommon', condition: (s) => s.used_before_7am, conditionText: 'Use app before 7 AM' },
  { id: 'midnight_scholar', name: 'Midnight Scholar', creatureName: 'Midnight', description: 'Use WriteScholar between midnight and 3 AM', xp: 25, category: 'special', rarity: 'rare', condition: (s) => s.midnight_usage, conditionText: 'Use app midnight–3 AM' },
  { id: 'weekend_warrior', name: 'Weekend Warrior', creatureName: 'Weekender', description: 'Use WriteScholar on a weekend', xp: 10, category: 'special', rarity: 'common', condition: (s) => s.weekend_usage, conditionText: 'Use app on a weekend' },
  { id: 'all_rounder', name: 'All-Rounder', creatureName: 'Omni', description: 'Use every tool type at least once', xp: 50, category: 'special', rarity: 'epic', condition: (s) => s.tools_used_ever.length >= 7, conditionText: 'Use all 7 tool types' },
  { id: 'study_marathon', name: 'Study Marathon', creatureName: 'Marathon', description: 'Use 3+ different tools in one session', xp: 20, category: 'special', rarity: 'uncommon', condition: (s) => s.tools_used_session >= 3, conditionText: 'Use 3 tools in one session' },
  { id: 'export_pro', name: 'Export Pro', creatureName: 'Exporto', description: 'Export a quiz or flashcard set', xp: 15, category: 'special', rarity: 'uncommon', condition: (s) => s.exports_count >= 1, conditionText: 'Export 1 study tool' },
  { id: 'comeback_kid', name: 'Comeback Kid', creatureName: 'Boomerang', description: 'Return after 7+ days away', xp: 20, category: 'special', rarity: 'uncommon', condition: (s) => {
    if (!s.last_active_date) return false;
    const last = new Date(s.last_active_date);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 7;
  }, conditionText: 'Return after 7+ days away' },
  { id: 'social_scholar', name: 'Social Scholar', creatureName: 'Sharky', description: 'Copy a result to clipboard', xp: 10, category: 'special', rarity: 'common', condition: (s) => s.copies_count >= 1, conditionText: 'Copy a result' },
  { id: 'speed_demon', name: 'Speed Demon', creatureName: 'Zippy', description: 'Generate 3 study tools in one session', xp: 25, category: 'special', rarity: 'rare', condition: (s) => s.study_tools_session >= 3, conditionText: '3 study tools in one session' },
];

const STATS_KEY = 'writescholar_achievement_stats';
const UNLOCKED_KEY = 'writescholar_achievements_unlocked';

function defaultStats(): AchievementStats {
  return {
    uploads_count: 0,
    analyses_count: 0,
    humanize_count: 0,
    summaries_count: 0,
    quizzes_count: 0,
    flashcards_count: 0,
    crosswords_count: 0,
    citations_count: 0,
    longest_streak: 0,
    current_streak: 0,
    used_after_10pm: false,
    used_before_7am: false,
    is_paid_user: false,
    paid_since: null,
    midnight_usage: false,
    weekend_usage: false,
    tools_used_ever: [],
    tools_used_session: 0,
    study_tools_session: 0,
    exports_count: 0,
    copies_count: 0,
    last_active_date: null,
    visited_badges: false,
    first_login: false,
  };
}

export function getStats(): AchievementStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultStats(), ...parsed };
    }
  } catch { /* ignore */ }
  return defaultStats();
}

export function saveStats(stats: AchievementStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function getUnlockedBadges(): Record<string, string> {
  try {
    const raw = localStorage.getItem(UNLOCKED_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

export function saveUnlockedBadges(unlocked: Record<string, string>) {
  localStorage.setItem(UNLOCKED_KEY, JSON.stringify(unlocked));
}

function applyTimeChecks(stats: AchievementStats) {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  if (hour >= 22 || hour < 4) stats.used_after_10pm = true;
  if (hour >= 4 && hour < 7) stats.used_before_7am = true;
  if (hour >= 0 && hour < 3) stats.midnight_usage = true;
  if (day === 0 || day === 6) stats.weekend_usage = true;
}

function checkAndUnlockBadges(stats: AchievementStats): string[] {
  const unlocked = getUnlockedBadges();
  const newlyUnlocked: string[] = [];

  for (const badge of BADGES) {
    if (!unlocked[badge.id] && badge.condition(stats)) {
      unlocked[badge.id] = new Date().toISOString();
      newlyUnlocked.push(badge.id);
    }
  }

  if (newlyUnlocked.length > 0) {
    saveUnlockedBadges(unlocked);
  }

  return newlyUnlocked;
}

const TOOL_TYPE_MAP: Record<string, string> = {
  analyses_count: 'analyze',
  humanize_count: 'humanize',
  summaries_count: 'summarize',
  quizzes_count: 'quiz',
  flashcards_count: 'flashcard',
  crosswords_count: 'crossword',
  citations_count: 'citation',
};

export function trackAction(action: keyof AchievementStats, value?: number | boolean): string[] {
  const stats = getStats();

  if (typeof value === 'boolean') {
    (stats as any)[action] = value;
  } else {
    (stats as any)[action] = ((stats as any)[action] || 0) + (value || 1);
  }

  applyTimeChecks(stats);

  // Track tool diversity for all_rounder and study_marathon
  const toolType = TOOL_TYPE_MAP[action as string];
  if (toolType) {
    if (!stats.tools_used_ever.includes(toolType)) {
      stats.tools_used_ever = [...stats.tools_used_ever, toolType];
    }
    stats.tools_used_session = (stats.tools_used_session || 0) + 1;

    const studyTools = ['quiz', 'flashcard', 'crossword'];
    if (studyTools.includes(toolType)) {
      stats.study_tools_session = (stats.study_tools_session || 0) + 1;
    }
  }

  saveStats(stats);
  return checkAndUnlockBadges(stats);
}

export function trackExport(): string[] {
  const stats = getStats();
  stats.exports_count = (stats.exports_count || 0) + 1;
  saveStats(stats);
  return checkAndUnlockBadges(stats);
}

export function trackCopy(): string[] {
  const stats = getStats();
  stats.copies_count = (stats.copies_count || 0) + 1;
  saveStats(stats);
  return checkAndUnlockBadges(stats);
}

export function trackBadgesVisit(): string[] {
  const stats = getStats();
  stats.visited_badges = true;
  saveStats(stats);
  return checkAndUnlockBadges(stats);
}

export function syncFromAPIData(data: {
  documentsUploaded?: number;
  documentsAnalyzed?: number;
  currentStreak?: number;
  longestStreak?: number;
  plan?: string;
}): string[] {
  const stats = getStats();

  if (data.documentsUploaded !== undefined) {
    stats.uploads_count = Math.max(stats.uploads_count, data.documentsUploaded);
  }
  if (data.documentsAnalyzed !== undefined) {
    stats.analyses_count = Math.max(stats.analyses_count, data.documentsAnalyzed);
  }
  if (data.currentStreak !== undefined) {
    stats.current_streak = data.currentStreak;
  }
  if (data.longestStreak !== undefined) {
    stats.longest_streak = Math.max(stats.longest_streak, data.longestStreak);
  }

  // Subscription tracking
  if (data.plan && data.plan !== 'free') {
    if (!stats.is_paid_user) {
      stats.paid_since = new Date().toISOString();
    }
    stats.is_paid_user = true;
  }

  // Comeback kid: check if last active was 7+ days ago before updating
  const today = new Date().toISOString().split('T')[0];
  if (stats.last_active_date && stats.last_active_date !== today) {
    const last = new Date(stats.last_active_date);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff >= 7) {
      // Will trigger comeback_kid badge
    }
  }

  // First login
  stats.first_login = true;

  applyTimeChecks(stats);

  // Update last active AFTER checking comeback (so we don't overwrite before the check runs)
  stats.last_active_date = today;

  saveStats(stats);
  return checkAndUnlockBadges(stats);
}

export function getTotalXP(): number {
  const unlocked = getUnlockedBadges();
  return BADGES.filter(b => unlocked[b.id]).reduce((sum, b) => sum + b.xp, 0);
}

export function getLevelInfo(xp?: number): { level: number; name: string; currentXP: number; nextLevelXP: number; progress: number } {
  const totalXP = xp ?? getTotalXP();
  let currentLevel = LEVELS[0];

  for (const level of LEVELS) {
    if (totalXP >= level.minXP) {
      currentLevel = level;
    }
  }

  const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1);
  const progressXP = totalXP - currentLevel.minXP;
  const levelRange = nextLevel ? nextLevel.minXP - currentLevel.minXP : 1;

  return {
    level: currentLevel.level,
    name: currentLevel.name,
    currentXP: totalXP,
    nextLevelXP: nextLevel?.minXP ?? currentLevel.minXP,
    progress: nextLevel ? Math.min(progressXP / levelRange, 1) : 1,
  };
}

export function getUnlockedCount(): number {
  return Object.keys(getUnlockedBadges()).length;
}

export function getRarityColor(rarity: Badge['rarity']): { bg: string; text: string; border: string; glow: string } {
  switch (rarity) {
    case 'common': return { bg: 'bg-stone-100 dark:bg-stone-700', text: 'text-stone-600 dark:text-stone-300', border: 'border-stone-300 dark:border-stone-600', glow: '' };
    case 'uncommon': return { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-300 dark:border-emerald-700', glow: 'shadow-emerald-500/20' };
    case 'rare': return { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-300 dark:border-blue-700', glow: 'shadow-blue-500/20' };
    case 'epic': return { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-300 dark:border-purple-700', glow: 'shadow-purple-500/30' };
    case 'legendary': return { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-700', glow: 'shadow-amber-500/40' };
  }
}

export function getCategoryLabel(category: Badge['category']): string {
  switch (category) {
    case 'getting-started': return 'Getting Started';
    case 'streak': return 'Streaks';
    case 'mastery': return 'Mastery';
    case 'subscription': return 'Subscriber';
    case 'special': return 'Special';
  }
}
