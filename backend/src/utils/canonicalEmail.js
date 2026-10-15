/**
 * One inbox, one key, for the one-free-trial-per-person check.
 *
 * Lowercases, drops a "+tag" from the local part, and for Gmail drops
 * dots and folds googlemail.com into gmail.com, because Gmail delivers
 * all of these to the same inbox:
 *
 *   S.a.m+trial2@GoogleMail.com  →  sam@gmail.com
 *
 * Only for comparing addresses. Never send email to the result.
 * Mirrored in SQL by migrations/20261015_trial_usage_canonical_email.sql.
 */
const GMAIL_DOMAINS = new Set(['gmail.com', 'googlemail.com']);

function canonicalEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  const at = e.indexOf('@');
  if (at <= 0) return e;
  let local = e.slice(0, at).split('+')[0];
  let domain = e.slice(at + 1);
  if (GMAIL_DOMAINS.has(domain)) {
    local = local.replace(/\./g, '');
    domain = 'gmail.com';
  }
  return `${local}@${domain}`;
}

module.exports = { canonicalEmail };
