/**
 * Free grades for accounts that have not verified their email yet.
 *
 * An email sign-up gets its first grade straight away, before any
 * inbox round trip, because that is the moment the student wants it.
 * After that the email has to be verified to use the rest of the
 * monthly free grades. Google and Apple accounts arrive verified.
 *
 * To stop one connection farming made-up addresses for that first
 * grade, unverified first grades are also capped per IP per day.
 * The IP counter lives in memory: it resets on deploy and is per
 * instance, which is enough to blunt scripts without a new table.
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseServiceRole = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

/** Grades an unverified account may run before it must verify. */
const UNVERIFIED_GRADE_ALLOWANCE = Math.max(0, parseInt(process.env.UNVERIFIED_GRADE_ALLOWANCE || '1', 10) || 0);
/** Unverified first grades allowed from one IP in 24 hours. */
const UNVERIFIED_GRADES_PER_IP_PER_DAY = Math.max(1, parseInt(process.env.UNVERIFIED_GRADES_PER_IP_PER_DAY || '2', 10) || 2);
const DAY_MS = 24 * 60 * 60 * 1000;

const ipGrades = new Map(); // ip -> timestamps (ms) of unverified grades

function prune(ip, now) {
  const list = (ipGrades.get(ip) || []).filter((t) => now - t < DAY_MS);
  if (list.length) ipGrades.set(ip, list);
  else ipGrades.delete(ip);
  return list;
}

// Keep the map from growing without bound on a long-lived instance.
setInterval(() => {
  const now = Date.now();
  for (const ip of ipGrades.keys()) prune(ip, now);
}, 60 * 60 * 1000).unref();

async function countAllGrades(userId) {
  const { count, error } = await supabaseServiceRole
    .from('document_analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw error;
  return count || 0;
}

/**
 * Decide whether an unverified free account may grade now.
 * Returns { allowed: true } or { allowed: false, reason: 'verify' | 'ip_limit' }.
 * Verified accounts always pass.
 */
async function checkUnverifiedGrade(user, ip) {
  if (!user || user.email_verified === true) return { allowed: true };
  let used = 0;
  try {
    used = await countAllGrades(user.id);
  } catch (err) {
    // If the count fails, fail closed for unverified accounts: the
    // verify prompt is a recoverable state, an unbounded grade is not.
    console.error('Unverified grade count failed:', err?.message || err);
    return { allowed: false, reason: 'verify' };
  }
  if (used >= UNVERIFIED_GRADE_ALLOWANCE) return { allowed: false, reason: 'verify' };
  const key = ip || 'unknown';
  if (prune(key, Date.now()).length >= UNVERIFIED_GRADES_PER_IP_PER_DAY) {
    return { allowed: false, reason: 'ip_limit' };
  }
  return { allowed: true, unverified: true };
}

/** Call once an unverified grade has actually started. */
function recordUnverifiedGrade(ip) {
  const key = ip || 'unknown';
  const list = prune(key, Date.now());
  list.push(Date.now());
  ipGrades.set(key, list);
}

/** The 403 body the web and iOS clients both understand. */
function verifyEmailResponse(user, reason) {
  const email = user?.email || 'your inbox';
  return {
    success: false,
    code: 'VERIFY_EMAIL',
    verifyEmail: true,
    reason,
    email: user?.email || null,
    message:
      reason === 'ip_limit'
        ? `Verify your email to keep grading. We sent a link to ${email}.`
        : `Verify your email to keep grading. We sent a link to ${email}.`,
  };
}

module.exports = {
  UNVERIFIED_GRADE_ALLOWANCE,
  UNVERIFIED_GRADES_PER_IP_PER_DAY,
  checkUnverifiedGrade,
  recordUnverifiedGrade,
  verifyEmailResponse,
  _resetForTests: () => ipGrades.clear(),
};
