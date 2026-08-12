import { Suspense, useEffect, useState } from 'react';
import LoggedInPageShell from '../workspace/LoggedInPageShell';
import Footer from '../common/Footer';
import { lazyWithRetry } from '../../utils/lazyWithRetry';
import { applyPageSeoTags, injectJsonLd, removeJsonLd, absoluteCanonicalUrl } from '../../utils/seo';

const InteractiveDocumentAnalysis = lazyWithRetry(() => import('../landing/InteractiveDocumentAnalysis'));

/**
 * Single component that powers every programmatic SEO landing page:
 *   - /study/[subject]              → subject study tools
 *   - /alternatives/[competitor]    → competitor alternative pages
 *   - /guides/[topic]               → how-to writing guides
 *   - /best/[query]                 → "best for X" comparison pages
 *
 * Each page is driven by a config in src/data/programmaticPages.ts.
 * The component handles:
 *   - <title>, meta description, canonical, OG/Twitter
 *   - Article schema for guides; SoftwareApplication for tool/alternative pages
 *   - FAQ schema (always)
 *   - Internal linking (related programmatic pages + tool pages)
 *
 * Why this design: 30+ landing pages without copy-pasting markup, and any
 * style change propagates everywhere automatically.
 */

export interface ProgrammaticPageConfig {
  /** URL slug fragment (no leading/trailing slash) — e.g. "biology" or "quizlet" */
  slug: string;
  /** Page type — drives layout choices and schema */
  type: 'subject' | 'alternative' | 'guide' | 'best';
  /** SEO <title> — keep ≤60 chars where possible */
  metaTitle: string;
  /** SEO meta description — 150-160 chars for SERP */
  metaDescription: string;
  /** Visible H1 */
  h1: string;
  /** 1-2 sentence subtitle under H1 */
  subtitle: string;
  /** Eyebrow/badge above H1 — e.g. "Biology study tools" or "Free Quizlet alternative" */
  eyebrow: string;
  /** Main intro paragraph (200-400 words) */
  intro: string;
  /** Section blocks — flexible content rendered in order */
  sections: ProgrammaticSection[];
  /** FAQ entries — always rendered, also as FAQPage JSON-LD */
  faqs: { question: string; answer: string }[];
  /** "Related" link block at the bottom */
  related: { label: string; href: string; teaser: string }[];
  /** Primary CTA button — points to a tool or signup */
  primaryCta: { label: string; page: string };
  /** Optional secondary CTA */
  secondaryCta?: { label: string; page: string };
  /** Accent color for headings and CTAs (defaults to purple) */
  accent?: string;
  /** Optional ISO date for guide-type pages (used in Article schema) */
  datePublished?: string;
  /** Extra editorial framing for /best/* round-ups: review metadata plus the
      up-front verdict. Round-up searchers want the answer before the table,
      so this renders above the fold instead of being buried in prose. */
  bestMeta?: {
    /** Human-readable freshness stamp — e.g. "August 2026" */
    updated: string;
    /** e.g. "5 tools tested" */
    tested: string;
    /** e.g. "6 min read" */
    readTime?: string;
    /** How the round-up was run, one line */
    method?: string;
    verdict: {
      pick: { name: string; why: string; badge?: string };
      runnerUp?: { name: string; why: string };
      budget?: { name: string; why: string };
    };
  };
}

export type ProgrammaticSection =
  | { type: 'paragraph'; heading?: string; body: string }
  | { type: 'list'; heading: string; items: { title: string; body: string }[] }
  | { type: 'comparison'; heading: string; columns: string[]; rows: { feature: string; values: string[] }[]; intro?: string }
  | { type: 'steps'; heading: string; steps: { title: string; body: string }[] }
  | { type: 'examples'; heading: string; examples: { label: string; before: string; after: string; explanation: string }[] }
  /** Product visual — autoplay demo clip or screenshot inside a device-style
      card. The single highest-leverage engagement block on competitor
      comparison pages: visitors searching "X alternative" want to SEE the
      product, not read another table. */
  | { type: 'media'; kind: 'video' | 'image'; src: string; alt: string; heading?: string; caption?: string; poster?: string }
  /** The same live essay-analysis demo the homepage runs. Beats a screenshot on
      pages where the whole question is "does this grader actually work". */
  | { type: 'demo'; heading?: string; caption?: string };

/* ─── Schema injection helpers ─────────────────────────────────── */

function injectFaqSchema(faqs: { question: string; answer: string }[]) {
  injectJsonLd('programmatic-faq', {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  });
}

function injectGuideSchema(cfg: ProgrammaticPageConfig) {
  if (cfg.type !== 'guide') return;
  const url = absoluteCanonicalUrl(window.location.pathname);
  injectJsonLd('programmatic-article', {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: cfg.h1,
    description: cfg.metaDescription,
    image: ['https://writescholar.com/og-image.png'],
    datePublished: cfg.datePublished || '2026-05-09',
    dateModified: cfg.datePublished || '2026-05-09',
    author: { '@type': 'Organization', name: 'WriteScholar' },
    publisher: {
      '@type': 'Organization',
      name: 'WriteScholar',
      url: 'https://writescholar.com',
      logo: { '@type': 'ImageObject', url: 'https://writescholar.com/main-logo.png' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  });
}

/**
 * Strip leading numbers/punctuation from step titles like
 * "1. Introduction (5-10% of essay)" → "Introduction (5-10% of essay)".
 * Google's HowTo rich result prefers clean step names without ordinal
 * prefixes, since the carousel itself shows the step number.
 */
function cleanStepTitle(title: string): string {
  return title.replace(/^\s*\d+\.\s*/, '').trim();
}

/**
 * Inject HowTo schema for /guides/* pages so Google can render them as
 * step-by-step rich result cards in search. Eligibility:
 *   - Must be type 'guide'
 *   - Must contain at least one section with type 'steps' (the structure
 *     array in EssayGuideMeta is rendered as a steps section)
 *
 * Why this matters: HowTo rich results show the page title, an image, and
 * 3-5 step previews directly on the SERP. They occupy ~3-4x the vertical
 * space of a regular blue link, dramatically increasing CTR for
 * "how to" queries.
 *
 * Note: Google deprecated HowTo rich results for desktop in late 2023 but
 * they still serve on mobile. Mobile is where most student "how to" search
 * happens anyway, so the upside remains real.
 */
function injectHowToSchema(cfg: ProgrammaticPageConfig) {
  if (cfg.type !== 'guide') return;

  // Find the first section of type 'steps' — that's the canonical step list.
  const stepsSection = cfg.sections.find((s) => s.type === 'steps');
  if (!stepsSection || stepsSection.type !== 'steps') return;

  const url = absoluteCanonicalUrl(window.location.pathname);

  injectJsonLd('programmatic-howto', {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: cfg.h1,
    description: cfg.metaDescription,
    image: 'https://writescholar.com/og-image.png',
    // Realistic time estimate for a typical writing guide (mid-length essay
    // outline → first draft). Used by Google to show a "X min" badge on the
    // rich card.
    totalTime: 'PT30M',
    supply: [{ '@type': 'HowToSupply', name: 'A topic and a working thesis' }],
    tool: [
      { '@type': 'HowToTool', name: 'Word processor or text editor' },
      { '@type': 'HowToTool', name: 'WriteScholar essay tools', url: 'https://writescholar.com/tools/analyze' },
    ],
    step: stepsSection.steps.map((s, idx) => ({
      '@type': 'HowToStep',
      position: idx + 1,
      name: cleanStepTitle(s.title),
      text: s.body,
      url: `${url}#step-${idx + 1}`,
    })),
  });
}

/* ─── Section helpers ─────────────────────────────────────────── */

/** Heading with a small coloured accent bar to its left, for visual rhythm. */
const SectionHeading = ({ children, accent, size = 'md' }: { children: React.ReactNode; accent: string; size?: 'md' | 'lg' }) => (
  <div className="flex items-center gap-3 mb-6">
    <span
      className="block h-7 w-1.5 rounded-full"
      style={{ backgroundColor: accent }}
      aria-hidden
    />
    <h2 className={`font-extrabold tracking-tight text-stone-900 dark:text-stone-50 ${size === 'lg' ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}`}>
      {children}
    </h2>
  </div>
);

/**
 * Render a comparison table cell value with a check (✓) when the value is
 * "Yes", an X when "No"/"None", and the literal text otherwise. Subtle but
 * dramatically improves table scanability.
 */
const ComparisonCell = ({ value, isHighlighted, accent }: { value: string; isHighlighted: boolean; accent: string }) => {
  const lower = value.trim().toLowerCase();
  const isYes = lower === 'yes' || lower === 'yes — interactive' || lower === 'all' || lower === 'best';
  const isNo = lower === 'no' || lower === 'none' || lower === 'limited' || lower === 'n/a';
  if (isYes) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-flex w-5 h-5 rounded-full items-center justify-center text-white font-extrabold text-[11px]"
          style={{ backgroundColor: isHighlighted ? accent : '#58CC02' }}
          aria-hidden
        >
          ✓
        </span>
        <span className="text-stone-800 dark:text-stone-200">{value}</span>
      </span>
    );
  }
  if (isNo) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-flex w-5 h-5 rounded-full items-center justify-center text-white font-extrabold text-[11px] bg-stone-400 dark:bg-stone-600"
          aria-hidden
        >
          ✕
        </span>
        <span className="text-stone-700 dark:text-stone-300">{value}</span>
      </span>
    );
  }
  return <span className="text-stone-700 dark:text-stone-300">{value}</span>;
};

/* ─── Section renderers ────────────────────────────────────────── */

const ParagraphSection = ({ section, accent }: { section: Extract<ProgrammaticSection, { type: 'paragraph' }>; accent: string }) => (
  <div className="mb-12">
    {section.heading && <SectionHeading accent={accent}>{section.heading}</SectionHeading>}
    <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-[15px] sm:text-base max-w-3xl">
      {section.body}
    </p>
  </div>
);

const ListSection = ({ section, accent }: { section: Extract<ProgrammaticSection, { type: 'list' }>; accent: string }) => (
  <div className="mb-14">
    <SectionHeading accent={accent}>{section.heading}</SectionHeading>
    <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
      {section.items.map((it, i) => (
        <div
          key={i}
          className="group relative rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-stone-300 dark:hover:border-stone-700"
        >
          {/* Tiny accent dot on the top-left */}
          <span
            className="absolute top-4 left-5 block w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: accent }}
            aria-hidden
          />
          <h3 className="font-extrabold mb-1.5 text-[15px] pl-4" style={{ color: accent }}>{it.title}</h3>
          <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-[14px] pl-4">{it.body}</p>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Comparison table.
 *
 * The products sit on different axes depending on the page: /alternatives/*
 * tables list each product as a column, while /best/* round-ups list one
 * product per row. `productAxis` decides which cells get the accent highlight
 * so the "we win" emphasis lands on an actual product, never on a feature
 * label. Yes/No values render as check/X icons.
 */
const ComparisonSection = ({
  section,
  accent,
  productAxis = 'columns',
}: {
  section: Extract<ProgrammaticSection, { type: 'comparison' }>;
  accent: string;
  productAxis?: 'rows' | 'columns';
}) => {
  const rowsAreProducts = productAxis === 'rows';
  // Column 1 is "Feature" (the row label). Column 2 is the first product column.
  const winnerColIndex = 1;
  const winnerRowIndex = rowsAreProducts
    ? section.rows.findIndex((r) => r.feature.toLowerCase().includes('writescholar'))
    : -1;

  return (
    <div className="mb-14">
      <SectionHeading accent={accent}>{section.heading}</SectionHeading>
      {section.intro && (
        <p className="text-stone-700 dark:text-stone-300 mb-5 max-w-2xl text-[15px] leading-relaxed">{section.intro}</p>
      )}
      <div className="overflow-x-auto rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr>
              {section.columns.map((c, i) => {
                const isWinner = !rowsAreProducts && i === winnerColIndex;
                return (
                  <th
                    key={i}
                    className="p-3 sm:p-4 text-[13px] sm:text-sm font-extrabold text-stone-900 dark:text-stone-50 whitespace-nowrap border-b-2 border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/70"
                    style={isWinner ? { backgroundColor: `${accent}18`, color: accent } : undefined}
                  >
                    {isWinner && (
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-white text-[10px] mr-2 align-middle"
                        style={{ backgroundColor: accent }}
                      >
                        ★ Pick
                      </span>
                    )}
                    {c}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((r, i) => {
              const isWinnerRow = i === winnerRowIndex;
              return (
                <tr
                  key={i}
                  className={`border-b border-stone-100 dark:border-stone-800/60 last:border-0 ${
                    isWinnerRow ? '' : i % 2 === 1 ? 'bg-stone-50/50 dark:bg-stone-900/40' : ''
                  }`}
                  style={isWinnerRow ? { backgroundColor: `${accent}12` } : undefined}
                >
                  <td className="p-3 sm:p-4 text-[13px] sm:text-sm font-bold text-stone-800 dark:text-stone-200 whitespace-nowrap">
                    {isWinnerRow && (
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-white text-[10px] mr-2 align-middle"
                        style={{ backgroundColor: accent }}
                      >
                        ★ Our pick
                      </span>
                    )}
                    <span style={isWinnerRow ? { color: accent } : undefined}>{r.feature}</span>
                  </td>
                  {r.values.map((v, j) => {
                    const isWinnerCell = rowsAreProducts ? isWinnerRow : j === 0;
                    return (
                      <td
                        key={j}
                        className="p-3 sm:p-4 text-[13px] sm:text-sm"
                        style={!rowsAreProducts && j === 0 ? { backgroundColor: `${accent}08` } : undefined}
                      >
                        <ComparisonCell value={v} isHighlighted={isWinnerCell} accent={accent} />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Steps section. Bigger numbered circles with shadows, and a faint vertical
 * line connecting them so the sequence reads like a journey.
 */
const StepsSection = ({ section, accent }: { section: Extract<ProgrammaticSection, { type: 'steps' }>; accent: string }) => (
  <div className="mb-14">
    <SectionHeading accent={accent}>{section.heading}</SectionHeading>
    <ol className="relative space-y-4">
      {/* Faint connecting line behind the step numbers, only visible on sm+ */}
      <span
        className="hidden sm:block absolute left-[22px] top-3 bottom-3 w-0.5 rounded-full"
        style={{ backgroundColor: `${accent}30` }}
        aria-hidden
      />
      {section.steps.map((s, i) => (
        <li
          key={i}
          /* id="step-N" so the HowTo schema's per-step URL fragments
             (#step-1, #step-2, ...) actually scroll to the right card. */
          id={`step-${i + 1}`}
          className="relative flex gap-4 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 transition-transform hover:-translate-y-0.5 scroll-mt-24"
        >
          <span
            className="flex-shrink-0 w-11 h-11 rounded-full text-white font-extrabold flex items-center justify-center text-[17px] shadow-md"
            style={{
              backgroundColor: accent,
              boxShadow: `0 4px 0 0 ${accent}80, 0 8px 16px -4px ${accent}40`,
            }}
            aria-hidden
          >
            {i + 1}
          </span>
          <div className="flex-1 pt-1">
            <h3 className="font-extrabold text-stone-900 dark:text-stone-50 mb-1 text-[15px]">{s.title}</h3>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-[14px]">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  </div>
);

const ExamplesSection = ({ section, accent }: { section: Extract<ProgrammaticSection, { type: 'examples' }>; accent: string }) => (
  <div className="mb-14">
    <SectionHeading accent={accent}>{section.heading}</SectionHeading>
    <div className="space-y-4">
      {section.examples.map((ex, i) => (
        <div
          key={i}
          className="rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 transition-transform hover:-translate-y-0.5"
        >
          <div
            className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-4"
            style={{ backgroundColor: `${accent}15`, color: accent }}
          >
            {ex.label}
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl border-2 border-red-200 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/10 p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400 mb-2 flex items-center gap-1.5">
                <span className="inline-flex w-4 h-4 rounded-full bg-red-500 text-white items-center justify-center text-[10px]" aria-hidden>✕</span>
                Before
              </div>
              <div className="text-stone-800 dark:text-stone-200 text-[14px] leading-relaxed">{ex.before}</div>
            </div>
            <div className="rounded-xl border-2 border-green-200 dark:border-green-900/40 bg-green-50/40 dark:bg-green-950/10 p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-green-700 dark:text-green-400 mb-2 flex items-center gap-1.5">
                <span className="inline-flex w-4 h-4 rounded-full bg-green-600 text-white items-center justify-center text-[10px]" aria-hidden>✓</span>
                After
              </div>
              <div className="text-stone-800 dark:text-stone-200 text-[14px] leading-relaxed">{ex.after}</div>
            </div>
          </div>
          <p className="text-stone-600 dark:text-stone-400 text-[13px] leading-relaxed italic border-l-2 pl-3" style={{ borderColor: `${accent}40` }}>
            {ex.explanation}
          </p>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Product visual — demo video (autoplay, muted, looped) or screenshot in a
 * browser-chrome card. Lazy-loaded so it never hurts LCP on these pages.
 */
const MediaSection = ({ section, accent }: { section: Extract<ProgrammaticSection, { type: 'media' }>; accent: string }) => (
  <div className="mb-14">
    {section.heading && <SectionHeading accent={accent}>{section.heading}</SectionHeading>}
    <div className="rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-sm">
      {/* Faux browser chrome so the asset reads as "the actual product" */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b-2 border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60">
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" aria-hidden />
        <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" aria-hidden />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" aria-hidden />
        <span className="ml-3 text-[11px] font-bold text-stone-400 dark:text-stone-500 truncate">writescholar.com</span>
      </div>
      {section.kind === 'video' ? (
        <video
          className="w-full h-auto block"
          src={section.src}
          poster={section.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={section.alt}
        />
      ) : (
        <img src={section.src} alt={section.alt} loading="lazy" className="w-full h-auto block" />
      )}
    </div>
    {section.caption && (
      <p className="mt-3 text-center text-[13px] font-bold text-stone-500 dark:text-stone-400">{section.caption}</p>
    )}
  </div>
);

/**
 * Live essay-analysis demo, same component and framing the homepage uses.
 * The floating grade pill tracks whichever sample the visitor selects.
 */
const DemoSection = ({
  section,
  accent,
  onNavigate,
}: {
  section: Extract<ProgrammaticSection, { type: 'demo' }>;
  accent: string;
  onNavigate: (page: string) => void;
}) => {
  const [activeGradeLetter, setActiveGradeLetter] = useState('B');
  return (
    // Break out of the article's max-w-4xl so the live grader matches the
    // homepage demo width (max-w-6xl) on desktop.
    <div className="mb-14 relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {section.heading && <SectionHeading accent={accent}>{section.heading}</SectionHeading>}
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-4 sm:-inset-6 rounded-[2.5rem] blur-3xl -z-10"
            style={{ background: `linear-gradient(135deg, ${accent}33, ${accent}14 60%, #58CC0214)` }}
          />
          <div
            aria-hidden
            className="hidden sm:flex absolute -top-4 -right-4 lg:-top-5 lg:-right-5 z-20 items-center justify-center w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-[#58CC02] text-white text-3xl lg:text-4xl font-extrabold rotate-[6deg] border-2 border-b-4 border-[#46A302] shadow-[0_18px_32px_-8px_rgba(88,204,2,0.5)]"
          >
            {activeGradeLetter}
          </div>
          <div
            className="relative rounded-2xl sm:rounded-3xl border-2 border-b-4 bg-white dark:bg-stone-900 overflow-hidden shadow-lg"
            style={{ borderColor: accent }}
          >
            {/* Browser-chrome strip so the demo reads as the real product */}
            <div
              className="flex h-7 shrink-0 items-center gap-1 px-2.5 border-b-2"
              style={{ borderColor: `${accent}55`, backgroundColor: `${accent}14` }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
              <span className="h-2 w-2 rounded-full opacity-60" style={{ backgroundColor: accent }} aria-hidden />
              <span className="h-2 w-2 rounded-full opacity-30" style={{ backgroundColor: accent }} aria-hidden />
              <span className="ml-2 text-[10px] font-bold truncate" style={{ color: accent }}>
                writescholar.com · essay analyzer
              </span>
              <span
                className="ml-auto inline-flex items-center gap-1 rounded-full bg-white dark:bg-stone-900 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
                style={{ color: accent }}
              >
                <span className="h-1.5 w-1.5 rounded-full motion-safe:animate-pulse" style={{ backgroundColor: accent }} aria-hidden />
                Live
              </span>
            </div>
            <Suspense fallback={<div className="min-h-[480px] w-full bg-white dark:bg-stone-900" aria-hidden />}>
              <InteractiveDocumentAnalysis
                onNavigate={onNavigate}
                landingHeroEmbed
                onSampleChange={setActiveGradeLetter}
              />
            </Suspense>
          </div>
        </div>
        {section.caption && (
          <p className="mt-3 text-center text-[13px] font-bold text-stone-500 dark:text-stone-400">{section.caption}</p>
        )}
      </div>
    </div>
  );
};

/* ─── /best/* round-up chrome ──────────────────────────────────── */

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Small label/value chip used for the review metadata row in the best hero. */
const MetaChip = ({ icon, children }: { icon: string; children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 border border-white/20 px-3 py-1 text-[11px] sm:text-xs font-bold text-white/90 backdrop-blur-sm">
    <span aria-hidden>{icon}</span>
    {children}
  </span>
);

/**
 * Editorial hero for /best/* round-ups. Round-up traffic arrives wanting a
 * ranked answer, so this leads with review metadata and an "our pick" card
 * rather than the mascot-and-centered-headline layout the other page types
 * share.
 */
const BestHero = ({
  config,
  accent,
  onNavigate,
}: {
  config: ProgrammaticPageConfig;
  accent: string;
  onNavigate: (page: string) => void;
}) => {
  const meta = config.bestMeta;
  const pick = meta?.verdict.pick;
  return (
    <section className="relative overflow-hidden">
      {/* Seamless header-purple to muted plum. The readable content area
          remains dark; the page transition is handled separately below. */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg,
            ${accent} 0%,
            #9254CF 24%,
            #7546A2 50%,
            #603A7E 76%,
            #4C2D66 100%
          )`,
        }}
        aria-hidden
      />
      {/* Restrained lighting keeps the text area calm and readable. */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 62% 56% at 12% 16%, rgba(255,255,255,0.16), transparent 68%),
            radial-gradient(ellipse 48% 52% at 92% 24%, rgba(54,25,82,0.22), transparent 72%)
          `,
        }}
        aria-hidden
      />
      {/* One diffused highlight, rather than competing colored orbs. */}
      <div
        className="absolute -top-24 -left-16 w-96 h-96 rounded-full opacity-[0.16] blur-3xl pointer-events-none bg-white"
        aria-hidden
      />
      {/* Fine dot texture, faded out before the light zone */}
      <div
        className="absolute inset-0 opacity-[0.09] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.6) 0.7px, transparent 0.8px)`,
          backgroundSize: '24px 24px',
          maskImage: 'linear-gradient(180deg, #000 0%, #000 38%, transparent 70%)',
          WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 38%, transparent 70%)',
        }}
        aria-hidden
      />
      {/* Soft top rim highlight */}
      <div
        className="absolute inset-x-0 top-0 h-px opacity-30 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        aria-hidden
      />
      {/* A short transition below the content avoids washing out the trust
          line while still blending the hero into the light page body. */}
      <div
        className="absolute inset-x-0 bottom-0 h-14 pointer-events-none bg-gradient-to-b from-transparent to-stone-50 dark:to-stone-950"
        aria-hidden
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-20 sm:pb-24">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-10 lg:gap-12 items-start">
          {/* Left: editorial headline block */}
          <div>
            <span
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.14em] border text-white"
              style={{ backgroundColor: `${accent}33`, borderColor: `${accent}80` }}
            >
              <span className="block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
              {config.eyebrow}
            </span>

            <h1 className="mt-5 text-3xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight text-white leading-[1.05] text-balance">
              {config.h1}
            </h1>

            <p className="mt-4 text-base sm:text-lg text-white/75 leading-relaxed max-w-xl">
              {config.subtitle}
            </p>

            {meta && (
              <div className="mt-6 flex flex-wrap gap-2">
                <MetaChip icon="↻">Updated {meta.updated}</MetaChip>
                <MetaChip icon="⚖">{meta.tested}</MetaChip>
                {meta.readTime && <MetaChip icon="◷">{meta.readTime}</MetaChip>}
              </div>
            )}

            <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:items-center">
              <button
                type="button"
                onClick={() => onNavigate(config.primaryCta.page)}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-extrabold text-white border-2 border-b-4 transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:border-b-2 text-[15px]"
                style={{ backgroundColor: accent, borderColor: '#00000040' }}
              >
                {config.primaryCta.label}
                <span aria-hidden>→</span>
              </button>
              {config.secondaryCta && (
                <button
                  type="button"
                  onClick={() => onNavigate(config.secondaryCta!.page)}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-extrabold text-white border-2 border-b-4 border-white/25 bg-white/10 hover:bg-white/15 transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:border-b-2 text-[15px]"
                >
                  {config.secondaryCta.label}
                </button>
              )}
            </div>

            <div className="mt-5 text-[12px] sm:text-[13px] font-bold text-white/85">
              Trusted by <span className="text-white tabular-nums">50,000+</span> students
            </div>
          </div>

          {/* Right: product preview card — sits high so the feedback panel is
              the first visual answer above the fold */}
          {pick && (
            <div className="relative lg:-mt-2">
              <div
                className="absolute -inset-4 rounded-[2rem] opacity-35 blur-3xl"
                style={{ backgroundColor: accent }}
                aria-hidden
              />
              <div className="relative rounded-3xl border-2 border-b-[6px] border-white/20 bg-white dark:bg-stone-900 overflow-hidden shadow-[0_28px_60px_-20px_rgba(0,0,0,0.55)]">
                {/* Compact pick bar */}
                <div
                  className="flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5"
                  style={{ backgroundColor: accent }}
                >
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white">
                    <span className="inline-flex w-4 h-4 rounded-full bg-white/20 items-center justify-center text-[10px]" aria-hidden>★</span>
                    {pick.badge || 'Our pick'}
                  </span>
                  <span className="text-[11px] font-extrabold text-white/85 tabular-nums">#1 of {meta?.tested}</span>
                </div>

                {/* Product identity row */}
                <div className="flex items-center gap-3 px-4 sm:px-5 py-3 bg-white dark:bg-stone-900">
                  <img
                    src="/main-logo.png"
                    alt=""
                    aria-hidden
                    className="w-10 h-10 rounded-xl object-contain bg-white border-2 border-stone-200 dark:border-stone-700 p-1 shadow-sm"
                    loading="eager"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-[16px] text-stone-900 dark:text-stone-50 leading-tight truncate">{pick.name}</div>
                    <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400">Best overall · essay grader</div>
                  </div>
                  <span
                    className="hidden sm:inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider"
                    style={{ backgroundColor: `${accent}18`, color: accent }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full motion-safe:animate-pulse" style={{ backgroundColor: accent }} aria-hidden />
                    Live
                  </span>
                </div>

                {/* Editor preview — crop biased to the feedback panel, higher in-frame */}
                <div className="relative border-t-2 border-stone-100 dark:border-stone-800">
                  <div
                    className="flex h-6 items-center gap-1 px-3 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80"
                    aria-hidden
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF5F57]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FFBD2E]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#28C840]" />
                    <span className="ml-2 text-[9px] font-bold text-stone-400 truncate">writescholar.com · essay analyzer</span>
                  </div>
                  <img
                    src="/WriterPic.png"
                    alt="WriteScholar editor showing an essay with AI feedback"
                    className="block w-full aspect-[16/10] object-cover object-[88%_8%] bg-white"
                    loading="eager"
                  />
                  {/* Soft edge vignette so the crop feels intentional */}
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/10 to-transparent"
                    aria-hidden
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

/**
 * Sticky in-page nav for round-ups. Long comparison pages lose readers to the
 * scroll; anchor chips let them jump straight to the table or the FAQ.
 */
const BestJumpNav = ({ items, accent }: { items: { id: string; label: string }[]; accent: string }) => (
  <nav
    className="sticky top-0 z-30 border-b border-stone-200 dark:border-stone-800 bg-white/85 dark:bg-stone-950/85 backdrop-blur-md"
    aria-label="On this page"
  >
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-hide">
        <span className="flex-shrink-0 text-[11px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500 pr-1">
          On this page
        </span>
        {items.map((it) => (
          <a
            key={it.id}
            href={`#${it.id}`}
            className="flex-shrink-0 rounded-full border-2 border-stone-200 dark:border-stone-800 px-3 py-1 text-[12px] font-bold text-stone-700 dark:text-stone-300 hover:text-white transition-colors whitespace-nowrap"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = accent;
              e.currentTarget.style.borderColor = accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '';
              e.currentTarget.style.borderColor = '';
            }}
          >
            {it.label}
          </a>
        ))}
      </div>
    </div>
  </nav>
);

/** How-we-tested strip: the credibility signal generic round-ups skip. */
const MethodologyNote = ({ method, accent }: { method: string; accent: string }) => (
  <div
    className="mb-12 rounded-2xl border-2 border-dashed p-5 flex gap-4 items-start"
    style={{ borderColor: `${accent}45`, backgroundColor: `${accent}0A` }}
  >
    <span
      className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold"
      style={{ backgroundColor: accent }}
      aria-hidden
    >
      ⚗
    </span>
    <div>
      <div className="text-[11px] font-extrabold uppercase tracking-wider mb-1" style={{ color: accent }}>
        How we tested
      </div>
      <p className="text-[14px] leading-relaxed text-stone-700 dark:text-stone-300">{method}</p>
    </div>
  </div>
);

/* ─── Page component ───────────────────────────────────────────── */

interface Props {
  config: ProgrammaticPageConfig;
  onNavigate: (page: string) => void;
  user?: any;
  onLogout: () => void;
}

/**
 * Mascot GIF picker. We rotate the mascot per page-type so visitors don't
 * see the exact same illustration on every programmatic page in their
 * session, but the choice is deterministic per page (no flicker on re-render).
 *
 * Available assets in /public:
 *   - /mascot-laptop.webp      → studying / general purpose
 *   - /mascot-paper.webp       → writing / essays
 *   - /mascot-juggling.webp    → "lots of tools / lots of options"
 *   - /mascot-celebrating.webp → CTA / closing
 *   - /mascot-jumping-joy.webp → engagement / "ready to go"
 *   - /mascot-dance.webp       → energy / fun
 */
function pickHeroMascot(type: string): string {
  switch (type) {
    case 'subject':       return '/mascot-laptop.webp';
    case 'alternative':   return '/mascot-juggling.webp';
    case 'guide':         return '/mascot-paper.webp';
    case 'best':          return '/mascot-jumping-joy.webp';
    default:              return '/mascot-laptop.webp';
  }
}
function pickCtaMascot(): string {
  return '/mascot-celebrating.webp';
}

const ProgrammaticLandingPage = ({ config, onNavigate, user, onLogout }: Props) => {
  const accent = config.accent || '#A560E8';
  const heroMascot = pickHeroMascot(config.type);
  const ctaMascot = pickCtaMascot();
  const isBest = config.type === 'best';
  const sectionIds = config.sections.map((s, i) =>
    'heading' in s && s.heading ? slugify(s.heading) : `section-${i}`,
  );
  const jumpItems = isBest
    ? [
        ...config.sections
          .map((s, i) => ('heading' in s && s.heading ? { id: sectionIds[i], label: s.heading } : null))
          .filter((x): x is { id: string; label: string } => x !== null),
        { id: 'faq', label: 'FAQ' },
      ]
    : [];

  useEffect(() => {
    applyPageSeoTags({
      title: config.metaTitle,
      description: config.metaDescription,
    });
    injectFaqSchema(config.faqs);
    injectGuideSchema(config);
    injectHowToSchema(config);
    return () => {
      removeJsonLd('programmatic-faq');
      removeJsonLd('programmatic-article');
      removeJsonLd('programmatic-howto');
    };
  }, [config]);

  return (
    <LoggedInPageShell className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950" user={user} onNavigate={onNavigate} onLogout={onLogout}>

      {isBest && <BestHero config={config} accent={accent} onNavigate={onNavigate} />}
      {isBest && jumpItems.length > 1 && <BestJumpNav items={jumpItems} accent={accent} />}

      {/* Hero, with mascot GIF in a coloured ring above the H1 so the page
          feels like part of the WriteScholar product. Decorative dot pattern
          and floating accent shapes give visual depth so the hero doesn't
          feel like a plain blog header. */}
      {!isBest && (
      <section className="relative pt-14 sm:pt-20 pb-14 sm:pb-20 border-b border-stone-200 dark:border-stone-800 overflow-hidden bg-gradient-to-b from-white to-stone-50/40 dark:from-stone-950 dark:to-stone-900/40">
        {/* Soft radial glow behind the H1 */}
        <div
          className="absolute inset-0 opacity-40 dark:opacity-25"
          style={{ background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${accent}30, transparent 60%)` }}
          aria-hidden
        />
        {/* Decorative floating shapes — top-left and top-right corners */}
        <div
          className="absolute top-12 left-4 sm:left-12 w-24 h-24 rounded-full opacity-20 hidden sm:block"
          style={{ backgroundColor: accent, filter: 'blur(40px)' }}
          aria-hidden
        />
        <div
          className="absolute top-20 right-4 sm:right-16 w-32 h-32 rounded-full opacity-15 hidden sm:block"
          style={{ backgroundColor: accent, filter: 'blur(50px)' }}
          aria-hidden
        />
        {/* Subtle dot grid background */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle, ${accent} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
          aria-hidden
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Mascot GIF in a coloured double-ring frame. Slightly larger than before
              so it actually anchors the hero. Keep the bg-white inside so the
              transparent GIF shows through cleanly. */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div
                className="rounded-full p-2 border-4 shadow-md"
                style={{ backgroundColor: `${accent}15`, borderColor: `${accent}50`, boxShadow: `0 8px 24px -8px ${accent}40` }}
              >
                <img
                  src={heroMascot}
                  alt=""
                  aria-hidden
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover bg-white"
                  loading="eager"
                />
              </div>
              {/* Tiny floating accent dot to add motion */}
              <span
                className="absolute -top-1 -right-1 block w-4 h-4 rounded-full border-2 border-white dark:border-stone-950"
                style={{ backgroundColor: accent }}
                aria-hidden
              />
            </div>
          </div>

          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-wider border mb-5"
            style={{
              backgroundColor: `${accent}15`,
              borderColor: `${accent}40`,
              color: accent,
            }}
          >
            <span className="block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
            {config.eyebrow}
          </span>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 mb-5 text-balance leading-[1.05]">
            {config.h1}
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-stone-700 dark:text-stone-300 leading-relaxed max-w-2xl mx-auto mb-8">
            {config.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md mx-auto mb-6">
            <button
              type="button"
              onClick={() => onNavigate(config.primaryCta.page)}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-extrabold text-white border-2 border-b-4 transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:border-b-2 text-[15px] shadow-md"
              style={{
                backgroundColor: accent,
                borderColor: accent === '#A560E8' ? '#8A48C7' : accent,
                boxShadow: `0 6px 16px -4px ${accent}40`,
              }}
            >
              {config.primaryCta.label}
              <span aria-hidden>→</span>
            </button>
            {config.secondaryCta && (
              <button
                type="button"
                onClick={() => onNavigate(config.secondaryCta!.page)}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-extrabold text-stone-800 dark:text-stone-100 border-2 border-b-4 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-stone-400 transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:border-b-2 text-[15px]"
              >
                {config.secondaryCta.label}
              </button>
            )}
          </div>

          {/* Social proof pill under the CTAs — same trust signal as the
              homepage hero, on every programmatic page. */}
          <div className="text-[12px] sm:text-[13px] font-bold text-stone-700 dark:text-stone-300">
            Trusted by{' '}
            <span className="font-extrabold tabular-nums" style={{ color: accent }}>
              50,000+
            </span>{' '}
            students
          </div>
        </div>
      </section>
      )}

      {/* Body */}
      <main className="flex-1 py-12 sm:py-16">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Intro paragraph */}
          <p className="text-base sm:text-lg text-stone-700 dark:text-stone-300 leading-relaxed mb-10 max-w-3xl">
            {config.intro}
          </p>

          {isBest && config.bestMeta?.method && (
            <MethodologyNote method={config.bestMeta.method} accent={accent} />
          )}

          {/* Mascot break card. Sits between the intro and the first content
              section so it interrupts the wall-of-text rhythm without feeling
              like an ad. Uses the accent colour as a top-bar so it reads as a
              colour-coded highlight rather than a plain banner. */}
          {!isBest && (
          <div className="relative mb-14 rounded-3xl border-2 border-b-4 overflow-hidden bg-white dark:bg-stone-900"
            style={{ borderColor: `${accent}40` }}
          >
            {/* Top accent bar */}
            <div className="h-2 w-full" style={{ backgroundColor: accent }} aria-hidden />
            <div className="flex flex-col sm:flex-row items-center gap-5 p-5 sm:p-6">
              <div
                className="rounded-2xl p-1.5 border-2 flex-shrink-0"
                style={{ borderColor: `${accent}40`, backgroundColor: `${accent}10` }}
              >
                <img
                  src="/mascot-juggling.webp"
                  alt=""
                  aria-hidden
                  loading="lazy"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover bg-white"
                />
              </div>
              <div className="text-center sm:text-left flex-1">
                <div
                  className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider mb-2 px-2.5 py-0.5 rounded-full"
                  style={{ color: accent, backgroundColor: `${accent}15` }}
                >
                  <span className="block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
                  Built into WriteScholar
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-50 mb-1.5">
                  Flashcards, quizzes, and AI feedback in one app
                </h2>
                <p className="text-stone-700 dark:text-stone-300 text-[14px] leading-relaxed">
                  Free to start. No credit card. Used by 50,000+ college students.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(config.primaryCta.page)}
                className="hidden sm:inline-flex flex-shrink-0 items-center gap-1.5 px-5 py-2.5 rounded-2xl font-extrabold text-white border-2 border-b-4 text-[14px] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:border-b-2"
                style={{ backgroundColor: accent, borderColor: accent === '#A560E8' ? '#8A48C7' : accent }}
              >
                Try free
                <span aria-hidden>→</span>
              </button>
            </div>
          </div>
          )}

          {/* Custom sections */}
          {config.sections.map((section, i) => {
            const body = (() => {
              switch (section.type) {
                case 'paragraph':
                  return <ParagraphSection section={section} accent={accent} />;
                case 'list':
                  return <ListSection section={section} accent={accent} />;
                case 'comparison':
                  return <ComparisonSection section={section} accent={accent} productAxis={isBest ? 'rows' : 'columns'} />;
                case 'steps':
                  return <StepsSection section={section} accent={accent} />;
                case 'examples':
                  return <ExamplesSection section={section} accent={accent} />;
                case 'media':
                  return <MediaSection section={section} accent={accent} />;
                case 'demo':
                  return <DemoSection section={section} accent={accent} onNavigate={onNavigate} />;
                default:
                  return null;
              }
            })();
            return (
              <div key={i} id={sectionIds[i]} className="scroll-mt-20">
                {body}
              </div>
            );
          })}

          {/* FAQ section. Header bar with a small peeking mascot to break the
              wall-of-questions feel. Each accordion uses chunkier hover/open
              transitions so the interaction feels rewarding. */}
          <div className="mb-14 scroll-mt-20" id="faq">
            <div className="flex items-center gap-4 mb-6">
              <SectionHeading accent={accent}>Frequently asked questions</SectionHeading>
              <img
                src="/mascot-laptop.webp"
                alt=""
                aria-hidden
                loading="lazy"
                className="hidden sm:block w-12 h-12 rounded-full object-cover bg-white shadow-md ml-auto"
                style={{ boxShadow: `0 4px 12px -4px ${accent}40` }}
              />
            </div>
            <div className="space-y-3">
              {config.faqs.map((f, i) => (
                <details
                  key={i}
                  className="group rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden transition-all duration-150 hover:border-stone-300 dark:hover:border-stone-700 open:border-b-2"
                >
                  <summary className="cursor-pointer flex items-center justify-between gap-3 p-5 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors list-none">
                    <span className="font-extrabold text-stone-900 dark:text-stone-50 text-[15px] sm:text-base flex-1">{f.question}</span>
                    <span
                      className="flex-shrink-0 w-7 h-7 rounded-full text-white text-base font-extrabold flex items-center justify-center transition-transform duration-200 group-open:rotate-45 shadow-sm"
                      style={{ backgroundColor: accent }}
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <div
                    className="px-5 pb-5 pt-1 text-stone-700 dark:text-stone-300 leading-relaxed text-[14px] border-t border-stone-100 dark:border-stone-800"
                  >
                    <div className="pt-3">{f.answer}</div>
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* Final CTA card with the celebrating-mascot GIF above the heading.
              Reinforces the brand mascot used elsewhere on the site at the
              moment of decision (when the user is most likely to convert). */}
          <div
            className="rounded-3xl p-8 sm:p-10 text-center border-2 border-b-4 mb-12"
            style={{ backgroundColor: `${accent}10`, borderColor: `${accent}40` }}
          >
            <div className="flex justify-center mb-4">
              <div
                className="rounded-full p-1.5 border-4"
                style={{ backgroundColor: 'white', borderColor: accent }}
              >
                <img
                  src={ctaMascot}
                  alt=""
                  aria-hidden
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover bg-white"
                  loading="lazy"
                />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-50 mb-3">
              Ready to try it free?
            </h2>
            <p className="text-stone-700 dark:text-stone-300 max-w-md mx-auto mb-6 leading-relaxed text-[15px]">
              No credit card. 30 seconds to get started. WriteScholar takes your notes and turns them into the study tools you actually use.
            </p>
            <button
              type="button"
              onClick={() => onNavigate(config.primaryCta.page)}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-extrabold text-white border-2 border-b-4 transition-transform hover:-translate-y-0.5 active:translate-y-0 active:border-b-2"
              style={{ backgroundColor: accent, borderColor: accent === '#A560E8' ? '#8A48C7' : accent }}
            >
              {config.primaryCta.label}
            </button>
          </div>

          {/* Related programmatic pages. Cards lift on hover, show a small
              type badge (Subject / Guide / Tool / etc.), and reveal an
              animated arrow to signal navigation. Heavy internal linking
              here is one of the SEO benefits of programmatic pages. */}
          {config.related.length > 0 && (
            <div className="mb-8">
              <SectionHeading accent={accent}>Keep exploring</SectionHeading>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {config.related.map((r, i) => {
                  // Infer a "type label" from the URL prefix for a small badge.
                  const typeBadge =
                    r.href.startsWith('/study/') ? 'Subject' :
                    r.href.startsWith('/alternatives/') ? 'Compare' :
                    r.href.startsWith('/guides/') ? 'Guide' :
                    r.href.startsWith('/best/') ? 'Top picks' :
                    r.href.startsWith('/tools/') ? 'Tool' : 'Resource';
                  return (
                    <a
                      key={i}
                      href={r.href}
                      className="group relative block rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 transition-all duration-150 hover:-translate-y-1 hover:border-b-[6px]"
                      style={{
                        // @ts-ignore inline CSS var to use as hover border color
                        '--hover-accent': accent,
                      } as React.CSSProperties}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = accent;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '';
                      }}
                    >
                      <div
                        className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-2"
                        style={{ backgroundColor: `${accent}15`, color: accent }}
                      >
                        {typeBadge}
                      </div>
                      <div className="font-extrabold text-stone-900 dark:text-stone-50 mb-1 text-[15px] flex items-center gap-2">
                        {r.label}
                        <span
                          className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ml-auto"
                          style={{ color: accent }}
                          aria-hidden
                        >
                          →
                        </span>
                      </div>
                      <div className="text-[13px] text-stone-600 dark:text-stone-400 leading-snug">{r.teaser}</div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </article>
      </main>

      <Footer onNavigate={onNavigate} />
    </LoggedInPageShell>
  );
};

export default ProgrammaticLandingPage;
