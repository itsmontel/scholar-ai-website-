// Prints a reference and an in-text citation for sample sources in every style.
// Run: node scripts/cite-samples.mts
import { CITE_STYLES, buildContext, emptySource, formatReference, inTextCitation, referenceLabel, type Source } from '../src/utils/citations.ts';

const src = (id: string, p: Partial<Source>): Source => ({ ...emptySource(p.kind ?? 'book'), id, ...p });

const SAMPLES: Source[] = [
  src('book1', { kind: 'book', authors: 'James Lull', year: '1995', title: 'Media, communication, culture: A global approach', publisher: 'Columbia University Press', place: 'New York' }),
  src('book2', { kind: 'book', authors: 'W. E. B. Du Bois', year: '1903', title: 'The souls of Black folk', publisher: 'A. C. McClurg' }),
  src('book3', { kind: 'book', authors: 'Martin Luther King Jr.', year: '1963', title: 'Why we can\'t wait?', publisher: 'Harper & Row' }),
  src('book4', { kind: 'book', authors: 'Anna Smith\nRyan Poll\nVincent van Gogh', year: '2019', title: 'Three author title', publisher: 'Oxford University Press', place: 'Oxford' }),
  src('journal1', { kind: 'journal', authors: 'Gabriel García Márquez' === '' ? '' : 'Mary de la Cruz\nJean-Paul Sartre', year: '2020', title: 'Sleep and memory in adolescents', container: 'Journal of Sleep Research', volume: '29', issue: '4', pages: '25-40', url: '10.1111/jsr.12345' }),
  src('journal2', { kind: 'journal', authors: '', year: '', title: 'Study finds benefits of walking', container: 'Medical News Today', volume: '', issue: '', pages: '12' }),
  src('web1', { kind: 'website', authors: 'World Health Organization', org: true, year: '2021', title: 'Obesity and overweight', container: 'World Health Organization', url: 'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight', accessed: '12 March 2026' }),
  src('web2', { kind: 'website', authors: 'Jane Doe, PhD', year: '', title: 'How to revise for exams', container: 'BBC Bitesize', url: 'www.bbc.co.uk/bitesize/revise', accessed: 'March 5, 2026' }),
];

for (const style of CITE_STYLES) {
  console.log(`\n=== ${style} ===`);
  const order = SAMPLES.map((s) => s.id);
  const ctx = buildContext(SAMPLES, style, order);
  SAMPLES.forEach((s, i) => {
    const label = referenceLabel(style, ctx.numbers?.get(s.id) ?? i + 1);
    console.log(`${s.id.padEnd(8)} ${inTextCitation(s, style, '25', ctx).padEnd(30)} ${label}${formatReference(s, style, ctx).map((x) => (x.italic ? `*${x.text}*` : x.text)).join('')}`);
  });
}
