export interface AchievementStats {
  uploads_count: number;
  analyses_count: number;
  summaries_count: number;
  quizzes_count: number;
  flashcards_count: number;
  crosswords_count: number;
  citations_count: number;
  lessons_count: number;
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
  // Calendar & scheduling
  calendar_events_count: number;
  // Friends & social
  friend_requests_sent: number;
  friends_count: number;
  shares_count: number;
  unique_friends_shared_with: string[];
  // Quick review stats
  quick_review_count: number;
  quick_review_perfect_scores: number;
  quick_review_current_streak: number;
  quick_review_longest_streak: number;
  // Crater Blast stats
  crater_blast_games: number;
  crater_blast_perfect_games: number;
  crater_blast_high_score: number;
  // Advanced mastery
  total_study_tools_created: number;
  total_words_analyzed: number;
  documents_in_single_day: number;
  study_sessions_count: number;
  // Focus Mode
  focus_mode_unlocks_count: number;
  focus_mode_sites_blocked: number;
  // Study Packs (unified study tool generation)
  study_packs_count: number;
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
  { id: 'citation_hunter', name: 'Citation Hunter', creatureName: 'Snoop', description: 'Find your first citation', xp: 10, category: 'getting-started', rarity: 'common', condition: (s) => s.citations_count >= 1, conditionText: 'Find 1 citation' },
  { id: 'summary_sage', name: 'Summary Sage', creatureName: 'Scrollie', description: 'Summarize your first paper', xp: 10, category: 'getting-started', rarity: 'common', condition: (s) => s.summaries_count >= 1, conditionText: 'Summarize 1 paper' },
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
  { id: 'paper_shredder', name: 'Paper Shredder', creatureName: 'Shredz', description: 'Analyze 5 papers', xp: 25, category: 'mastery', rarity: 'rare', condition: (s) => s.analyses_count >= 5, conditionText: 'Analyze 5 papers' },
  { id: 'analysis_master', name: 'Analysis Master', creatureName: 'Analytix', description: 'Analyze 10 papers', xp: 40, category: 'mastery', rarity: 'epic', condition: (s) => s.analyses_count >= 10, conditionText: 'Analyze 10 papers' },
  { id: 'analysis_legend', name: 'Analysis Legend', creatureName: 'Analytor', description: 'Analyze 25 papers', xp: 75, category: 'mastery', rarity: 'legendary', condition: (s) => s.analyses_count >= 25, conditionText: 'Analyze 25 papers' },
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
  { id: 'all_rounder', name: 'All-Rounder', creatureName: 'Omni', description: 'Use every tool type at least once', xp: 50, category: 'special', rarity: 'epic', condition: (s) => (s.tools_used_ever || []).length >= 8, conditionText: 'Use all 8 tool types' },
  { id: 'export_pro', name: 'Export Pro', creatureName: 'Exporto', description: 'Export a quiz or flashcard set', xp: 15, category: 'special', rarity: 'uncommon', condition: (s) => s.exports_count >= 1, conditionText: 'Export 1 study tool' },
  { id: 'comeback_kid', name: 'Comeback Kid', creatureName: 'Boomerang', description: 'Return after 7+ days away', xp: 20, category: 'special', rarity: 'uncommon', condition: (s) => {
    if (!s.last_active_date) return false;
    const last = new Date(s.last_active_date);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 7;
  }, conditionText: 'Return after 7+ days away' },
  { id: 'social_scholar', name: 'Social Scholar', creatureName: 'Sharky', description: 'Copy a result to clipboard', xp: 10, category: 'special', rarity: 'common', condition: (s) => s.copies_count >= 1, conditionText: 'Copy a result' },

  // ═══════════════════════════════════════════════
  // TOOLS & LIBRARY (replaces calendar & friends)
  // ═══════════════════════════════════════════════
  { id: 'tool_tryer', name: 'Tool Tryer', creatureName: 'Calendex', description: 'Use 2 different tool types', xp: 10, category: 'special', rarity: 'common', condition: (s) => (s.tools_used_ever || []).length >= 2, conditionText: 'Use 2 tool types' },
  { id: 'tool_explorer', name: 'Tool Explorer', creatureName: 'Plannerina', description: 'Use 4 different tool types', xp: 25, category: 'special', rarity: 'uncommon', condition: (s) => (s.tools_used_ever || []).length >= 4, conditionText: 'Use 4 tool types' },
  { id: 'tool_adventurer', name: 'Tool Adventurer', creatureName: 'Chronos', description: 'Use 6 different tool types', xp: 40, category: 'special', rarity: 'rare', condition: (s) => (s.tools_used_ever || []).length >= 6, conditionText: 'Use 6 tool types' },
  { id: 'library_keeper', name: 'Library Keeper', creatureName: 'Tempus', description: 'Have 5 documents in your library', xp: 15, category: 'special', rarity: 'common', condition: (s) => s.uploads_count >= 5, conditionText: '5 documents in library' },
  { id: 'library_builder', name: 'Library Builder', creatureName: 'Agendor', description: 'Have 20 documents in your library', xp: 40, category: 'special', rarity: 'rare', condition: (s) => s.uploads_count >= 20, conditionText: '20 documents in library' },
  { id: 'library_hoarder', name: 'Library Hoarder', creatureName: 'Buddy', description: 'Have 50 documents in your library', xp: 75, category: 'special', rarity: 'epic', condition: (s) => s.uploads_count >= 50, conditionText: '50 documents in library' },
  { id: 'citation_collector', name: 'Citation Collector', creatureName: 'Flutter', description: 'Find 50 citations', xp: 60, category: 'mastery', rarity: 'epic', condition: (s) => s.citations_count >= 50, conditionText: 'Find 50 citations' },
  { id: 'citation_archivist', name: 'Citation Archivist', creatureName: 'Celeb', description: 'Find 100 citations', xp: 100, category: 'mastery', rarity: 'legendary', condition: (s) => s.citations_count >= 100, conditionText: 'Find 100 citations' },
  { id: 'analysis_ace', name: 'Analysis Ace', creatureName: 'Giver', description: 'Analyze 50 papers', xp: 60, category: 'mastery', rarity: 'epic', condition: (s) => s.analyses_count >= 50, conditionText: 'Analyze 50 papers' },
  { id: 'analysis_titan', name: 'Analysis Titan', creatureName: 'Starshare', description: 'Analyze 100 papers', xp: 125, category: 'mastery', rarity: 'legendary', condition: (s) => s.analyses_count >= 100, conditionText: 'Analyze 100 papers' },
  { id: 'streak_champion', name: 'Streak Champion', creatureName: 'Broadcaster', description: 'Achieve a 21-day streak', xp: 75, category: 'streak', rarity: 'epic', condition: (s) => s.longest_streak >= 21, conditionText: '21-day streak' },
  { id: 'streak_titan', name: 'Streak Titan', creatureName: 'Influex', description: 'Achieve a 45-day streak', xp: 125, category: 'streak', rarity: 'legendary', condition: (s) => s.longest_streak >= 45, conditionText: '45-day streak' },

  // ═══════════════════════════════════════════════
  // QUICK REVIEW (8 badges)
  // ═══════════════════════════════════════════════
  { id: 'quick_starter', name: 'Quick Starter', creatureName: 'Speedy', description: 'Complete your first Quick Review', xp: 10, category: 'mastery', rarity: 'common', condition: (s) => s.quick_review_count >= 1, conditionText: 'Complete 1 Quick Review' },
  { id: 'perfect_recall', name: 'Perfect Recall', creatureName: 'Memoria', description: 'Score 100% on a Quick Review', xp: 25, category: 'mastery', rarity: 'rare', condition: (s) => s.quick_review_perfect_scores >= 1, conditionText: 'Get 100% on Quick Review' },
  { id: 'review_regular', name: 'Review Regular', creatureName: 'Reviewer', description: 'Complete 10 Quick Reviews', xp: 30, category: 'mastery', rarity: 'uncommon', condition: (s) => s.quick_review_count >= 10, conditionText: 'Complete 10 Quick Reviews' },
  { id: 'weekly_reviewer', name: 'Weekly Reviewer', creatureName: 'Weekwise', description: '7-day Quick Review streak', xp: 50, category: 'streak', rarity: 'epic', condition: (s) => s.quick_review_longest_streak >= 7, conditionText: '7-day Quick Review streak' },
  { id: 'review_warrior', name: 'Review Warrior', creatureName: 'Revisor', description: 'Complete 30 Quick Reviews', xp: 50, category: 'mastery', rarity: 'rare', condition: (s) => s.quick_review_count >= 30, conditionText: 'Complete 30 Quick Reviews' },
  { id: 'monthly_reviewer', name: 'Monthly Reviewer', creatureName: 'Consistor', description: '30-day Quick Review streak', xp: 150, category: 'streak', rarity: 'legendary', condition: (s) => s.quick_review_longest_streak >= 30, conditionText: '30-day Quick Review streak' },
  { id: 'review_master', name: 'Review Master', creatureName: 'Recallion', description: 'Complete 50 Quick Reviews', xp: 75, category: 'mastery', rarity: 'epic', condition: (s) => s.quick_review_count >= 50, conditionText: 'Complete 50 Quick Reviews' },
  { id: 'review_legend', name: 'Review Legend', creatureName: 'Retainex', description: 'Complete 100 Quick Reviews', xp: 150, category: 'mastery', rarity: 'legendary', condition: (s) => s.quick_review_count >= 100, conditionText: 'Complete 100 Quick Reviews' },

  // ═══════════════════════════════════════════════
  // CRATER BLAST (5 badges)
  // ═══════════════════════════════════════════════
  { id: 'crater_rookie', name: 'Crater Rookie', creatureName: 'Blastling', description: 'Play your first Crater Blast game', xp: 10, category: 'mastery', rarity: 'common', condition: (s) => s.crater_blast_games >= 1, conditionText: 'Play 1 Crater Blast game' },
  { id: 'crater_veteran', name: 'Crater Veteran', creatureName: 'Blastor', description: 'Play 10 Crater Blast games', xp: 30, category: 'mastery', rarity: 'uncommon', condition: (s) => s.crater_blast_games >= 10, conditionText: 'Play 10 Crater Blast games' },
  { id: 'perfect_blaster', name: 'Perfect Blaster', creatureName: 'Perfecto', description: 'Get a perfect score in Crater Blast', xp: 50, category: 'mastery', rarity: 'epic', condition: (s) => s.crater_blast_perfect_games >= 1, conditionText: 'Perfect Crater Blast game' },
  { id: 'crater_champion', name: 'Crater Champion', creatureName: 'Boomking', description: 'Play 25 Crater Blast games', xp: 60, category: 'mastery', rarity: 'rare', condition: (s) => s.crater_blast_games >= 25, conditionText: 'Play 25 Crater Blast games' },
  { id: 'crater_master', name: 'Crater Master', creatureName: 'Craterlord', description: 'Play 50 Crater Blast games', xp: 100, category: 'mastery', rarity: 'legendary', condition: (s) => s.crater_blast_games >= 50, conditionText: 'Play 50 Crater Blast games' },

  // ═══════════════════════════════════════════════
  // ADVANCED MASTERY (7 badges) — the hard ones!
  // ═══════════════════════════════════════════════
  { id: 'study_tool_centurion', name: 'Study Tool Centurion', creatureName: 'Centurion', description: 'Create 100 total study tools', xp: 150, category: 'mastery', rarity: 'legendary', condition: (s) => s.total_study_tools_created >= 100, conditionText: 'Create 100 study tools' },
  { id: 'wordsmith', name: 'Wordsmith', creatureName: 'Lexicon', description: 'Analyze 50,000 words total', xp: 75, category: 'mastery', rarity: 'epic', condition: (s) => s.total_words_analyzed >= 50000, conditionText: 'Analyze 50,000 words' },
  { id: 'word_devourer', name: 'Word Devourer', creatureName: 'Devourex', description: 'Analyze 250,000 words total', xp: 200, category: 'mastery', rarity: 'legendary', condition: (s) => s.total_words_analyzed >= 250000, conditionText: 'Analyze 250,000 words' },
  { id: 'daily_grinder', name: 'Daily Grinder', creatureName: 'Grindox', description: 'Analyze 10 documents in a single day', xp: 75, category: 'special', rarity: 'epic', condition: (s) => s.documents_in_single_day >= 10, conditionText: '10 documents in one day' },
  { id: 'perfectionist', name: 'Perfectionist', creatureName: 'Flawless', description: 'Get 5 perfect Quick Review scores', xp: 60, category: 'mastery', rarity: 'epic', condition: (s) => s.quick_review_perfect_scores >= 5, conditionText: '5 perfect Quick Reviews' },
  { id: 'memory_machine', name: 'Memory Machine', creatureName: 'Mnemonic', description: 'Get 25 perfect Quick Review scores', xp: 150, category: 'mastery', rarity: 'legendary', condition: (s) => s.quick_review_perfect_scores >= 25, conditionText: '25 perfect Quick Reviews' },
  { id: 'export_empire', name: 'Export Empire', creatureName: 'Empirex', description: 'Export 25 study tools', xp: 75, category: 'special', rarity: 'epic', condition: (s) => s.exports_count >= 25, conditionText: 'Export 25 study tools' },

  // ═══════════════════════════════════════════════
  // STUDY PACKS (8 badges) — unified study tool generation
  // ═══════════════════════════════════════════════
  { id: 'study_pack_pioneer', name: 'Study Pack Pioneer', creatureName: 'Packly', description: 'Generate your first Study Pack', xp: 15, category: 'getting-started', rarity: 'common', condition: (s) => (s.study_packs_count || 0) >= 1, conditionText: 'Generate 1 Study Pack' },
  { id: 'study_pack_explorer', name: 'Study Pack Explorer', creatureName: 'Explorix', description: 'Generate 3 Study Packs', xp: 25, category: 'mastery', rarity: 'uncommon', condition: (s) => (s.study_packs_count || 0) >= 3, conditionText: 'Generate 3 Study Packs' },
  { id: 'study_pack_pro', name: 'Study Pack Pro', creatureName: 'Studix', description: 'Generate 5 Study Packs', xp: 35, category: 'mastery', rarity: 'rare', condition: (s) => (s.study_packs_count || 0) >= 5, conditionText: 'Generate 5 Study Packs' },
  { id: 'study_pack_master', name: 'Study Pack Master', creatureName: 'Masterly', description: 'Generate 10 Study Packs', xp: 50, category: 'mastery', rarity: 'epic', condition: (s) => (s.study_packs_count || 0) >= 10, conditionText: 'Generate 10 Study Packs' },
  { id: 'study_pack_champion', name: 'Study Pack Champion', creatureName: 'Champton', description: 'Generate 25 Study Packs', xp: 75, category: 'mastery', rarity: 'epic', condition: (s) => (s.study_packs_count || 0) >= 25, conditionText: 'Generate 25 Study Packs' },
  { id: 'study_pack_legend', name: 'Study Pack Legend', creatureName: 'Legendix', description: 'Generate 50 Study Packs', xp: 100, category: 'mastery', rarity: 'legendary', condition: (s) => (s.study_packs_count || 0) >= 50, conditionText: 'Generate 50 Study Packs' },
  { id: 'study_pack_centurion', name: 'Study Pack Centurion', creatureName: 'Centurion', description: 'Generate 100 Study Packs', xp: 150, category: 'mastery', rarity: 'legendary', condition: (s) => (s.study_packs_count || 0) >= 100, conditionText: 'Generate 100 Study Packs' },
  { id: 'study_pack_god', name: 'Study Pack God', creatureName: 'Packgod', description: 'Generate 200 Study Packs', xp: 250, category: 'mastery', rarity: 'legendary', condition: (s) => (s.study_packs_count || 0) >= 200, conditionText: 'Generate 200 Study Packs' },

  // ═══════════════════════════════════════════════
  // FOCUS MODE (5 badges)
  // ═══════════════════════════════════════════════
  { id: 'focus_mode_first_unlock', name: 'Unlocked!', creatureName: 'Keyley', description: 'Complete your first Focus Mode unlock', xp: 15, category: 'getting-started', rarity: 'common', condition: (s) => (s.focus_mode_unlocks_count || 0) >= 1, conditionText: 'Pass the unlock quiz once' },
  { id: 'focus_mode_first_block', name: 'Block Party', creatureName: 'Blocky', description: 'Block your first distracting website', xp: 15, category: 'getting-started', rarity: 'common', condition: (s) => (s.focus_mode_sites_blocked || 0) >= 1, conditionText: 'Block 1 website' },
  { id: 'focus_mode_unlock_5', name: 'Earned It', creatureName: 'Earnix', description: 'Unlock sites 5 times with the quiz', xp: 30, category: 'mastery', rarity: 'uncommon', condition: (s) => (s.focus_mode_unlocks_count || 0) >= 5, conditionText: 'Unlock sites 5 times' },
  { id: 'focus_mode_block_5', name: 'Distraction Destroyer', creatureName: 'Destroyix', description: 'Block 5 distracting websites', xp: 30, category: 'mastery', rarity: 'uncommon', condition: (s) => (s.focus_mode_sites_blocked || 0) >= 5, conditionText: 'Block 5 websites' },
  { id: 'focus_mode_master', name: 'Focus Master', creatureName: 'Focusix', description: 'Unlock sites 10 times', xp: 50, category: 'mastery', rarity: 'epic', condition: (s) => (s.focus_mode_unlocks_count || 0) >= 10, conditionText: 'Unlock sites 10 times' },
];

const STATS_KEY = 'writescholar_achievement_stats';
const UNLOCKED_KEY = 'writescholar_achievements_unlocked';
const getApiBase = () => (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL)
  ? (import.meta as any).env.VITE_API_URL
  : 'http://localhost:3001/api';

function defaultStats(): AchievementStats {
  return {
    uploads_count: 0,
    analyses_count: 0,
    summaries_count: 0,
    quizzes_count: 0,
    flashcards_count: 0,
    crosswords_count: 0,
    citations_count: 0,
    lessons_count: 0,
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
    calendar_events_count: 0,
    friend_requests_sent: 0,
    friends_count: 0,
    shares_count: 0,
    unique_friends_shared_with: [],
    quick_review_count: 0,
    quick_review_perfect_scores: 0,
    quick_review_current_streak: 0,
    quick_review_longest_streak: 0,
    crater_blast_games: 0,
    crater_blast_perfect_games: 0,
    crater_blast_high_score: 0,
    total_study_tools_created: 0,
    total_words_analyzed: 0,
    documents_in_single_day: 0,
    study_sessions_count: 0,
    focus_mode_unlocks_count: 0,
    focus_mode_sites_blocked: 0,
    study_packs_count: 0,
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
  persistToServer();
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
  persistToServer();
}

/** Persist current stats + badges to Supabase (fire-and-forget when logged in) */
function persistToServer() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
  if (!token) return;
  const stats = getStats();
  const unlocked = getUnlockedBadges();
  fetch(`${getApiBase()}/users/achievements`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ stats, unlockedBadges: unlocked }),
  }).catch(() => { /* ignore */ });
}

/** Merge server achievements into localStorage (take best of both) */
export function mergeFromServer(serverStats: Record<string, unknown>, serverBadges: Record<string, string>) {
  const local = getStats();
  const localBadges = getUnlockedBadges();

  const numericKeys = [
    'uploads_count', 'analyses_count', 'summaries_count',
    'quizzes_count', 'flashcards_count', 'crosswords_count', 'citations_count',
    'lessons_count',
    'longest_streak', 'current_streak', 'tools_used_session', 'study_tools_session',
    'exports_count', 'copies_count',
    'calendar_events_count', 'friend_requests_sent', 'friends_count', 'shares_count',
    'quick_review_count', 'quick_review_perfect_scores', 'quick_review_current_streak',
    'quick_review_longest_streak', 'crater_blast_games', 'crater_blast_perfect_games',
    'crater_blast_high_score', 'total_study_tools_created', 'total_words_analyzed',
    'documents_in_single_day', 'study_sessions_count',
    'focus_mode_unlocks_count', 'focus_mode_sites_blocked',
    'study_packs_count',
  ];
  const merged = { ...local };
  for (const key of numericKeys) {
    const s = (serverStats as any)[key];
    if (s !== undefined && s !== null) {
      merged[key as keyof AchievementStats] = Math.max((merged as any)[key] ?? 0, Number(s)) as any;
    }
  }
  const boolKeys = ['used_after_10pm', 'used_before_7am', 'is_paid_user', 'midnight_usage', 'weekend_usage', 'visited_badges', 'first_login'];
  for (const key of boolKeys) {
    if ((serverStats as any)[key]) merged[key as keyof AchievementStats] = true as any;
  }
  // Merge array fields
  if (Array.isArray(serverStats.tools_used_ever)) {
    merged.tools_used_ever = [...new Set([...(merged.tools_used_ever || []), ...(serverStats.tools_used_ever as string[])])];
  }
  if (Array.isArray(serverStats.unique_friends_shared_with)) {
    merged.unique_friends_shared_with = [...new Set([...(merged.unique_friends_shared_with || []), ...(serverStats.unique_friends_shared_with as string[])])];
  }
  if (serverStats.paid_since && (!merged.paid_since || new Date(serverStats.paid_since as string) < new Date(merged.paid_since))) {
    merged.paid_since = serverStats.paid_since as string;
  }
  if (serverStats.last_active_date && (!merged.last_active_date || new Date(serverStats.last_active_date as string) > new Date(merged.last_active_date))) {
    merged.last_active_date = serverStats.last_active_date as string;
  }

  const mergedBadges = { ...localBadges };
  for (const [id, date] of Object.entries(serverBadges)) {
    if (!mergedBadges[id] || (date && new Date(date) < new Date(mergedBadges[id]))) {
      mergedBadges[id] = date;
    }
  }

  saveStats(merged);
  saveUnlockedBadges(mergedBadges);
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
    // Dispatch global event so badge popup can show from any page
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('writescholar-badge-unlocked', { detail: newlyUnlocked }));
    }
  }

  return newlyUnlocked;
}

const TOOL_TYPE_MAP: Record<string, string> = {
  analyses_count: 'analyze',
  summaries_count: 'summarize',
  quizzes_count: 'quiz',
  flashcards_count: 'flashcard',
  crosswords_count: 'crossword',
  citations_count: 'citation',
  lessons_count: 'lesson',
  study_packs_count: 'study_pack',
};

export function trackAction(action: keyof AchievementStats, value?: number | boolean): string[] {
  const stats = getStats();

  if (typeof value === 'boolean') {
    (stats as any)[action] = value;
  } else {
    (stats as any)[action] = ((stats as any)[action] || 0) + (value || 1);
  }

  applyTimeChecks(stats);

  // Track tool diversity for all_rounder
  const toolType = TOOL_TYPE_MAP[action as string];
  if (toolType) {
    const toolsEver = stats.tools_used_ever || [];
    if (!toolsEver.includes(toolType)) {
      stats.tools_used_ever = [...toolsEver, toolType];
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

export function trackCalendarEvent(): string[] {
  const stats = getStats();
  stats.calendar_events_count = (stats.calendar_events_count || 0) + 1;
  saveStats(stats);
  return checkAndUnlockBadges(stats);
}

export function trackFriendRequest(): string[] {
  const stats = getStats();
  stats.friend_requests_sent = (stats.friend_requests_sent || 0) + 1;
  saveStats(stats);
  return checkAndUnlockBadges(stats);
}

export function trackFriendAdded(): string[] {
  const stats = getStats();
  stats.friends_count = (stats.friends_count || 0) + 1;
  saveStats(stats);
  return checkAndUnlockBadges(stats);
}

export function trackShare(friendId?: string): string[] {
  const stats = getStats();
  stats.shares_count = (stats.shares_count || 0) + 1;
  if (friendId) {
    const sharedWith = stats.unique_friends_shared_with || [];
    if (!sharedWith.includes(friendId)) {
      stats.unique_friends_shared_with = [...sharedWith, friendId];
    }
  }
  saveStats(stats);
  return checkAndUnlockBadges(stats);
}

export function trackQuickReview(isPerfect: boolean = false): string[] {
  const stats = getStats();
  stats.quick_review_count = (stats.quick_review_count || 0) + 1;
  if (isPerfect) {
    stats.quick_review_perfect_scores = (stats.quick_review_perfect_scores || 0) + 1;
  }
  saveStats(stats);
  return checkAndUnlockBadges(stats);
}

export function updateQuickReviewStreak(currentStreak: number): string[] {
  const stats = getStats();
  stats.quick_review_current_streak = currentStreak;
  stats.quick_review_longest_streak = Math.max(stats.quick_review_longest_streak || 0, currentStreak);
  saveStats(stats);
  return checkAndUnlockBadges(stats);
}

export function trackFocusModeUnlock(): string[] {
  const stats = getStats();
  stats.focus_mode_unlocks_count = (stats.focus_mode_unlocks_count || 0) + 1;
  saveStats(stats);
  return checkAndUnlockBadges(stats);
}

export function trackCraterBlastGame(isPerfect: boolean = false, score: number = 0): string[] {
  const stats = getStats();
  stats.crater_blast_games = (stats.crater_blast_games || 0) + 1;
  if (isPerfect) {
    stats.crater_blast_perfect_games = (stats.crater_blast_perfect_games || 0) + 1;
  }
  stats.crater_blast_high_score = Math.max(stats.crater_blast_high_score || 0, score);
  saveStats(stats);
  return checkAndUnlockBadges(stats);
}

/**
 * Track a unified Study Pack generation.
 * This increments all individual tool counters (quiz, flashcards, crossword, lesson)
 * plus the study_packs_count, and updates total_study_tools_created.
 */
export function trackStudyPackGenerated(wordCount: number = 0): string[] {
  const stats = getStats();
  
  // Increment the study pack counter
  stats.study_packs_count = (stats.study_packs_count || 0) + 1;
  
  // A study pack creates 5 different study tools, so increment each
  stats.quizzes_count = (stats.quizzes_count || 0) + 1;
  stats.flashcards_count = (stats.flashcards_count || 0) + 1;
  stats.crosswords_count = (stats.crosswords_count || 0) + 1;
  stats.lessons_count = (stats.lessons_count || 0) + 1;
  // Crater Blast questions are generated but we track games played separately
  
  // Update total study tools (5 tools per pack)
  stats.total_study_tools_created = (stats.total_study_tools_created || 0) + 5;
  
  // Track words analyzed
  if (wordCount > 0) {
    stats.total_words_analyzed = (stats.total_words_analyzed || 0) + wordCount;
  }
  
  // Track tool diversity for all_rounder badge
  const toolsEver = stats.tools_used_ever || [];
  const newTools = ['quiz', 'flashcard', 'crossword', 'lesson', 'study_pack'];
  for (const tool of newTools) {
    if (!toolsEver.includes(tool)) {
      toolsEver.push(tool);
    }
  }
  stats.tools_used_ever = toolsEver;
  stats.tools_used_session = (stats.tools_used_session || 0) + 1;
  stats.study_tools_session = (stats.study_tools_session || 0) + 5;
  
  applyTimeChecks(stats);
  saveStats(stats);
  return checkAndUnlockBadges(stats);
}

export function trackStudyToolCreated(wordCount: number = 0): string[] {
  const stats = getStats();
  stats.total_study_tools_created = (stats.total_study_tools_created || 0) + 1;
  stats.total_words_analyzed = (stats.total_words_analyzed || 0) + wordCount;
  saveStats(stats);
  return checkAndUnlockBadges(stats);
}

export function trackDocumentsInDay(count: number): string[] {
  const stats = getStats();
  stats.documents_in_single_day = Math.max(stats.documents_in_single_day || 0, count);
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

  // First login
  stats.first_login = true;

  applyTimeChecks(stats);

  const today = new Date().toISOString().split('T')[0];
  // Check badges BEFORE updating last_active_date so Comeback Kid can see the 7+ day gap
  const newlyUnlocked = checkAndUnlockBadges(stats);
  stats.last_active_date = today;

  saveStats(stats);
  return newlyUnlocked;
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
