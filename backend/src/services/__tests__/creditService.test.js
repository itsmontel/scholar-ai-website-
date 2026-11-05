/**
 * Credit balance: trial credits, monthly rollover, the 499 cap, pause,
 * upgrades and the reset on cancel. Supabase and the subscription lookup
 * are replaced with an in-memory fake.
 */

// Free tier: 3 essay grades a calendar month.
process.env.FREE_CREDITS = '3';

const mockDb = { user: {}, actions: [], achievements: null };

function mockQuery(table) {
  const filters = [];
  let update = null;
  let insert = null;
  const run = () => {
    if (table === 'user_achievements') {
      if (insert) {
        if (mockDb.achievements) return { error: { message: 'duplicate key value' } };
        mockDb.achievements = { ...insert };
        return { error: null };
      }
      if (update) {
        mockDb.achievements = { ...mockDb.achievements, ...update };
        return { error: null };
      }
      return { data: mockDb.achievements ? { ...mockDb.achievements } : null, error: null };
    }
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
    insert: (v) => { insert = v; return api; },
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

const mockState = { plan: 'pro', sub: null, everPaid: false };
jest.mock('../subscriptionService', () => ({
  getUserSubscriptionDetails: async () => ({ plan: mockState.plan, stripeCustomerId: 'cus_test' }),
  hasEverHadPaidPlan: async () => mockState.everPaid,
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
  mockDb.achievements = null;
  mockState.plan = 'pro';
  mockState.sub = null;
  mockState.everPaid = false;
});

test('the trial has 5 credits and leftovers roll into the first paid month', async () => {
  mockState.sub = sub('trialing', 0, 7);
  let c = await credits.getCreditState('u1');
  expect([c.total, c.remaining, c.isTrial]).toEqual([5, 5, true]);

  spend(2, 1, 'pack');
  mockState.sub = sub('active', 7, 37);
  c = await credits.getCreditState('u1');
  expect([c.rollover, c.allowance, c.total]).toEqual([3, 99, 102]);
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

const HOUR_MS = 60 * 60 * 1000;

const monthStart = (offsetMonths = 0) => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offsetMonths, 1));
};
const inThisMonth = (ms) => new Date(monthStart().getTime() + ms).toISOString();

test('a free account gets 3 essay grades a month', async () => {
  mockState.plan = 'free';
  let c = await credits.getCreditState('u1');
  expect([c.total, c.used, c.remaining, c.freeExpired, c.freeExpiresAt]).toEqual([3, 0, 3, false, null]);
  expect(c.periodStart).toBe(monthStart().toISOString());
  expect(c.periodEnd).toBe(monthStart(1).toISOString());
  expect(c.freeResetsAt).toBe(monthStart(1).toISOString());

  mockDb.actions.push({ kind: 'analysis', at: inThisMonth(1000) });
  mockDb.actions.push({ kind: 'analysis', at: inThisMonth(2000) });
  // Study packs and citations are Pro, so they never touch the free count.
  mockDb.actions.push({ kind: 'pack', at: inThisMonth(3000) });
  mockDb.actions.push({ kind: 'cite', at: inThisMonth(4000) });
  c = await credits.getCreditState('u1');
  expect([c.used, c.remaining]).toEqual([2, 1]);
  // No stamp is needed any more.
  expect(mockDb.achievements).toBeNull();
});

test("last month's grades do not count against this month", async () => {
  mockState.plan = 'free';
  mockDb.actions.push({ kind: 'analysis', at: new Date(monthStart().getTime() - 1000).toISOString() });
  const c = await credits.getCreditState('u1');
  expect([c.used, c.remaining]).toEqual([0, 3]);
});

test('the monthly limit is hard', async () => {
  mockState.plan = 'free';
  for (let i = 0; i < 4; i++) mockDb.actions.push({ kind: 'analysis', at: inThisMonth(1000 * (i + 1)) });
  const c = await credits.getCreditState('u1');
  expect([c.used, c.remaining, c.total]).toEqual([3, 0, 3]);
});

test('lapsed subscribers get the same free grades as everyone else', async () => {
  mockState.plan = 'free';
  mockState.everPaid = true;
  const c = await credits.getCreditState('u1');
  expect([c.total, c.remaining]).toEqual([3, 3]);
});
