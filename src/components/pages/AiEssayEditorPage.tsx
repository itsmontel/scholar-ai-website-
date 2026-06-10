import { useEffect, type ReactNode } from 'react';
import LoggedInPageShell from '../workspace/LoggedInPageShell';
import Footer from '../common/Footer';
import LandingSectionLayers from '../common/LandingSectionLayers';
import { injectJsonLd, removeJsonLd, injectToolProductSchema, SITE_ORIGIN } from '../../utils/seo';

interface AiEssayEditorPageProps {
  onNavigate: (page: string) => void;
  user?: {
    id: string;
    name: string;
    email: string;
    firstName?: string;
    lastName?: string;
    plan?: string;
    subscription_plan?: string;
    subscription_status?: string;
    email_verified?: boolean;
  } | null;
  onLogout: () => void;
}

/* Dedicated, indexable SEO landing page for the flagship feature:
   write in a real editor → professor-style grade + rubric →
   line-by-line fixes applied in one click → Word in / Word out.
   The app editor itself lives at /documents (noindex), so this page
   is the public, crawlable target for "ai essay grader / grade my
   essay / ai essay editor / essay feedback before submitting". */

/* Premium browser-chrome window — matches the landing product frame
   so screenshots/video read as the real product, not clip-art. */
function Frame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="relative mx-auto max-w-4xl">
      <div
        aria-hidden
        className="absolute -inset-x-8 -bottom-8 top-12 -z-10 bg-[radial-gradient(ellipse_60%_60%_at_50%_60%,rgba(165,96,232,0.16),transparent_70%)] blur-2xl"
      />
      <div className="overflow-hidden rounded-2xl border-2 border-[#A560E8] bg-white dark:bg-stone-900 shadow-[0_2px_8px_rgba(40,30,60,0.06),0_44px_90px_-34px_rgba(40,30,60,0.34)]">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-200/70 dark:border-stone-800 bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-900">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-3 w-3 rounded-full bg-[#FF5F57] ring-1 ring-black/5" />
            <span className="h-3 w-3 rounded-full bg-[#FEBC2E] ring-1 ring-black/5" />
            <span className="h-3 w-3 rounded-full bg-[#28C840] ring-1 ring-black/5" />
          </span>
          <span className="mx-auto hidden sm:block text-[12px] font-semibold text-stone-400 dark:text-stone-500">
            {title}
          </span>
          <span className="w-12 sm:w-16 shrink-0" aria-hidden />
        </div>
        {children}
      </div>
    </div>
  );
}

const STEPS = [
  {
    n: 1,
    title: 'Write or import your essay',
    body: 'Draft in a real editor, or import a .docx, PDF or TXT. Bold, italics, headings, tables, citations and footnotes carry over, nothing to reformat.',
  },
  {
    n: 2,
    title: 'Get an estimated grade and a full rubric',
    body: 'In about 60 seconds you get an estimated grade band and a professor-style rubric, with every category scored: thesis, evidence, structure, clarity and citations.',
  },
  {
    n: 3,
    title: 'Apply line-by-line fixes in one click',
    body: 'Feedback is mapped to your exact sentences. Accept a suggested rewrite and it drops straight into your draft, exactly where it belongs.',
  },
  {
    n: 4,
    title: 'Export a perfectly formatted Word doc',
    body: 'Word in, Word out. Export and your formatting, headings and references come back intact, ready to submit.',
  },
];

const RUBRIC = [
  ['Thesis & argument', 'Is your central claim clear, arguable and carried through the whole essay?'],
  ['Evidence & analysis', 'Are claims backed by evidence, with your own reasoning, not just quotes?'],
  ['Structure & flow', 'Does each paragraph lead with its point and connect to the next?'],
  ['Clarity & style', 'Hedging, wordiness and weak verbs flagged sentence by sentence.'],
  ['Citations & sources', 'APA, MLA, Chicago or Harvard, checked for consistency and formatting.'],
];

const FAQS = [
  {
    q: 'How accurate is the grade?',
    a: 'It is an estimate designed to catch the weak-thesis, no-evidence and waffly-paragraph problems before you submit. It is not a guarantee of the mark your professor will give and it does not replace them, it helps you hand in a stronger draft.',
  },
  {
    q: 'Is it free?',
    a: 'Yes — run a real analysis on your essay with no credit card. Free shows your estimated grade, what\'s wrong, and top suggestions; Pro unlocks every fix, one-click apply, and unlimited analyses.',
  },
  {
    q: 'Does it work for university and college essays?',
    a: 'Yes. You can set the level so the rubric matches undergraduate, postgraduate or high-school expectations, and it handles research papers, argumentative essays, lab reports and literature reviews.',
  },
  {
    q: 'Can I import and export Microsoft Word documents?',
    a: 'Yes. Import a .docx and your formatting, headings and citations carry over. Export and it comes back as a clean, correctly formatted Word document.',
  },
  {
    q: 'Is using an AI essay grader cheating?',
    a: 'No. WriteScholar grades and gives feedback on work you wrote, the same as asking a tutor to read a draft before you submit. It does not write the essay for you.',
  },
];

const AiEssayEditorPage = ({ onNavigate, user, onLogout }: AiEssayEditorPageProps) => {
  useEffect(() => {
    injectToolProductSchema({
      name: 'WriteScholar AI Essay Grader & Editor',
      description:
        'Write your essay in a real editor and get an estimated professor-style grade, a full rubric, and line-by-line fixes you apply to your draft in one click. Word in, Word out.',
      url: `${SITE_ORIGIN}/ai-essay-editor`,
      priceLabel: 'Free',
    });
    injectJsonLd('ai-essay-editor-faq', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
    return () => {
      removeJsonLd('tool-product');
      removeJsonLd('ai-essay-editor-faq');
    };
  }, []);

  const cta = (
    <button
      type="button"
      onClick={() => onNavigate('signup')}
      className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#A560E8] hover:bg-[#8A48C7] text-white text-base sm:text-lg font-extrabold px-8 sm:px-10 py-4 border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all shadow-[0_18px_34px_-14px_rgba(165,96,232,0.6)]"
    >
      Grade my essay
      <span className="font-semibold text-white/75">— it&apos;s free</span>
      <svg className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    </button>
  );

  return (
    <LoggedInPageShell className="min-h-screen relative transition-colors font-sans overflow-x-clip" user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="features">
      {/* ─── HERO + PRODUCT SHOT ──────────────────────────────── */}
      <section className="relative py-16 sm:py-20 overflow-hidden border-b border-stone-200/90 dark:border-stone-800" aria-labelledby="ai-essay-editor-h1">
        <LandingSectionLayers />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.22em] text-[#A560E8] mb-3">
              AI Essay Grader &amp; Editor
            </p>
            <h1
              id="ai-essay-editor-h1"
              className="text-3xl sm:text-4xl lg:text-[3.1rem] font-extrabold text-stone-900 dark:text-stone-50 tracking-tight leading-[1.05] mb-5"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              Grade my essay and fix it
              <br className="hidden sm:block" /> before I submit
            </h1>
            <p className="text-base sm:text-xl text-stone-600 dark:text-stone-400 font-medium leading-relaxed max-w-2xl mx-auto">
              Write your essay in a real editor and get a professor-style grade, a full rubric, and line-by-line fixes you apply in one click. Word in, Word out.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              {cta}
              <p className="text-[12px] sm:text-sm font-bold text-stone-500 dark:text-stone-400">
                Free to try, no credit card. The grade is an estimate to sharpen your draft, not a guarantee.
              </p>
            </div>
          </div>

          <div className="mt-12 sm:mt-16">
            <Frame title="writescholar.com — your essay, graded">
              <img
                src="/WriterPic.png"
                alt="WriteScholar AI essay editor: a draft with a live professor-style rubric and an estimated grade, plus one-click line-by-line fixes"
                loading="lazy"
                decoding="async"
                className="w-full h-auto block"
              />
            </Frame>
          </div>
        </div>
      </section>

      {/* ─── WATCH IT WORK (video) ────────────────────────────── */}
      <section className="relative py-16 sm:py-20 border-b border-stone-200/90 dark:border-stone-800" aria-labelledby="watch-h2">
        <LandingSectionLayers />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2
              id="watch-h2"
              className="text-2xl sm:text-3xl lg:text-[2.2rem] font-extrabold text-stone-900 dark:text-stone-50 tracking-tight mb-3"
              style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
            >
              Watch it grade a real essay
            </h2>
            <p className="text-base text-stone-600 dark:text-stone-400 leading-relaxed">
              Paste a draft, get an estimated grade and a full rubric in about 60 seconds, then apply the fixes straight into the editor.
            </p>
          </div>
          <Frame title="WriteScholar — AI essay checker">
            <video
              src="/writescholar-essay-checker-demo.mp4"
              poster="/hero-vid-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="w-full h-auto block bg-stone-950"
              aria-label="Screen recording of WriteScholar grading an essay and applying fixes"
            />
          </Frame>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="relative py-16 sm:py-20 border-b border-stone-200/90 dark:border-stone-800" aria-labelledby="how-it-works-h2">
        <LandingSectionLayers />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="how-it-works-h2"
            className="text-2xl sm:text-3xl lg:text-[2.2rem] font-extrabold text-stone-900 dark:text-stone-50 tracking-tight text-center mb-12"
            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
          >
            How the AI essay grader works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="relative rounded-2xl border-2 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-[0_1px_2px_rgba(40,30,60,0.04),0_18px_38px_-26px_rgba(96,48,140,0.45)]"
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#A560E8] to-[#8A48C7] text-white text-base font-extrabold ring-1 ring-[#A560E8]/30 shadow-[0_8px_18px_-6px_rgba(165,96,232,0.65)] mb-4"
                  style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                >
                  {s.n}
                </span>
                <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-50 leading-snug mb-1.5" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                  {s.title}
                </h3>
                <p className="text-[13.5px] sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── RUBRIC + REPORT SCREENSHOT ───────────────────────── */}
      <section className="relative py-16 sm:py-20 border-b border-stone-200/90 dark:border-stone-800" aria-labelledby="rubric-h2">
        <LandingSectionLayers />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div>
              <h2
                id="rubric-h2"
                className="text-2xl sm:text-3xl lg:text-[2.2rem] font-extrabold text-stone-900 dark:text-stone-50 tracking-tight mb-3"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                A real rubric, not generic praise
              </h2>
              <p className="text-base text-stone-600 dark:text-stone-400 leading-relaxed mb-7">
                Every essay is scored against a professor-style rubric so you know exactly where the marks are won and lost, instead of a vague &ldquo;looks good, a few suggestions&rdquo;.
              </p>
              <ul className="flex flex-col gap-3">
                {RUBRIC.map(([label, desc]) => (
                  <li key={label} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#A560E8]/15 text-[#A560E8]" aria-hidden>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>
                      <span className="block text-[15px] font-extrabold text-stone-900 dark:text-stone-50">{label}</span>
                      <span className="block text-sm text-stone-600 dark:text-stone-400 leading-relaxed mt-0.5">{desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <Frame title="Estimated academic assessment">
              <img
                src="/full-report.png"
                alt="WriteScholar professor-style essay report: an estimated grade, an overall score, and a category-by-category rubric breakdown"
                loading="lazy"
                decoding="async"
                className="w-full h-auto block"
              />
            </Frame>
          </div>
        </div>
      </section>

      {/* ─── VS CHATGPT ───────────────────────────────────────── */}
      <section className="relative py-16 sm:py-20 border-b border-stone-200/90 dark:border-stone-800" aria-labelledby="vs-h2">
        <LandingSectionLayers />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2
            id="vs-h2"
            className="text-2xl sm:text-3xl lg:text-[2.2rem] font-extrabold text-stone-900 dark:text-stone-50 tracking-tight mb-4"
            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
          >
            Why not just paste it into ChatGPT?
          </h2>
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
            A general chat box gives you one block of &ldquo;here are some tips&rdquo; with no grade, no rubric and no idea whether you are handing in a B or an A. WriteScholar is built to mark essays: a consistent rubric, a grade estimate, feedback tied to your exact sentences, and fixes that drop into the draft, all without copy-pasting back and forth.
          </p>
          <div className="mt-8">{cta}</div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────── */}
      <section className="relative py-16 sm:py-20 border-b border-stone-200/90 dark:border-stone-800" aria-labelledby="faq-h2">
        <LandingSectionLayers />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="faq-h2"
            className="text-2xl sm:text-3xl lg:text-[2.2rem] font-extrabold text-stone-900 dark:text-stone-50 tracking-tight text-center mb-10"
            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
          >
            Frequently asked questions
          </h2>
          <div className="flex flex-col gap-4">
            {FAQS.map((f) => (
              <div key={f.q} className="rounded-2xl border-2 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6">
                <h3 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-stone-50 mb-2" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                  {f.q}
                </h3>
                <p className="text-sm sm:text-[15px] text-stone-600 dark:text-stone-400 leading-relaxed">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────── */}
      <section className="relative py-16 sm:py-24" aria-labelledby="final-cta-h2">
        <LandingSectionLayers />
        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2
            id="final-cta-h2"
            className="text-2xl sm:text-3xl lg:text-[2.4rem] font-extrabold text-stone-900 dark:text-stone-50 tracking-tight leading-[1.1] mb-4"
            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
          >
            Turn this essay from a B into an A
          </h2>
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed mb-8">
            Write it here, see the grade and rubric, apply the fixes, and export a clean Word doc, all before the deadline.
          </p>
          <div className="flex flex-col items-center gap-3">
            {cta}
            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className="text-sm font-bold text-stone-500 dark:text-stone-400 hover:text-[#7733B5] dark:hover:text-[#C9A0F0] transition-colors"
            >
              See pricing
            </button>
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </LoggedInPageShell>
  );
};

export default AiEssayEditorPage;
