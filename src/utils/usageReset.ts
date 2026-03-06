/**
 * Usage limits reset on the 1st of each calendar month.
 * Returns the number of days until the next reset.
 */
export function getDaysUntilReset(): number {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const diffMs = nextMonth.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Returns a user-friendly string like "Resets in 5 days" or "Resets tomorrow"
 */
export function getResetsInText(): string {
  const days = getDaysUntilReset();
  if (days <= 0) return 'Resets today';
  if (days === 1) return 'Resets tomorrow';
  return `Resets in ${days} days`;
}

/**
 * Free user data (citations, quizzes, flashcards, crosswords) expires on the 1st of each month.
 * This checks if we're in the last 7 days of the month to show urgency warnings.
 */
export function isEndOfMonthUrgency(): boolean {
  return getDaysUntilReset() <= 7;
}

/**
 * Returns urgency warning text for free users near end of month.
 * Returns null if not in urgency period.
 */
export function getEndOfMonthUrgencyText(): string | null {
  const days = getDaysUntilReset();
  if (days > 7) return null;
  
  if (days <= 0) {
    return 'Your study tools and citations will be cleared today. Upgrade to keep them forever!';
  }
  if (days === 1) {
    return 'Your study tools and citations will be cleared tomorrow. Upgrade to keep them forever!';
  }
  if (days <= 3) {
    return `Only ${days} days left! Your study tools and citations will be cleared on the 1st. Upgrade to keep them forever!`;
  }
  return `${days} days until your study tools and citations are cleared. Upgrade to keep them forever!`;
}
