/**
 * First result before sign-up: token store and limits.
 */
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test';

const store = require('../previewStore');

beforeEach(() => store._resetForTests());

test('a stored result is found by its token and kind only', () => {
  const token = store.putPreview('pack', { pack: { title: 'Stats' } });
  expect(store.getPreview(token, 'pack')).toEqual({ pack: { title: 'Stats' } });
  expect(store.getPreview(token, 'grade')).toBeNull();
  expect(store.getPreview('not-a-real-token-at-all', 'pack')).toBeNull();
  expect(store.getPreview(undefined, 'pack')).toBeNull();
});

test('a claimed result is gone', () => {
  const token = store.putPreview('grade', { content: 'essay' });
  store.dropPreview(token);
  expect(store.getPreview(token, 'grade')).toBeNull();
});

test('one generation at a time per IP', () => {
  expect(store.checkPreview('1.1.1.1')).toEqual({ allowed: true });
  store.startPreview('1.1.1.1');
  expect(store.checkPreview('1.1.1.1')).toEqual({ allowed: false, reason: 'busy' });
  expect(store.checkPreview('2.2.2.2')).toEqual({ allowed: true });
  store.finishPreview('1.1.1.1');
  expect(store.checkPreview('1.1.1.1')).toEqual({ allowed: true });
});

test('an IP is capped per day', () => {
  for (let i = 0; i < store.PREVIEWS_PER_IP_PER_DAY; i += 1) {
    expect(store.checkPreview('3.3.3.3').allowed).toBe(true);
    store.startPreview('3.3.3.3');
    store.finishPreview('3.3.3.3');
  }
  expect(store.checkPreview('3.3.3.3')).toEqual({ allowed: false, reason: 'ip_limit' });
  expect(store.checkPreview('4.4.4.4').allowed).toBe(true);
});

test('the limit response tells the page to offer sign-up', () => {
  const body = store.previewLimitResponse('ip_limit');
  expect(body.code).toBe('PREVIEW_LIMIT');
  expect(body.signUp).toBe(true);
});
