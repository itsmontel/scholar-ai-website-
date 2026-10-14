/**
 * Credit balance: trial credits, monthly rollover, the 499 cap, pause,
 * upgrades and the reset on cancel. Supabase and the subscription lookup
 * are replaced with an in-memory fake.
 */

const mockDb = { user: {}, actions: [] };

function mockQuery(table) {
  const filters = [];
  let update = null;
  const run = () => {
    if (table === 'users') {
      if (update) {
        for (const [op, key, value] of filters) {
          if (key === 'id') continue;
          if ((op === 'eq' || op === 'is') && mockDb.user[key] !== value) return { error: null };
        }
        Object.assign(mockDb.user, update);
        return { error: null };
      }
      return { data: { ...mockDb.user }, error: null };
    }
    if (table === 'subscriptions') return { data: null, error: null };
    const kind = table === 'quiz_usage' ? 'pack' : table === 'citation_searches' ? 'cite' : 'analysis';
    let rows = mockDb.actions.filter((a) => a.kind === kind);
    for (const [op, key, value] of filters) {
      if (key !== 'created_at') continue;
      if (op === 'gte') rows = rows.filter((a) => a.at >= value);
      if (op === 'lt') rows = rows.filter((a) => a.at < value);
    }
    return { count: rows.length, error: null };
  };
  const api = {
    select: () => api,
    update: (v) => { update = v; return api; },
    eq: (k, v) => { filters.push(['eq', k, v]); return api; },
    is: (k, v) => { filters.push(['is', k, v]); return api; },
    gte: (k, v) => { filters.push(['gte', k, v]); return api; },
    lt: (k, v) => { filters.push(['lt', k, v]); return api; },
    in: () => api,
    order: () => api,
    limit: () => api,
    maybeSingle: () => Promise.resolve(run()),
    then: (resolve, reject) => Promise.resolve(run()).then(resolve, reject),
  };
  return api;
}

jest.mock('@supabase/supabase-js', () => ({ createClient: () => ({ from: (t) => mockQuery(t) }) }));

const mockState = { plan: 'pro', sub: null };
jest.mock('../subscriptionService', () => ({
  getUserSubscriptionDetails: async () => ({ plan: mockState.plan, stripeCustomerId: 'cus_test' }),
  normalizePlanForLimits: (p) => p,
  isPaidSubscriptionTier: (p) => p === 'pro' || p === 'premium',
  getActiveSubscriptionByCustomer: async () => mockState.sub,
  getUsagePeriod: async () => { throw new Error('not used'); },
}));

const credits = require('../creditService');

const DAY = 86400;
const base = Math.floor(Date.UTC(2026, 9, 1) / 1000);
const at = (d) => new Date((base + d * DAY) * 1000).toISOString();
const sub = (status, start, end, extra = {}) => ({
  status, current_period_start: base + start * DAY, current_period_end: base + end * DAY, ...extra,
});
const spend = (n, day, kind = 'analysis') => { for (let i = 0; i < n; i++) mockDb.actions.push({ kind, at: at(day) }); };

beforeEach(() => {
  mockDb.user = { credits_rollover: 0, credits_period_start: null, credits_period_allowance: null };
  mockDb.actions = [];
  mockState.plan = 'pro';
  mockState.sub = null;
});

test('the trial has 3 credits and leftovers roll into the first paid month', async () => {
  mockState.sub = sub('trialing', 0, 3);
  let c = await credits.getCreditState('u1');
  expect([c.total, c.remaining, c.isTrial]).toEqual([3, 3, true]);

  spend(2, 1, 'pack');
  mockState.sub = sub('active', 3, 33);
  c = await credits.getCreditState('u1');
  expect([c.rollover, c.allowance, c.total]).toEqual([1, 99, 100]);
});

test('unused credits roll over and stop at 499', async () => {
  mockState.sub = sub('active', 0, 30);
  await credits.getCreditState('u1');
  spend(10, 5);

  mockState.sub = sub('active', 30, 60);
  let c = await credits.getCreditState('u1');
  expect([c.rollover, c.total]).toEqual([89, 188]);
  // Reading again in the same period doesn't roll over twice.
  c = await credits.getCreditState('u1');
  expect(c.total).toBe(188);

  for (const [start, total] of [[60, 287], [90, 386], [120, 485], [150, 499]]) {
    mockState.sub = sub('active', start, start + 30);
    c = await credits.getCreditState('u1');
    expect(c.total).toBe(total);
  }
  expect(c.wouldLoseAtRenewal).toBe(99);
});

test('a paused period adds nothing but keeps the balance', async () => {
  mockState.sub = sub('active', 0, 30);
  await credits.getCreditState('u1');
  spend(9, 2, 'cite');

  mockState.sub = sub('active', 30, 60, { pause_collection: { behavior: 'void' } });
  let c = await credits.getCreditState('u1');
  expect([c.allowance, c.total, c.isPaused, c.nextTopUp]).toEqual([0, 90, true, 0]);

  // Resuming mid-period doesn't top up early.
  mockState.sub = sub('active', 30, 60);
  c = await credits.getCreditState('u1');
  expect(c.total).toBe(90);

  mockState.sub = sub('active', 60, 90);
  c = await credits.getCreditState('u1');
  expect(c.total).toBe(189);
});

test('upgrading mid-period tops up to the Premium allowance', async () => {
  mockState.sub = sub('active', 0, 30);
  await credits.getCreditState('u1');
  mockState.plan = 'premium';
  const c = await credits.getCreditState('u1');
  expect([c.allowance, c.total]).toEqual([199, 199]);
});

test('cancelling resets the balance to 0', async () => {
  mockState.sub = sub('active', 0, 30);
  await credits.getCreditState('u1');
  mockState.sub = sub('active', 30, 60);
  expect((await credits.getCreditState('u1')).total).toBe(198);

  await credits.resetCredits('u1');
  mockState.sub = sub('active', 200, 230);
  const c = await credits.getCreditState('u1');
  expect([c.rollover, c.total]).toEqual([0, 99]);
});

test('free accounts have no credits', async () => {
  mockState.plan = 'free';
  const c = await credits.getCreditState('u1');
  expect([c.total, c.remaining]).toEqual([0, 0]);
});
