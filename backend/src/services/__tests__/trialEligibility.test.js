/**
 * One free trial per inbox: deleting the account and signing up again
 * with the same email, or a Gmail alias of it, must not get a new trial.
 * trial_usage is an in-memory table here.
 */

const mockTable = { rows: [], hasCanonical: true };

function mockTrialUsage() {
  const filters = [];
  let write = null;
  const missing = () => ({ data: null, error: { code: '42703', message: 'column trial_usage.email_canonical does not exist' } });
  const usesCanonical = (obj) => obj && Object.prototype.hasOwnProperty.call(obj, 'email_canonical');
  const like = (pattern) => new RegExp(`^${pattern.replace(/\\([\\%_])|[.*+?^${}()|[\]]|%|_/g, (m, esc) =>
    esc ? `\\${esc}` : m === '%' ? '.*' : m === '_' ? '.' : `\\${m}`)}$`, 'i');
  const run = () => {
    if (write) {
      if (!mockTable.hasCanonical && usesCanonical(write.fields)) return missing();
      if (write.kind === 'insert') {
        mockTable.rows.push({ id: `t${mockTable.rows.length + 1}`, ...write.fields });
      } else {
        const id = filters.find(([k]) => k === 'id')[1];
        Object.assign(mockTable.rows.find((r) => r.id === id), write.fields);
      }
      return { data: null, error: null };
    }
    let rows = mockTable.rows;
    for (const [key, value, op] of filters) {
      if (key === 'email_canonical' && !mockTable.hasCanonical) return missing();
      rows = rows.filter((r) => (op === 'ilike' ? like(value).test(r[key] || '') : r[key] === value));
    }
    return { data: rows[0] || null, error: null };
  };
  const api = {
    select: () => api,
    insert: (fields) => { write = { kind: 'insert', fields }; return api; },
    update: (fields) => { write = { kind: 'update', fields }; return api; },
    ilike: (k, v) => { filters.push([k, v, 'ilike']); return api; },
    eq: (k, v) => { filters.push([k, v, 'eq']); return api; },
    limit: () => api,
    maybeSingle: () => Promise.resolve(run()),
    then: (resolve, reject) => Promise.resolve(run()).then(resolve, reject),
  };
  return api;
}

jest.mock('@supabase/supabase-js', () => ({ createClient: () => ({ from: () => mockTrialUsage() }) }));
jest.mock('stripe', () => () => ({}));
jest.mock('../../database/connection', () => ({ query: jest.fn() }));

const { checkTrialEligibility, recordTrialUsage, recordTrialDecline } = require('../subscriptionService');

beforeEach(() => {
  mockTable.rows = [];
  mockTable.hasCanonical = true;
});

test('a new email gets the trial', async () => {
  expect((await checkTrialEligibility('sam@gmail.com')).eligible).toBe(true);
});

test('the same email after deleting the account does not', async () => {
  await recordTrialUsage('Sam@Gmail.com', 'cus_1', 'pro');
  // Account deleted: trial_usage is untouched, so a fresh signup still matches.
  expect((await checkTrialEligibility('sam@gmail.com')).eligible).toBe(false);
  expect((await checkTrialEligibility('  SAM@GMAIL.COM ')).eligible).toBe(false);
});

test('Gmail dots and +tags of the same inbox do not', async () => {
  await recordTrialUsage('sam@gmail.com', 'cus_1', 'pro');
  for (const alias of ['s.a.m@gmail.com', 'sam+2@gmail.com', 'S.am+trial@googlemail.com']) {
    expect((await checkTrialEligibility(alias)).eligible).toBe(false);
  }
});

test('+tags on other providers match, dots there do not', async () => {
  await recordTrialUsage('jo.ann@university.edu', 'cus_1', 'pro');
  expect((await checkTrialEligibility('jo.ann+again@university.edu')).eligible).toBe(false);
  expect((await checkTrialEligibility('joann@university.edu')).eligible).toBe(true);
});

test('someone else is still eligible', async () => {
  await recordTrialUsage('sam@gmail.com', 'cus_1', 'pro');
  expect((await checkTrialEligibility('alex@gmail.com')).eligible).toBe(true);
});

test('an underscore is not a wildcard', async () => {
  await recordTrialUsage('j_doe@school.edu', 'cus_1', 'pro');
  expect((await checkTrialEligibility('jxdoe@school.edu')).eligible).toBe(true);
  expect((await checkTrialEligibility('j_doe@school.edu')).eligible).toBe(false);
});

test('declining the trial uses it up', async () => {
  await recordTrialDecline('sam@gmail.com');
  expect((await checkTrialEligibility('sam+1@gmail.com')).eligible).toBe(false);
});

test('recording twice keeps one row', async () => {
  await recordTrialUsage('sam@gmail.com', 'cus_1', 'pro');
  await recordTrialUsage('s.am@gmail.com', 'cus_1', 'pro');
  expect(mockTable.rows).toHaveLength(1);
  expect(mockTable.rows[0].email_canonical).toBe('sam@gmail.com');
});

test('before the migration, exact email matching still works', async () => {
  mockTable.hasCanonical = false;
  await recordTrialUsage('sam@gmail.com', 'cus_1', 'pro');
  expect(mockTable.rows).toHaveLength(1);
  expect(mockTable.rows[0].email_canonical).toBeUndefined();
  expect((await checkTrialEligibility('sam@gmail.com')).eligible).toBe(false);
  expect((await checkTrialEligibility('alex@gmail.com')).eligible).toBe(true);
});
