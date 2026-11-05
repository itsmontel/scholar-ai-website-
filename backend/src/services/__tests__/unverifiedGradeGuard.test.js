/**
 * Unverified email accounts: one free grade before verifying, and at
 * most two unverified first grades per IP per day.
 */

const mockGrades = { count: 0, fail: false };

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => {
      const api = {
        select: () => api,
        eq: () => api,
        then: (resolve) =>
          resolve(mockGrades.fail ? { count: null, error: { message: 'db down' } } : { count: mockGrades.count, error: null }),
      };
      return api;
    },
  }),
}));

const guard = require('../unverifiedGradeGuard');

const unverified = (id = 'u1') => ({ id, email: `${id}@example.com`, email_verified: false });

beforeEach(() => {
  mockGrades.count = 0;
  mockGrades.fail = false;
  guard._resetForTests();
});

describe('unverified grade guard', () => {
  test('verified accounts always pass', async () => {
    mockGrades.count = 5;
    await expect(guard.checkUnverifiedGrade({ id: 'v', email_verified: true }, '1.1.1.1')).resolves.toEqual({ allowed: true });
  });

  test('an unverified account gets its first grade', async () => {
    const r = await guard.checkUnverifiedGrade(unverified(), '1.1.1.1');
    expect(r).toEqual({ allowed: true, unverified: true });
  });

  test('the second grade needs a verified email', async () => {
    mockGrades.count = 1;
    const r = await guard.checkUnverifiedGrade(unverified(), '1.1.1.1');
    expect(r).toEqual({ allowed: false, reason: 'verify' });
  });

  test('two unverified first grades per IP per day, then the third is refused', async () => {
    for (let i = 0; i < 2; i += 1) {
      const r = await guard.checkUnverifiedGrade(unverified(`a${i}`), '2.2.2.2');
      expect(r.allowed).toBe(true);
      guard.recordUnverifiedGrade('2.2.2.2');
    }
    const third = await guard.checkUnverifiedGrade(unverified('a3'), '2.2.2.2');
    expect(third).toEqual({ allowed: false, reason: 'ip_limit' });
    // A different connection is unaffected.
    await expect(guard.checkUnverifiedGrade(unverified('b1'), '3.3.3.3')).resolves.toMatchObject({ allowed: true });
  });

  test('a failed count fails closed for unverified accounts', async () => {
    mockGrades.fail = true;
    const r = await guard.checkUnverifiedGrade(unverified(), '1.1.1.1');
    expect(r).toEqual({ allowed: false, reason: 'verify' });
  });

  test('the 403 body carries the code clients look for', () => {
    const body = guard.verifyEmailResponse(unverified('x'), 'verify');
    expect(body).toMatchObject({ success: false, code: 'VERIFY_EMAIL', verifyEmail: true, email: 'x@example.com' });
    expect(body.message).toMatch(/x@example\.com/);
  });
});
