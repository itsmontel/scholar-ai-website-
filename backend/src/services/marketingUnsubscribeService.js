const { query } = require('../database/connection');

function normalizeMarketingEmail(email) {
  return String(email || '').toLowerCase().trim();
}

/** True if this address is on the permanent marketing blocklist. */
async function isMarketingEmailBlocked(email) {
  const normalizedEmail = normalizeMarketingEmail(email);
  if (!normalizedEmail) return false;

  const result = await query(
    'SELECT id FROM marketing_email_unsubscribes WHERE email = $1',
    [normalizedEmail]
  );

  return result.rows.length > 0;
}

/** Add email to the permanent blocklist (idempotent). */
async function blockMarketingEmail(email, source = 'unsubscribe_page') {
  const normalizedEmail = normalizeMarketingEmail(email);
  if (!normalizedEmail) {
    throw new Error('Email is required');
  }

  const result = await query(
    `INSERT INTO marketing_email_unsubscribes (email, source, unsubscribed_at, created_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT (email) DO UPDATE SET
       source = EXCLUDED.source,
       unsubscribed_at = CURRENT_TIMESTAMP
     RETURNING id, email, source, unsubscribed_at`,
    [normalizedEmail, source]
  );

  return result.rows[0];
}

module.exports = {
  normalizeMarketingEmail,
  isMarketingEmailBlocked,
  blockMarketingEmail,
};
