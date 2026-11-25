// Tests for the citation formatter. Every expected string below is written by
// hand from the style guides' own rules and examples, not copied from output.
// Run: node --test scripts/test-citations.mts
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CITE_STYLES, authorProblem, buildContext, compareSources, emptySource, formatAccessed, formatReference,
  inTextCitation, isCiteStyle, isNumbered, normaliseLink, referenceLabel, sameSource, sourceProblem, type CiteStyle, type Source,
} from '../src/utils/citations.ts';

const src = (p: Partial<Source> & { id?: string }): Source => ({ ...emptySource(p.kind ?? 'book'), id: p.id ?? 'x', ...p });
/** A reference as text, with italics between asterisks. */
const ref = (s: Source, style: CiteStyle, sources: Source[] = [s], cited: string[] = sources.map((x) => x.id)) => {
  const ctx = buildContext(sources, style, cited);
  return formatReference(s, style, ctx).map((x) => (x.italic ? `*${x.text}*` : x.text)).join('');
};
const cite = (s: Source, style: CiteStyle, page = '', sources: Source[] = [s], cited: string[] = sources.map((x) => x.id)) =>
  inTextCitation(s, style, page, buildContext(sources, style, cited));

const lull = src({ id: 'lull', authors: 'James Lull', year: '1995', title: 'Media, communication, culture: A global approach', publisher: 'Columbia University Press', place: 'New York' });

/* ── The styles on offer ────────────────────────────────────────── */
test('six styles, IEEE and Vancouver are numbered', () => {
  assert.deepEqual(CITE_STYLES, ['APA', 'MLA', 'Chicago', 'Harvard', 'IEEE', 'Vancouver']);
  assert.ok(CITE_STYLES.every(isCiteStyle));
  assert.ok(!isCiteStyle('OSCOLA') && !isCiteStyle(null));
  assert.deepEqual(CITE_STYLES.filter(isNumbered), ['IEEE', 'Vancouver']);
});

/* ── Books ──────────────────────────────────────────────────────── */
test('book, every style', () => {
  assert.equal(ref(lull, 'APA'), 'Lull, J. (1995). *Media, communication, culture: A global approach*. Columbia University Press.');
  assert.equal(ref(lull, 'MLA'), 'Lull, James. *Media, communication, culture: A global approach*. Columbia UP, 1995.');
  assert.equal(ref(lull, 'Chicago'), 'Lull, James. 1995. *Media, communication, culture: A global approach*. New York: Columbia University Press.');
  assert.equal(ref(lull, 'Harvard'), 'Lull, J. (1995) *Media, communication, culture: A global approach*. New York: Columbia University Press.');
  assert.equal(ref(lull, 'IEEE'), 'J. Lull, *Media, communication, culture: A global approach*. New York: Columbia University Press, 1995.');
  assert.equal(ref(lull, 'Vancouver'), 'Lull J. Media, communication, culture: A global approach. New York: Columbia University Press; 1995.');
});

test('the Chicago Manual of Style book example', () => {
  const b = src({ authors: 'Brian Grazer\nCharles Fishman', year: '2015', title: 'A curious mind: The secret to a bigger life', publisher: 'Simon & Schuster', place: 'New York' });
  assert.equal(ref(b, 'Chicago'), 'Grazer, Brian, and Charles Fishman. 2015. *A curious mind: The secret to a bigger life*. New York: Simon & Schuster.');
  assert.equal(ref(b, 'APA'), 'Grazer, B., & Fishman, C. (2015). *A curious mind: The secret to a bigger life*. Simon & Schuster.');
  assert.equal(ref(b, 'MLA'), 'Grazer, Brian, and Charles Fishman. *A curious mind: The secret to a bigger life*. Simon & Schuster, 2015.');
  assert.equal(ref(b, 'Harvard'), 'Grazer, B. and Fishman, C. (2015) *A curious mind: The secret to a bigger life*. New York: Simon & Schuster.');
  assert.equal(ref(b, 'IEEE'), 'B. Grazer and C. Fishman, *A curious mind: The secret to a bigger life*. New York: Simon & Schuster, 2015.');
  assert.equal(ref(b, 'Vancouver'), 'Grazer B, Fishman C. A curious mind: The secret to a bigger life. New York: Simon & Schuster; 2015.');
});

test('a book with no publisher, no place and no year never leaves stray punctuation', () => {
  const b = src({ authors: 'Anna Smith', title: 'Untitled notes' });
  assert.equal(ref(b, 'APA'), 'Smith, A. (n.d.). *Untitled notes*.');
  assert.equal(ref(b, 'MLA'), 'Smith, Anna. *Untitled notes*.');
  assert.equal(ref(b, 'Chicago'), 'Smith, Anna. n.d. *Untitled notes*.');
  assert.equal(ref(b, 'Harvard'), 'Smith, A. (no date) *Untitled notes*.');
  assert.equal(ref(b, 'IEEE'), 'A. Smith, *Untitled notes*.');
  assert.equal(ref(b, 'Vancouver'), 'Smith A. Untitled notes. [date unknown].');
});

/* ── Journal articles ───────────────────────────────────────────── */
test('the APA journal example', () => {
  const j = src({ kind: 'journal', authors: 'Jessica S. Grady\nMolly Her\nGiselle Moreno\nCelina Perez\nJennifer Yelinek', year: '2019', title: 'Emotions in storybooks: A comparison of storybooks that represent ethnic and racial groups in the United States', container: 'Psychology of Popular Media Culture', volume: '8', issue: '3', pages: '207-217', url: 'https://doi.org/10.1037/ppm0000185' });
  assert.equal(ref(j, 'APA'), 'Grady, J. S., Her, M., Moreno, G., Perez, C., & Yelinek, J. (2019). Emotions in storybooks: A comparison of storybooks that represent ethnic and racial groups in the United States. *Psychology of Popular Media Culture, 8*(3), 207–217. https://doi.org/10.1037/ppm0000185');
  assert.equal(cite(j, 'APA', '210'), '(Grady et al., 2019, p. 210)');
});

test('journal article, every style', () => {
  const j = src({ kind: 'journal', authors: 'Joshua I. Weinstein', year: '2009', title: "The market in Plato's Republic", container: 'Classical Philology', volume: '104', issue: '4', pages: '439-458', url: '10.1086/650405' });
  assert.equal(ref(j, 'APA'), "Weinstein, J. I. (2009). The market in Plato's Republic. *Classical Philology, 104*(4), 439–458. https://doi.org/10.1086/650405");
  assert.equal(ref(j, 'MLA'), 'Weinstein, Joshua I. "The market in Plato\'s Republic." *Classical Philology*, vol. 104, no. 4, 2009, pp. 439–458, https://doi.org/10.1086/650405.');
  // Chicago shortens the second number of a page range (CMOS 9.61).
  assert.equal(ref(j, 'Chicago'), 'Weinstein, Joshua I. 2009. "The market in Plato\'s Republic." *Classical Philology* 104 (4): 439–58. https://doi.org/10.1086/650405.');
  assert.equal(ref(j, 'Harvard'), "Weinstein, J.I. (2009) 'The market in Plato's Republic', *Classical Philology*, 104(4), pp. 439–458. Available at: https://doi.org/10.1086/650405.");
  assert.equal(ref(j, 'IEEE'), 'J. I. Weinstein, "The market in Plato\'s Republic," *Classical Philology*, vol. 104, no. 4, pp. 439–458, 2009, doi: 10.1086/650405.');
  assert.equal(ref(j, 'Vancouver'), "Weinstein JI. The market in Plato's Republic. Classical Philology. 2009;104(4):439-458. doi: 10.1086/650405.");
});

test('journal article with no author puts the title first', () => {
  const j = src({ kind: 'journal', year: '2020', title: 'Study finds benefits of walking', container: 'Medical News Today', volume: '12', pages: '3' });
  assert.equal(ref(j, 'APA'), 'Study finds benefits of walking. (2020). *Medical News Today, 12*, 3.');
  assert.equal(ref(j, 'Harvard'), "'Study finds benefits of walking' (2020) *Medical News Today*, 12, p. 3.");
  assert.equal(ref(j, 'Chicago'), '"Study finds benefits of walking." 2020. *Medical News Today* 12: 3.');
  assert.equal(ref(j, 'MLA'), '"Study finds benefits of walking." *Medical News Today*, vol. 12, 2020, p. 3.');
  assert.equal(cite(j, 'APA'), '("Study Finds Benefits," 2020)', 'APA cites a title in the text in title case');
  assert.equal(cite(j, 'MLA', '3'), '("Study finds benefits" 3)');
  assert.equal(cite(j, 'Harvard'), "('Study finds benefits', 2020)");
});

/* ── Web pages ──────────────────────────────────────────────────── */
test('web page by an organisation that is also the site', () => {
  const w = src({ kind: 'website', authors: 'World Health Organization', org: true, year: '2021', title: 'Obesity and overweight', container: 'World Health Organization', url: 'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight', accessed: '12 March 2026' });
  const u = 'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight';
  // APA drops the site name when it is the author. MLA drops the author when it is the site.
  assert.equal(ref(w, 'APA'), `World Health Organization. (2021). *Obesity and overweight*. ${u}`);
  assert.equal(ref(w, 'MLA'), `"Obesity and overweight." *World Health Organization*, 2021, ${u}. Accessed 12 Mar. 2026.`);
  assert.equal(ref(w, 'Harvard'), `World Health Organization (2021) *Obesity and overweight*. Available at: ${u} (Accessed: 12 March 2026).`);
  assert.equal(ref(w, 'Vancouver'), `World Health Organization. Obesity and overweight [Internet]. World Health Organization; 2021 [cited 2026 Mar 12]. Available from: ${u}`);
  assert.equal(cite(w, 'APA'), '(World Health Organization, 2021)');
  // MLA starts the entry with the title, so the text cites by title. Chicago does not repeat the site.
  assert.equal(cite(w, 'MLA'), '("Obesity and overweight")');
  assert.equal(ref(w, 'Chicago'), `World Health Organization. 2021. "Obesity and overweight." ${u}.`);
});

test('web page with no date: n.d., and Chicago adds the day it was read', () => {
  const w = src({ kind: 'website', authors: 'Jane Doe', title: 'How to revise for exams', container: 'BBC Bitesize', url: 'www.bbc.co.uk/bitesize/revise', accessed: 'March 5, 2026' });
  const u = 'https://www.bbc.co.uk/bitesize/revise';
  assert.equal(ref(w, 'APA'), `Doe, J. (n.d.). *How to revise for exams*. BBC Bitesize. ${u}`);
  assert.equal(ref(w, 'Chicago'), `Doe, Jane. n.d. "How to revise for exams." BBC Bitesize. Accessed March 5, 2026. ${u}.`);
  assert.equal(ref(w, 'MLA'), `Doe, Jane. "How to revise for exams." *BBC Bitesize*, ${u}. Accessed 5 Mar. 2026.`);
  assert.equal(ref(w, 'IEEE'), `J. Doe. "How to revise for exams." BBC Bitesize. Accessed: Mar. 5, 2026. [Online]. Available: ${u}`);
  assert.equal(ref(w, 'Vancouver'), `Doe J. How to revise for exams [Internet]. BBC Bitesize [cited 2026 Mar 5]. Available from: ${u}`);
});

/* ── Titles that end in ? or ! ──────────────────────────────────── */
test('a title ending in ? or ! never gets a full stop after it', () => {
  const b = src({ authors: 'Matthew Walker', year: '2017', title: 'Why do we sleep?', publisher: 'Penguin' });
  assert.equal(ref(b, 'APA'), 'Walker, M. (2017). *Why do we sleep?* Penguin.');
  assert.equal(ref(b, 'MLA'), 'Walker, Matthew. *Why do we sleep?* Penguin, 2017.');
  assert.equal(ref(b, 'Chicago'), 'Walker, Matthew. 2017. *Why do we sleep?* Penguin.');
  assert.equal(ref(b, 'Harvard'), 'Walker, M. (2017) *Why do we sleep?* Penguin.');
  assert.equal(ref(b, 'IEEE'), 'M. Walker, *Why do we sleep?* Penguin, 2017.');
  assert.equal(ref(b, 'Vancouver'), 'Walker M. Why do we sleep? Penguin; 2017.');
  const j = src({ kind: 'journal', authors: 'Ann Lee', year: '2018', title: 'Is it enough?', container: 'Sleep', volume: '4', pages: '1-9' });
  assert.equal(ref(j, 'APA'), 'Lee, A. (2018). Is it enough? *Sleep, 4*, 1–9.');
  assert.equal(ref(j, 'MLA'), 'Lee, Ann. "Is it enough?" *Sleep*, vol. 4, 2018, pp. 1–9.');
  assert.equal(ref(j, 'IEEE'), 'A. Lee, "Is it enough?" *Sleep*, vol. 4, pp. 1–9, 2018.');
  assert.ok(!CITE_STYLES.some((st) => /[?!]\./.test(ref(j, st)) || /[?!]\./.test(ref(b, st))));
});

/* ── Names ──────────────────────────────────────────────────────── */
test('names: particles, initials, suffixes, titles, degrees', () => {
  const apa = (authors: string, org = false) => ref(src({ authors, org, year: '2000', title: 'T', publisher: 'P' }), 'APA').split(' (2000)')[0];
  assert.equal(apa('W. E. B. Du Bois'), 'Du Bois, W. E. B.');
  assert.equal(apa('W.E.B. Du Bois'), 'Du Bois, W. E. B.');
  assert.equal(apa('Du Bois, W.E.B.'), 'Du Bois, W. E. B.');
  assert.equal(apa('Jean-Paul Sartre'), 'Sartre, J.-P.');
  assert.equal(apa('Vincent van Gogh'), 'van Gogh, V.');
  assert.equal(apa('Mary de la Cruz'), 'de la Cruz, M.');
  assert.equal(apa('Ursula K. Le Guin'), 'Le Guin, U. K.');
  assert.equal(apa('Martin Luther King Jr.'), 'King, M. L., Jr.');
  assert.equal(apa('King, Martin Luther, Jr.'), 'King, M. L., Jr.');
  assert.equal(apa('Dr Jane Smith, PhD'), 'Smith, J.');
  assert.equal(apa('Prof. Jane Smith'), 'Smith, J.');
  assert.equal(apa('John Smith, MD'), 'Smith, J.');
  assert.equal(apa('Smith, M. D.'), 'Smith, M. D.', 'M. D. here is initials, not a degree');
  assert.equal(apa('Madonna'), 'Madonna.', 'a single name has no initials');
  assert.equal(apa('Ólafur Arnalds'), 'Arnalds, Ó.');
  assert.equal(apa('Mary-Jane Watson'), 'Watson, M.-J.');
  assert.equal(apa('JK Rowling'), 'Rowling, J. K.');
  assert.equal(apa('J.K. Rowling'), 'Rowling, J. K.');
  assert.equal(apa('Charles de Gaulle'), 'de Gaulle, C.');
  assert.equal(apa('Jean Le Rond d\'Alembert'), 'd\'Alembert, J. L. R.');
  assert.equal(apa('Anna'.toUpperCase() + ' Smith'), 'Smith, A.', 'an all-capitals first name is one initial');
  assert.equal(apa('Procter & Gamble', true), 'Procter & Gamble.');
  assert.equal(apa('Jane Smith and Kim Jones'), 'Smith, J., & Jones, K.');
  assert.equal(apa('Smith, J., & Jones, K.'), 'Smith, J., & Jones, K.');
  assert.equal(apa('Smith, J.; Jones, K.'), 'Smith, J., & Jones, K.');
});

test('names in the other styles', () => {
  const one = (authors: string, style: CiteStyle) => ref(src({ authors, year: '2000', title: 'T', publisher: 'P' }), style);
  assert.ok(one('W. E. B. Du Bois', 'Harvard').startsWith('Du Bois, W.E.B. (2000)'));
  assert.ok(one('Jean-Paul Sartre', 'Harvard').startsWith('Sartre, J.-P. (2000)'));
  assert.ok(one('W. E. B. Du Bois', 'IEEE').startsWith('W. E. B. Du Bois, '));
  assert.ok(one('Jean-Paul Sartre', 'IEEE').startsWith('J.-P. Sartre, '));
  assert.ok(one('Martin Luther King Jr.', 'IEEE').startsWith('M. L. King Jr., '));
  assert.ok(one('W. E. B. Du Bois', 'Vancouver').startsWith('Du Bois WEB. '));
  assert.ok(one('Jean-Paul Sartre', 'Vancouver').startsWith('Sartre JP. '));
  assert.ok(one('Martin Luther King Jr.', 'Vancouver').startsWith('King ML Jr. '));
  assert.ok(one('Martin Luther King Jr.', 'MLA').startsWith('King, Martin Luther, Jr. '));
  assert.ok(one('Martin Luther King Jr.', 'Chicago').startsWith('King, Martin Luther, Jr. 2000.'));
});

test('the author box warns about input that cannot be read', () => {
  const a = (authors: string, org = false) => authorProblem(src({ authors, org }));
  assert.equal(a('James Lull'), null);
  assert.equal(a('Lull, James'), null);
  assert.equal(a('King, Martin Luther, Jr.'), null);
  assert.equal(a('Jane Smith, PhD'), null);
  assert.match(a('Smith, J., Jones, K., Lee, M.') ?? '', /own line/);
  assert.match(a('Lull et al.') ?? '', /et al/);
  assert.equal(a('Procter & Gamble, Inc., USA', true), null, 'an organisation is never checked');
});

/* ── Author counts: in-text and list ────────────────────────────── */
const many = (n: number) => Array.from({ length: n }, (_, i) => `Person${String.fromCharCode(65 + i)}, ${String.fromCharCode(65 + i)}.`).join('\n');
test('in-text author counts', () => {
  const s = (n: number) => src({ authors: many(n), year: '2020', title: 'T', publisher: 'P' });
  assert.equal(cite(s(1), 'APA'), '(PersonA, 2020)');
  assert.equal(cite(s(2), 'APA'), '(PersonA & PersonB, 2020)');
  assert.equal(cite(s(3), 'APA'), '(PersonA et al., 2020)');
  assert.equal(cite(s(2), 'MLA', '5'), '(PersonA and PersonB 5)');
  assert.equal(cite(s(3), 'MLA', '5'), '(PersonA et al. 5)');
  assert.equal(cite(s(3), 'Harvard'), '(PersonA, PersonB and PersonC, 2020)');
  assert.equal(cite(s(4), 'Harvard'), '(PersonA et al., 2020)');
  // Chicago 18: three or more authors are cited by the first and et al.
  assert.equal(cite(s(2), 'Chicago'), '(PersonA and PersonB 2020)');
  assert.equal(cite(s(3), 'Chicago'), '(PersonA et al. 2020)');
  assert.equal(cite(s(4), 'Chicago'), '(PersonA et al. 2020)');
});

test('reference-list author counts', () => {
  const s = (n: number) => src({ authors: many(n), year: '2020', title: 'T', publisher: 'P' });
  assert.ok(ref(s(3), 'MLA').startsWith('PersonA, A., et al. '), ref(s(3), 'MLA'));
  assert.ok(ref(s(6), 'IEEE').startsWith('A. PersonA, B. PersonB, C. PersonC, D. PersonD, E. PersonE, and F. PersonF, '));
  assert.ok(ref(s(7), 'IEEE').startsWith('A. PersonA et al., '), 'IEEE: more than six authors, first author and et al.');
  assert.ok(ref(s(6), 'Vancouver').startsWith('PersonA A, PersonB B, PersonC C, PersonD D, PersonE E, PersonF F. '));
  assert.ok(ref(s(7), 'Vancouver').startsWith('PersonA A, PersonB B, PersonC C, PersonD D, PersonE E, PersonF F, et al. '), 'Vancouver: more than six, the first six then et al.');
  assert.ok(ref(s(20), 'APA').includes('PersonT, T. (2020)'), 'APA lists up to 20 authors');
  const apa21 = ref(s(21), 'APA');
  assert.ok(apa21.includes('PersonS, S., . . . ') || apa21.includes('PersonS, S., … PersonU, U. (2020)'), `APA 21+: first 19, an ellipsis, the last: ${apa21}`);
  assert.ok(ref(s(6), 'Chicago').startsWith('PersonA, A., B. PersonB, C. PersonC, D. PersonD, E. PersonE, and F. PersonF. 2020.'), ref(s(6), 'Chicago'));
  assert.ok(ref(s(7), 'Chicago').startsWith('PersonA, A., B. PersonB, C. PersonC, et al. 2020.'), `Chicago 18: more than six authors, the first three then et al.: ${ref(s(7), 'Chicago')}`);
});

/* ── Year, and two works by one author in one year ──────────────── */
test('years: letters are removed, n.d. is normalised', () => {
  const y = (year: string) => cite(src({ authors: 'Ann Lee', year, title: 'T' }), 'APA');
  assert.equal(y('2020'), '(Lee, 2020)');
  assert.equal(y('2020a'), '(Lee, 2020)');
  assert.equal(y('n.d.'), '(Lee, n.d.)');
  assert.equal(y('nd'), '(Lee, n.d.)');
  assert.equal(y(''), '(Lee, n.d.)');
  assert.equal(y('in press'), '(Lee, in press)');
  const h = (year: string) => cite(src({ authors: 'Ann Lee', year, title: 'T' }), 'Harvard');
  assert.equal(h(''), '(Lee, no date)', 'Cite Them Right writes "no date"');
  assert.equal(h('2020'), '(Lee, 2020)');
});

test('two works by one author in one year get a and b, ordered by title', () => {
  const b = src({ id: 'b', authors: 'James Lull', year: '1995', title: 'Zebra studies', publisher: 'P' });
  const a = src({ id: 'a', authors: 'James Lull', year: '1995', title: 'The art of listening', publisher: 'P' });
  const both = [b, a];
  assert.equal(cite(a, 'APA', '', both), '(Lull, 1995a)');
  assert.equal(cite(b, 'APA', '', both), '(Lull, 1995b)');
  assert.equal(ref(a, 'APA', both), 'Lull, J. (1995a). *The art of listening*. P.');
  assert.equal(ref(b, 'Harvard', both), 'Lull, J. (1995b) *Zebra studies*. P.');
  assert.equal(cite(b, 'Chicago', '4', both), '(Lull 1995b, 4)');
  assert.equal(ref(a, 'Chicago', both), 'Lull, James. 1995a. *The art of listening*. P.');
  // Different years need nothing.
  const c = src({ id: 'c', authors: 'James Lull', year: '1996', title: 'Other', publisher: 'P' });
  assert.equal(cite(a, 'APA', '', [a, c]), '(Lull, 1995)');
  // No date: n.d.-a and n.d.-b.
  const d1 = src({ id: 'd1', authors: 'Ann Lee', title: 'Alpha', publisher: 'P' });
  const d2 = src({ id: 'd2', authors: 'Ann Lee', title: 'Beta', publisher: 'P' });
  assert.equal(cite(d2, 'APA', '', [d1, d2]), '(Lee, n.d.-b)');
  // MLA tells them apart with a short title instead.
  assert.equal(cite(a, 'MLA', '7', both), '(Lull, The art of listening 7)', 'a book: the short title cannot be italic in plain text, so it is left plain');
  assert.equal(cite(b, 'MLA', '', both), '(Lull, Zebra studies)');
  // Numbered styles never need letters.
  assert.equal(cite(b, 'IEEE', '', both), '[1]');
});

/* ── Numbered styles ────────────────────────────────────────────── */
test('IEEE and Vancouver number sources by order of first citation', () => {
  const a = src({ id: 'a', authors: 'Ann Lee', year: '2001', title: 'A' });
  const b = src({ id: 'b', authors: 'Bo Chen', year: '2002', title: 'B' });
  const c = src({ id: 'c', authors: 'Cy Diaz', year: '2003', title: 'C' });
  const all = [a, b, c];
  // The essay cites c first, then a, and b is never cited.
  const ctx = buildContext(all, 'IEEE', ['c', 'a', 'c']);
  assert.equal(ctx.numbers?.get('c'), 1);
  assert.equal(ctx.numbers?.get('a'), 2);
  assert.equal(ctx.numbers?.get('b'), 3, 'a source nobody cites yet goes last');
  assert.equal(inTextCitation(c, 'IEEE', '', ctx), '[1]');
  assert.equal(inTextCitation(a, 'IEEE', '4', ctx), '[2, p. 4]');
  assert.equal(inTextCitation(a, 'IEEE', '4-6', ctx), '[2, pp. 4–6]');
  assert.equal(inTextCitation(a, 'Vancouver', '4-6', buildContext(all, 'Vancouver', ['a'])), '(1, pp. 4-6)', 'Vancouver: round brackets, as ICMJE says');
  assert.equal(inTextCitation(a, 'Vancouver', '', buildContext(all, 'Vancouver', ['a'])), '(1)');
  assert.equal(inTextCitation(a, 'IEEE'), '[?]', 'a source with no number is flagged, not guessed');
  assert.equal(referenceLabel('IEEE', 3), '[3] ');
  assert.equal(referenceLabel('Vancouver', 3), '3. ');
  assert.equal(referenceLabel('APA', 3), '');
  // An id that is not in the list is ignored.
  assert.equal(buildContext(all, 'IEEE', ['zzz', 'b']).numbers?.get('b'), 1);
});

/* ── Page numbers ───────────────────────────────────────────────── */
test('page numbers in each style', () => {
  const s = src({ authors: 'Ann Lee', year: '2020', title: 'T', publisher: 'P' });
  assert.equal(cite(s, 'APA', '25'), '(Lee, 2020, p. 25)');
  assert.equal(cite(s, 'APA', '25-27'), '(Lee, 2020, pp. 25–27)');
  assert.equal(cite(s, 'APA', '25 - 27, 30-32'), '(Lee, 2020, pp. 25–27, 30–32)');
  assert.equal(cite(s, 'APA', '25, 27'), '(Lee, 2020, pp. 25, 27)');
  assert.equal(cite(s, 'APA', 'para. 4'), '(Lee, 2020, para. 4)');
  assert.equal(cite(s, 'APA', 'xii'), '(Lee, 2020, p. xii)');
  assert.equal(cite(s, 'APA', 'xii-xiv'), '(Lee, 2020, pp. xii–xiv)');
  assert.equal(cite(s, 'MLA', '25-27'), '(Lee 25–27)');
  assert.equal(cite(s, 'MLA', 'par. 4'), '(Lee par. 4)');
  assert.equal(cite(s, 'Chicago', '25'), '(Lee 2020, 25)');
  assert.equal(cite(s, 'Harvard', '25-27'), '(Lee, 2020, pp. 25–27)');
  assert.equal(cite(s, 'Harvard', ''), '(Lee, 2020)');
  assert.equal(cite(s, 'IEEE', 'para. 4'), '[1, para. 4]');
});

test('Chicago shortens page ranges the way the Chicago Manual of Style table does', () => {
  const pages = (p: string) => ref(src({ kind: 'journal', authors: 'Ann Lee', year: '2020', title: 'T', container: 'J', volume: '1', pages: p }), 'Chicago').match(/: ([^.]+)\./)?.[1];
  for (const [typed, want] of [['3-10', '3–10'], ['71-72', '71–72'], ['96-117', '96–117'], ['100-104', '100–104'], ['600-613', '600–613'], ['1100-1123', '1100–1123'],
    ['107-108', '107–8'], ['505-517', '505–17'], ['1002-1006', '1002–6'], ['321-328', '321–28'], ['498-532', '498–532'], ['1087-1089', '1087–89'],
    ['1496-1500', '1496–1500'], ['11564-11568', '11564–68'], ['13792-13803', '13792–13803'], ['439-458', '439–58']] as const) {
    assert.equal(pages(typed), want, `${typed}`);
  }
  assert.equal(cite(src({ authors: 'Ann Lee', year: '2020', title: 'T' }), 'Chicago', '321-328'), '(Lee 2020, 321–28)');
});

/* ── Dates, links ───────────────────────────────────────────────── */
test('the date a page was read is written the way each style writes dates', () => {
  const d = '12 March 2026';
  assert.equal(formatAccessed(d, 'Harvard'), '12 March 2026');
  assert.equal(formatAccessed(d, 'MLA'), '12 Mar. 2026');
  assert.equal(formatAccessed(d, 'Chicago'), 'March 12, 2026');
  assert.equal(formatAccessed(d, 'IEEE'), 'Mar. 12, 2026');
  assert.equal(formatAccessed(d, 'Vancouver'), '2026 Mar 12');
  assert.equal(formatAccessed('March 12, 2026', 'MLA'), '12 Mar. 2026');
  assert.equal(formatAccessed('2026-03-12', 'IEEE'), 'Mar. 12, 2026');
  assert.equal(formatAccessed('5th Sept 2026', 'MLA'), '5 Sept. 2026');
  assert.equal(formatAccessed('May 2026', 'MLA'), 'May 2026');
  assert.equal(formatAccessed('June 2026', 'Vancouver'), '2026 Jun');
  assert.equal(formatAccessed('29 February 2024', 'MLA'), '29 Feb. 2024');
  assert.equal(formatAccessed('30 February 2026', 'MLA'), '30 February 2026', 'not a real date: left as typed');
  assert.equal(formatAccessed('last Tuesday', 'MLA'), 'last Tuesday');
  assert.equal(formatAccessed('', 'MLA'), '');
});

test('DOIs and web addresses are tidied', () => {
  assert.equal(normaliseLink('10.1037/ppm0000185'), 'https://doi.org/10.1037/ppm0000185');
  assert.equal(normaliseLink('doi:10.1037/ppm0000185'), 'https://doi.org/10.1037/ppm0000185');
  assert.equal(normaliseLink('DOI: 10.1037/ppm0000185'), 'https://doi.org/10.1037/ppm0000185');
  assert.equal(normaliseLink('http://dx.doi.org/10.1037/ppm0000185'), 'https://doi.org/10.1037/ppm0000185');
  assert.equal(normaliseLink('https://doi.org/10.1037/ppm0000185.'), 'https://doi.org/10.1037/ppm0000185');
  assert.equal(normaliseLink('www.bbc.co.uk/news'), 'https://www.bbc.co.uk/news');
  assert.equal(normaliseLink('bbc.co.uk/news'), 'https://bbc.co.uk/news');
  assert.equal(normaliseLink('https://example.com/a_(b)'), 'https://example.com/a_(b)');
  assert.equal(normaliseLink('  '), '');
});

/* ── Ordering of the list ───────────────────────────────────────── */
test('the list is alphabetical, letter by letter', () => {
  const mk = (id: string, authors: string, year = '2000', title = 'T') => src({ id, authors, year, title });
  const sorted = (list: Source[]) => [...list].sort(compareSources).map((s) => s.id);
  assert.deepEqual(sorted([mk('smithers', 'Ann Smithers'), mk('smithj', 'Jo Smith')]), ['smithj', 'smithers'], 'Smith before Smithers');
  assert.deepEqual(sorted([mk('dean', 'Ann Dean'), mk('cruz', 'Mary de la Cruz')]), ['dean', 'cruz'], 'letter by letter: Dean before de la Cruz');
  assert.deepEqual(sorted([mk('two', 'Jo Smith\nKim Jones', '2018'), mk('one', 'Jo Smith', '2019')]), ['one', 'two'], 'one author before several');
  assert.deepEqual(sorted([mk('b', 'Jo Smith', '2005'), mk('a', 'Jo Smith', '2001')]), ['a', 'b'], 'same author: earlier year first');
  assert.deepEqual(sorted([mk('z', 'Jo Smith', '2001', 'Zoo'), mk('a', 'Jo Smith', '2001', 'The apple')]), ['a', 'z'], 'same author and year: by title, ignoring "The"');
  assert.deepEqual(sorted([mk('alvarez', 'Ana Alvarez'), mk('alva', 'Eve Álvarez'), mk('b', 'Bo Chen')]).slice(-1), ['b']);
  assert.deepEqual(sorted([src({ id: 'notitle', title: 'Zebra' }), mk('smith', 'Jo Smith'), src({ id: 'abc', title: 'A book of days' })]), ['abc', 'smith', 'notitle'], 'no author: sorted by title, ignoring "A"');
});

/* ── Duplicates and validation ──────────────────────────────────── */
test('the same work typed twice is spotted', () => {
  const a = src({ authors: 'James Lull', year: '1995', title: 'Media, Communication, Culture' });
  assert.ok(sameSource(a, src({ authors: 'Lull, James', year: '1995', title: 'media communication culture.' })));
  assert.ok(!sameSource(a, src({ authors: 'James Lull', year: '1996', title: 'Media, Communication, Culture' })));
  assert.ok(!sameSource(a, src({ authors: 'Ann Lee', year: '1995', title: 'Media, Communication, Culture' })));
});

test('what a source needs before it can be added', () => {
  assert.equal(sourceProblem(src({ title: '' })), 'Add the title.');
  assert.equal(sourceProblem(src({ kind: 'journal', title: 'T' })), 'Add the name of the journal.');
  assert.equal(sourceProblem(src({ kind: 'website', title: 'T' })), 'Add the web address.');
  assert.match(sourceProblem(src({ title: 'T', year: '95' })) ?? '', /four digits/);
  assert.match(sourceProblem(src({ title: 'T', year: 'last year' })) ?? '', /four digits/);
  for (const y of ['', '2020', '2020a', 'n.d.', 'nd', 'in press']) assert.equal(sourceProblem(src({ title: 'T', year: y })), null, y);
  assert.equal(sourceProblem(src({ kind: 'website', title: 'T', url: 'bbc.co.uk' })), null);
});

/* ── Nothing may ever print "undefined", double punctuation or stray spaces ── */
test('no style ever prints junk, however much of the form is left empty', () => {
  const kinds = ['book', 'journal', 'website'] as const;
  let checked = 0;
  for (const kind of kinds) {
    for (let mask = 0; mask < 512; mask++) {
      const s = src({
        kind,
        authors: mask & 1 ? 'Ann Lee\nBo Chen' : '',
        year: mask & 2 ? '2020' : '',
        title: 'A title',
        container: mask & 4 ? 'The Container' : (kind === 'book' ? '' : 'The Container'),
        publisher: mask & 8 ? 'The Publisher' : '',
        place: mask & 16 ? 'London' : '',
        volume: mask & 32 ? '5' : '',
        issue: mask & 64 ? '2' : '',
        pages: mask & 128 ? '10-20' : '',
        url: mask & 256 ? 'https://example.com/x' : (kind === 'website' ? 'https://example.com/y' : ''),
        accessed: mask & 2 ? '3 May 2026' : '',
      });
      for (const style of CITE_STYLES) {
        const t = ref(s, style);
        const where = `${kind} ${mask} ${style}: ${t}`;
        assert.ok(!/undefined|null|NaN|\[object/.test(t), where);
        assert.ok(!/\.\./.test(t.replace(/\. \. \./g, '').replace(/…/g, '')), where);
        assert.ok(!/ {2}/.test(t), where);
        assert.ok(!/ [,.;:]/.test(t.replace('et al .', '')), where);
        assert.ok(!/[,;:] ?$/.test(t), where);
        assert.ok(!/\(\)|\[\]|, ,|; ;/.test(t), where);
        assert.ok(t.trim() === t && t.length > 5, where);
        checked++;
      }
      const ctx = buildContext([s], 'APA', [s.id]);
      for (const style of CITE_STYLES) {
        const c = inTextCitation(s, style, mask & 128 ? '10-12' : '', ctx);
        assert.ok(!/undefined|null|NaN/.test(c) && c.length > 2, c);
      }
    }
  }
  assert.equal(checked, 3 * 512 * 6);
});
