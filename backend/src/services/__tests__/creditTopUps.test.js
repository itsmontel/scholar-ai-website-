/**
 * The 2026-11 credit rules: an essay analysis costs 2 credits (1 before
 * the price change), and bought top-ups sit on top of the plan's credits,
 * are spent after them, expire, and are granted once per Stripe session.
 * Supabase and the subscription lookup are in-memory fakes.
 */
process.env.FREE_CREDITS = '4';
process.env.FINALS_FREE_UNTIL = '';
process.env.ANALYSIS_COST_2_FROM = '2026-10-10T00:00:00Z';

const mockDb = { user: {}, actions: [], topups: [], draws: [] };

function mockQuery(table) {
  const filters = [];
  let update = null;
  let insert = null;
  let upsert = null;
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
    if (table === 'credit_topups') {
      if (insert) {
        if (mockDb.topups.some((t) => t.stripe_session_id === insert.stripe_session_id)) return { error: { message: 'duplicate key value violates unique constraint' } };
        mockDb.topups.push({ id: `t${mockDb.topups.length}`, created_at: new Date().toISOString(), ...insert });
        return { error: null };
      }
      const bySession = filters.find(([, k]) => k === 'stripe_session_id');
      if (bySession) return { data: mockDb.topups.find((t) => t.stripe_session_id === bySession[2]) || null, error: null };
      return { data: [...mockDb.topups].sort((a, b) => a.expires_at.localeCompare(b.expires_at)), error: null };
    }
    if (table === 'credit_topup_draws') {
      if (upsert) {
        const row = mockDb.draws.find((d) => d.period_start === upsert.period_start);
        if (row) row.drawn = upsert.drawn; else mockDb.draws.push({ period_start: upsert.period_start, drawn: upsert.drawn });
        return { error: null };
      }
      return { data: [...mockDb.draws].sort((a, b) => a.period_start.localeCompare(b.period_start)), error: null };
    }
    const kind = table === 'quiz_usage' ? 'pack' : table === 'citation_searches' ? 'cite' : 'analysis';
    let rows = mockDb.actions.filter((a) => a.kind === kind);
    for (const [op, key, value] of filters) {
      if (op === 'not' && key === 'analysis_type') rows = rows.filter((a) => a.type !== 'citation_review');
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
    upsert: (v) => { upsert = v; return api; },
    eq: (k, v) => { filters.push(['eq', k, v]); return api; },
    is: (k, v) => { filters.push(['is', k, v]); return api; },
    gte: (k, v) => { filters.push(['gte', k, v]); return api; },
    lt: (k, v) => { filters.push(['lt', k, v]); return api; },
    not: (k, op, v) => { filters.push(['not', k, v]); return api; },
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
const base = Math.floor(Date.UTC(2026, 9, 1) / 1000); // 1 October 2026
const at = (d) => new Date((base + d * DAY) * 1000).toISOString();
const sub = (start, end) => ({ status: 'active', current_period_start: base + start * DAY, current_period_end: base + end * DAY });
const spend = (n, day, kind = 'analysis', type = 'essay') => { for (let i = 0; i < n; i++) mockDb.actions.push({ kind, type, at: at(day) }); };
const yearFromNow = () => new Date(Date.now() + 365 * DAY * 1000).toISOString();
const topUp = (credits_, expires = yearFromNow(), baseline = 0) => mockDb.topups.push({ id: `t${mockDb.topups.length}`, credits: credits_, baseline_overflow: baseline, created_at: at(0), expires_at: expires, stripe_session_id: `s${mockDb.topups.length}` });

beforeEach(() => {
  mockDb.user = { credits_rollover: 0, credits_period_start: null, credits_period_allowance: null };
  mockDb.actions = [];
  mockDb.topups = [];
  mockDb.draws = [];
  mockState.plan = 'pro';
  mockState.sub = sub(0, 30);
});

test('an essay analysis costs 2 credits, a study pack and a citation search 1', async () => {
  spend(3, 12); // after the price change (10 October)
  spend(2, 12, 'pack');
  spend(1, 12, 'cite');
  const c = await credits.getCreditState('u1');
  expect(c.used).toBe(3 * 2 + 2 + 1);
  expect(c.remaining).toBe(99 - 9);
});

test('analyses made before the price change still count as 1', async () => {
  spend(4, 5); // 6 October, before the change
  spend(1, 12);
  const c = await credits.getCreditState('u1');
  expect(c.used).toBe(4 + 2);
});

test('a citation review is not charged as an essay analysis', async () => {
  spend(1, 12, 'analysis', 'citation_review');
  const c = await credits.getCreditState('u1');
  expect(c.used).toBe(1);
});

test('a top-up adds to the balance and is only drawn once the plan credits are gone', async () => {
  topUp(25);
  spend(10, 12); // 20 credits
  let c = await credits.getCreditState('u1');
  expect(c.remaining).toBe(79 + 25);
  expect(c.topUp).toBe(25);

  spend(40, 13); // 80 more: 100 spent against a plan of 99
  c = await credits.getCreditState('u1');
  expect(c.topUp).toBe(24);
  expect(c.remaining).toBe(24);
});

test('what one period drew from a top-up stays drawn in the next period', async () => {
  topUp(25);
  spend(52, 12); // 104 credits: 5 over the plan
  await credits.getCreditState('u1');
  mockState.sub = sub(30, 60); // next month, nothing spent yet
  const c = await credits.getCreditState('u1');
  expect(c.topUp).toBe(20);
  expect(c.remaining).toBe(99 + 20);
});

test('an expired top-up is worth nothing', async () => {
  topUp(25, at(-1));
  const c = await credits.getCreditState('u1');
  expect(c.topUp).toBe(0);
  expect(c.remaining).toBe(99);
});

test('top-ups sit outside the 499 rollover cap', async () => {
  mockDb.user = { credits_rollover: 400, credits_period_start: at(0), credits_period_allowance: 99 };
  topUp(60);
  const c = await credits.getCreditState('u1');
  expect(c.total).toBe(499);
  expect(c.remaining).toBe(499 + 60);
});

test('a free account has 4 credits: two essay grades use them all, then a top-up carries on', async () => {
  mockState.plan = 'free';
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 1)).toISOString();
  mockDb.actions.push({ kind: 'analysis', type: 'essay', at: today }, { kind: 'analysis', type: 'essay', at: today });
  let c = await credits.getCreditState('u1');
  expect(c.total).toBe(4);
  expect(c.remaining).toBe(0);

  topUp(25);
  c = await credits.getCreditState('u1');
  expect(c.remaining).toBe(25);
  mockDb.actions.push({ kind: 'pack', at: today });
  c = await credits.getCreditState('u1');
  expect(c.remaining).toBe(24);
});

test('a Stripe session grants its credits once, however often it is confirmed', async () => {
  const first = await credits.grantTopUp('u1', 'small', 'cs_live_abc');
  const second = await credits.grantTopUp('u1', 'small', 'cs_live_abc');
  expect(first.granted).toBe(true);
  expect(second.granted).toBe(false);
  expect(mockDb.topups).toHaveLength(1);
  expect(mockDb.topups[0].credits).toBe(25);
  expect((await credits.getCreditState('u1')).topUp).toBe(25);
});

test('an unknown pack grants nothing', async () => {
  const r = await credits.grantTopUp('u1', 'huge', 'cs_live_x');
  expect(r.granted).toBe(false);
  expect(mockDb.topups).toHaveLength(0);
});

test('a top-up does not pay for what the account was already over by', async () => {
  // Over the plan by 3 before buying (for example after an allowance dropped).
  spend(51, 12); // 102 credits against 99
  await credits.grantTopUp('u1', 'small', 'cs_live_over');
  const c = await credits.getCreditState('u1');
  expect(c.topUp).toBe(25);
});
