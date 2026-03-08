/**
 * Usage limits reset: paid = billing period, free = rolling 30 days from signup.
 * When daysUntilReset is provided from API, use it. Otherwise fallback to calendar month.
 */
export function getDaysUntilReset(daysFromApi?: number | null): number {
  if (typeof daysFromApi === 'number' && daysFromApi >= 0) return daysFromApi;
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const diffMs = nextMonth.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Returns a user-friendly string like "Resets in 5 days" or "Resets tomorrow"
 * @param daysUntilReset - Optional. When provided from API (paid period or free signup-based), uses it. Else uses calendar month.
 */
export function getResetsInText(daysUntilReset?: number | null): string {
  const days = getDaysUntilReset(daysUntilReset);
  if (days <= 0) return 'Resets today';
  if (days === 1) return 'Resets tomorrow';
  return `Resets in ${days} days`;
}

/**
 * Get days until expiration. Returns null if no expiration (permanent).
 */
export function getDaysUntilExpiration(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffTime = expires.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Count items expiring within the given number of days (e.g. 7 = "expiring soon").
 */
export function getExpiringSoonCount<T extends { expires_at?: string | null }>(
  items: T[],
  thresholdDays: number = 7
): number {
  return items.filter((item) => {
    const days = getDaysUntilExpiration(item.expires_at ?? null);
    return days !== null && days >= 0 && days <= thresholdDays;
  }).length;
}

/**
 * Returns urgency text when items are expiring soon. Use with getExpiringSoonCount.
 */
export function getExpiringSoonUrgencyText(count: number): string | null {
  if (count <= 0) return null;
  if (count === 1) {
    return '1 item will expire in the next few days. Upgrade to keep it forever!';
  }
  return `${count} items will expire in the next few days. Upgrade to keep them forever!`;
}

/**
 * Free user data (citations, quizzes, flashcards, crosswords) expires 30 days after creation.
 * Returns true when we should show the expiration warning (when items are expiring soon).
 */
export function isEndOfMonthUrgency(): boolean {
  return true;
}

/**
 * Returns generic urgency warning text for free users about 30-day expiration.
 * For dynamic count-based messaging, use getExpiringSoonUrgencyText(getExpiringSoonCount(items)).
 */
export function getEndOfMonthUrgencyText(): string | null {
  return 'Free items expire 30 days after creation. Upgrade to keep them forever!';
}
