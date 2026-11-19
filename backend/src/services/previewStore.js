/**
 * First result before sign-up.
 *
 * The landing page lets a visitor build one study pack or grade one essay
 * without an account. The result is generated once, kept here under an
 * unguessable token, and handed to the visitor's new account when they
 * sign up to keep it, so the model is never called twice for the same
 * work and the grade they saw is the grade they get.
 *
 * Everything lives in memory: it resets on deploy and is per instance.
 * A lost entry only means the work is generated again after sign-up.
 *
 * Limits keep an open endpoint from becoming a free API:
 *   - a cap per IP per day (generous, because a campus shares one IP),
 *   - one generation at a time per IP,
 *   - a cap across all visitors per day.
 */

const crypto = require('crypto');

const intEnv = (name, fallback) => {
  const n = parseInt(process.env[name] || '', 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

const PREVIEWS_PER_IP_PER_DAY = intEnv('PREVIEWS_PER_IP_PER_DAY', 5);
const PREVIEWS_PER_DAY = intEnv('PREVIEWS_PER_DAY', 300);
const TTL_MS = 2 * 60 * 60 * 1000;
const MAX_ENTRIES = 400;
const DAY_MS = 24 * 60 * 60 * 1000;

const entries = new Map(); // token -> { kind, payload, createdAt }
const ipRuns = new Map(); // ip -> timestamps (ms)
const inFlight = new Set(); // ips with a generation running
let allRuns = []; // timestamps (ms) across every visitor

function pruneRuns(now) {
  allRuns = allRuns.filter((t) => now - t < DAY_MS);
  for (const [ip, list] of ipRuns) {
    const kept = list.filter((t) => now - t < DAY_MS);
    if (kept.length) ipRuns.set(ip, kept);
    else ipRuns.delete(ip);
  }
}

function pruneEntries(now) {
  for (const [token, entry] of entries) {
    if (now - entry.createdAt > TTL_MS) entries.delete(token);
  }
  // Oldest first, so a burst cannot grow the map without bound.
  while (entries.size > MAX_ENTRIES) {
    entries.delete(entries.keys().next().value);
  }
}

setInterval(() => {
  const now = Date.now();
  pruneRuns(now);
  pruneEntries(now);
}, 15 * 60 * 1000).unref();

/**
 * May this IP start a preview now?
 * Returns { allowed: true } or { allowed: false, reason: 'busy' | 'ip_limit' | 'daily_limit' }.
 */
function checkPreview(ip) {
  const key = ip || 'unknown';
  const now = Date.now();
  pruneRuns(now);
  if (inFlight.has(key)) return { allowed: false, reason: 'busy' };
  if ((ipRuns.get(key) || []).length >= PREVIEWS_PER_IP_PER_DAY) return { allowed: false, reason: 'ip_limit' };
  if (allRuns.length >= PREVIEWS_PER_DAY) return { allowed: false, reason: 'daily_limit' };
  return { allowed: true };
}

/** Mark a preview as started. Call finishPreview(ip) when it ends, however it ends. */
function startPreview(ip) {
  const key = ip || 'unknown';
  const now = Date.now();
  inFlight.add(key);
  ipRuns.set(key, [...(ipRuns.get(key) || []), now]);
  allRuns.push(now);
}

function finishPreview(ip) {
  inFlight.delete(ip || 'unknown');
}

/** Keep a finished result. Returns the token that claims it. */
function putPreview(kind, payload) {
  const now = Date.now();
  pruneEntries(now);
  const token = crypto.randomBytes(24).toString('base64url');
  entries.set(token, { kind, payload, createdAt: now });
  return token;
}

/** Look a result up without removing it. Null when missing, expired or the wrong kind. */
function getPreview(token, kind) {
  if (typeof token !== 'string' || token.length < 16 || token.length > 64) return null;
  const entry = entries.get(token);
  if (!entry || entry.kind !== kind) return null;
  if (Date.now() - entry.createdAt > TTL_MS) {
    entries.delete(token);
    return null;
  }
  return entry.payload;
}

/** Remove a result once an account owns it. */
function dropPreview(token) {
  if (typeof token === 'string') entries.delete(token);
}

/** The 429 body the landing page understands. */
function previewLimitResponse(reason) {
  return {
    success: false,
    code: 'PREVIEW_LIMIT',
    reason,
    signUp: true,
    message:
      reason === 'busy'
        ? 'One is already being made for you. Give it a moment.'
        : 'That is all the free tries for today from here. Sign up free to keep going: you get 3 a month.',
  };
}

module.exports = {
  PREVIEWS_PER_IP_PER_DAY,
  PREVIEWS_PER_DAY,
  checkPreview,
  startPreview,
  finishPreview,
  putPreview,
  getPreview,
  dropPreview,
  previewLimitResponse,
  _resetForTests: () => {
    entries.clear();
    ipRuns.clear();
    inFlight.clear();
    allRuns = [];
  },
};
