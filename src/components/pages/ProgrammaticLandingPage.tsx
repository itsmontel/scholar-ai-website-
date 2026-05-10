import { useEffect } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import { applyPageSeoTags, injectJsonLd, removeJsonLd, absoluteCanonicalUrl } from '../../utils/seo';

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
}

export type ProgrammaticSection =
  | { type: 'paragraph'; heading?: string; body: string }
  | { type: 'list'; heading: string; items: { title: string; body: string }[] }
  | { type: 'comparison'; heading: string; columns: string[]; rows: { feature: string; values: string[] }[]; intro?: string }
  | { type: 'steps'; heading: string; steps: { title: string; body: string }[] }
  | { type: 'examples'; heading: string; examples: { label: string; before: string; after: string; explanation: string }[] };

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

/* ─── Section renderers ────────────────────────────────────────── */

const ParagraphSection = ({ section, accent }: { section: Extract<ProgrammaticSection, { type: 'paragraph' }>; accent: string }) => (
  <div className="mb-10">
    {section.heading && (
      <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-50 mb-3" style={{ color: accent }}>
        {section.heading}
      </h2>
    )}
    <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-[15px] sm:text-base">
      {section.body}
    </p>
  </div>
);

const ListSection = ({ section, accent }: { section: Extract<ProgrammaticSection, { type: 'list' }>; accent: string }) => (
  <div className="mb-12">
    <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-50 mb-5">{section.heading}</h2>
    <div className="grid sm:grid-cols-2 gap-3">
      {section.items.map((it, i) => (
        <div key={i} className="rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
          <h3 className="font-extrabold mb-1 text-[15px]" style={{ color: accent }}>{it.title}</h3>
          <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-[14px]">{it.body}</p>
        </div>
      ))}
    </div>
  </div>
);

const ComparisonSection = ({ section }: { section: Extract<ProgrammaticSection, { type: 'comparison' }> }) => (
  <div className="mb-12">
    <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-50 mb-3">{section.heading}</h2>
    {section.intro && (
      <p className="text-stone-700 dark:text-stone-300 mb-5 max-w-2xl text-[15px] leading-relaxed">{section.intro}</p>
    )}
    <div className="overflow-x-auto rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b-2 border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60">
            {section.columns.map((c, i) => (
              <th key={i} className="p-3 sm:p-4 text-[13px] sm:text-sm font-extrabold text-stone-900 dark:text-stone-50 whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {section.rows.map((r, i) => (
            <tr key={i} className="border-b border-stone-100 dark:border-stone-800/60 last:border-0">
              <td className="p-3 sm:p-4 text-[13px] sm:text-sm font-bold text-stone-800 dark:text-stone-200">{r.feature}</td>
              {r.values.map((v, j) => (
                <td key={j} className="p-3 sm:p-4 text-[13px] sm:text-sm text-stone-700 dark:text-stone-300">{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const StepsSection = ({ section, accent }: { section: Extract<ProgrammaticSection, { type: 'steps' }>; accent: string }) => (
  <div className="mb-12">
    <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-50 mb-5">{section.heading}</h2>
    <ol className="space-y-3">
      {section.steps.map((s, i) => (
        <li key={i} className="flex gap-4 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
          <span className="flex-shrink-0 w-9 h-9 rounded-full text-white font-extrabold flex items-center justify-center text-base" style={{ backgroundColor: accent }} aria-hidden>
            {i + 1}
          </span>
          <div>
            <h3 className="font-extrabold text-stone-900 dark:text-stone-50 mb-1 text-[15px]">{s.title}</h3>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-[14px]">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  </div>
);

const ExamplesSection = ({ section, accent }: { section: Extract<ProgrammaticSection, { type: 'examples' }>; accent: string }) => (
  <div className="mb-12">
    <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-50 mb-5">{section.heading}</h2>
    <div className="space-y-4">
      {section.examples.map((ex, i) => (
        <div key={i} className="rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
          <div className="text-[12px] font-extrabold uppercase tracking-wider mb-3" style={{ color: accent }}>{ex.label}</div>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/10 p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-1.5">Before</div>
              <div className="text-stone-800 dark:text-stone-200 text-[14px] leading-relaxed">{ex.before}</div>
            </div>
            <div className="rounded-xl border border-green-200 dark:border-green-900/40 bg-green-50/40 dark:bg-green-950/10 p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-green-700 dark:text-green-400 mb-1.5">After</div>
              <div className="text-stone-800 dark:text-stone-200 text-[14px] leading-relaxed">{ex.after}</div>
            </div>
          </div>
          <p className="text-stone-600 dark:text-stone-400 text-[13px] leading-relaxed italic">{ex.explanation}</p>
        </div>
      ))}
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

const ProgrammaticLandingPage = ({ config, onNavigate, user, onLogout }: Props) => {
  const accent = config.accent || '#A560E8';

  useEffect(() => {
    applyPageSeoTags({
      title: config.metaTitle,
      description: config.metaDescription,
    });
    injectFaqSchema(config.faqs);
    injectGuideSchema(config);
    return () => {
      removeJsonLd('programmatic-faq');
      removeJsonLd('programmatic-article');
    };
  }, [config]);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      {/* Hero */}
      <section className="relative pt-12 sm:pt-20 pb-12 sm:pb-16 border-b border-stone-200 dark:border-stone-800 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 dark:opacity-20"
          style={{ background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${accent}30, transparent 60%)` }}
          aria-hidden
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-wider border mb-5"
            style={{
              backgroundColor: `${accent}15`,
              borderColor: `${accent}40`,
              color: accent,
            }}
          >
            {config.eyebrow}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 mb-5 text-balance leading-[1.1]">
            {config.h1}
          </h1>
          <p className="text-base sm:text-lg text-stone-700 dark:text-stone-300 leading-relaxed max-w-2xl mx-auto mb-8">
            {config.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => onNavigate(config.primaryCta.page)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-extrabold text-white border-2 border-b-4 transition-transform hover:-translate-y-0.5 active:translate-y-0 active:border-b-2 text-[15px]"
              style={{ backgroundColor: accent, borderColor: accent === '#A560E8' ? '#8A48C7' : accent }}
            >
              {config.primaryCta.label}
            </button>
            {config.secondaryCta && (
              <button
                type="button"
                onClick={() => onNavigate(config.secondaryCta!.page)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-extrabold text-stone-800 dark:text-stone-100 border-2 border-b-4 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-stone-400 transition-transform hover:-translate-y-0.5 active:translate-y-0 active:border-b-2 text-[15px]"
              >
                {config.secondaryCta.label}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Body */}
      <main className="flex-1 py-12 sm:py-16">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Intro paragraph */}
          <p className="text-base sm:text-lg text-stone-700 dark:text-stone-300 leading-relaxed mb-12 max-w-3xl">
            {config.intro}
          </p>

          {/* Custom sections */}
          {config.sections.map((section, i) => {
            switch (section.type) {
              case 'paragraph':
                return <ParagraphSection key={i} section={section} accent={accent} />;
              case 'list':
                return <ListSection key={i} section={section} accent={accent} />;
              case 'comparison':
                return <ComparisonSection key={i} section={section} />;
              case 'steps':
                return <StepsSection key={i} section={section} accent={accent} />;
              case 'examples':
                return <ExamplesSection key={i} section={section} accent={accent} />;
              default:
                return null;
            }
          })}

          {/* FAQ */}
          <div className="mb-12">
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-50 mb-5">Frequently asked questions</h2>
            <div className="space-y-3">
              {config.faqs.map((f, i) => (
                <details
                  key={i}
                  className="group rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden"
                >
                  <summary className="cursor-pointer flex items-center justify-between gap-3 p-5 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors list-none">
                    <span className="font-extrabold text-stone-900 dark:text-stone-50 text-[15px] sm:text-base">{f.question}</span>
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full text-white text-sm font-extrabold flex items-center justify-center transition-transform group-open:rotate-45"
                      style={{ backgroundColor: accent }}
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <div className="px-5 pb-5 text-stone-700 dark:text-stone-300 leading-relaxed text-[14px]">{f.answer}</div>
                </details>
              ))}
            </div>
          </div>

          {/* Final CTA card */}
          <div
            className="rounded-3xl p-8 sm:p-10 text-center border-2 border-b-4 mb-12"
            style={{ backgroundColor: `${accent}10`, borderColor: `${accent}40` }}
          >
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

          {/* Related programmatic pages — internal linking for SEO */}
          {config.related.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-50 mb-5">Related pages</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {config.related.map((r, i) => (
                  <a
                    key={i}
                    href={r.href}
                    className="block rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 hover:border-stone-400 dark:hover:border-stone-600 transition-colors group"
                  >
                    <div className="font-extrabold text-stone-900 dark:text-stone-50 mb-1 text-[14px]" style={{ color: accent }}>
                      {r.label}
                    </div>
                    <div className="text-[13px] text-stone-600 dark:text-stone-400 leading-snug">{r.teaser}</div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default ProgrammaticLandingPage;
