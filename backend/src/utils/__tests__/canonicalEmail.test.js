const { canonicalEmail } = require('../canonicalEmail');

test.each([
  ['Sam@Gmail.com', 'sam@gmail.com'],
  ['s.a.m+trial2@googlemail.com', 'sam@gmail.com'],
  [' jo.ann+x@University.edu ', 'jo.ann@university.edu'],
  ['plain@outlook.com', 'plain@outlook.com'],
  ['', ''],
])('%s → %s', (input, expected) => {
  expect(canonicalEmail(input)).toBe(expected);
});
