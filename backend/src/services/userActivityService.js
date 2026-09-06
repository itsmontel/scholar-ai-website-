const userService = require('./userService');

/** Min minutes between DB writes per user — keeps cost negligible. */
const LAST_ACTIVE_THROTTLE_MINUTES = 15;

/**
 * Bump last_active_at at most once per throttle window.
 * Uses the user row already loaded by auth middleware (no extra SELECT).
 */
function touchLastActive(user) {
  if (!user?.id) return;

  const lastActiveMs = user.last_active_at ? new Date(user.last_active_at).getTime() : 0;
  const throttleMs = LAST_ACTIVE_THROTTLE_MINUTES * 60 * 1000;
  if (lastActiveMs && Date.now() - lastActiveMs < throttleMs) {
    return;
  }

  const now = new Date().toISOString();

  userService
    .updateUser(user.id, { last_active_at: now })
    .then(() => {
      user.last_active_at = now;
    })
    .catch((error) => {
      console.error('touchLastActive error:', error.message);
    });
}

module.exports = {
  touchLastActive,
  LAST_ACTIVE_THROTTLE_MINUTES,
};
