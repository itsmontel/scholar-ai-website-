const jwt = require('jsonwebtoken');

// Sign in with Apple token exchange + revocation. Apple requires apps that
// offer Sign in with Apple to revoke the user's tokens when they delete their
// account (App Store guideline 5.1.1(v)).
//
// Needs a Sign in with Apple key from the Apple Developer portal
// (Certificates, Identifiers & Profiles > Keys):
//   APPLE_TEAM_ID      10-character team id
//   APPLE_KEY_ID       10-character key id
//   APPLE_PRIVATE_KEY  contents of the .p8 file (literal "\n" is accepted)
//   APPLE_CLIENT_ID    bundle id, defaults to com.writescholar.app
// Without them, exchange and revoke are skipped (logged, never thrown).

const APPLE_AUDIENCE = 'https://appleid.apple.com';
const APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token';
const APPLE_REVOKE_URL = 'https://appleid.apple.com/auth/revoke';

const clientId = () => process.env.APPLE_CLIENT_ID || 'com.writescholar.app';

const isConfigured = () => Boolean(
  process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY
);

const makeClientSecret = () => {
  const privateKey = process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n');
  return jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    keyid: process.env.APPLE_KEY_ID,
    issuer: process.env.APPLE_TEAM_ID,
    audience: APPLE_AUDIENCE,
    subject: clientId(),
    expiresIn: '5m'
  });
};

const postForm = (url, params) => fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams(params).toString()
});

// Trades the one-time authorization code from the iOS sign-in for a refresh
// token, which is what gets revoked later. Returns null when not configured.
const exchangeAuthorizationCode = async (code) => {
  if (!code || !isConfigured()) return null;

  const resp = await postForm(APPLE_TOKEN_URL, {
    client_id: clientId(),
    client_secret: makeClientSecret(),
    code,
    grant_type: 'authorization_code'
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(`Apple token exchange failed (${resp.status}): ${json.error || 'unknown'}`);
  }
  return json.refresh_token || null;
};

// Returns true when Apple accepted the revocation, false when skipped.
const revokeRefreshToken = async (refreshToken) => {
  if (!refreshToken || !isConfigured()) return false;

  const resp = await postForm(APPLE_REVOKE_URL, {
    client_id: clientId(),
    client_secret: makeClientSecret(),
    token: refreshToken,
    token_type_hint: 'refresh_token'
  });
  if (!resp.ok) {
    const json = await resp.json().catch(() => ({}));
    throw new Error(`Apple token revoke failed (${resp.status}): ${json.error || 'unknown'}`);
  }
  return true;
};

module.exports = {
  isConfigured,
  exchangeAuthorizationCode,
  revokeRefreshToken
};
