import { useEffect, useState } from 'react';
import { injectJsonLd, removeJsonLd } from '../../utils/seo';

/**
 * Reusable SEO content block for tool landing pages.
 *
 * Renders below the actual tool UI and provides the depth of content Google
 * needs to rank tool pages on commercial-intent queries (e.g. "free word
 * counter", "thesis generator"). Each instance also injects FAQPage JSON-LD
 * so questions become eligible for featured-snippet results.
 *
 * Designed so adding a new tool is one config object — no copy/pasting markup.
 */

export interface ToolSeoSteps {
  /** Short imperative phrase, e.g. "Paste your essay" */
  title: string;
  body: string;
}

export interface ToolSeoUseCase {
  /** Audience or scenario, e.g. "Writing a college essay" */
  title: string;
  body: string;
}

export interface ToolSeoFaq {
  question: string;
  answer: string;
}

export interface ToolSeoRelatedTool {
  /** Display name, e.g. "Grammar Checker" */
  label: string;
  /** App route, e.g. "grammar-checker" — passed to onNavigate */
  page: string;
  /** One-line teaser */
  teaser: string;
}

export interface ToolPageSeoContentProps {
  /** H2 heading, e.g. "Free Word Counter — How It Works" */
  heading: string;
  /** 1-2 paragraph intro that frames the tool and its value */
  intro: string;
  /** "How to use" steps — 3-5 entries */
  steps: ToolSeoSteps[];
  /** Use-case scenarios — 3-6 entries */
  useCases: ToolSeoUseCase[];
  /** FAQ entries — 6-12 entries, also injected as FAQPage schema */
  faqs: ToolSeoFaq[];
  /** Related-tools cross-link block — 3-4 entries */
  related: ToolSeoRelatedTool[];
  /** Optional accent color hex for headings + bullets (defaults to purple) */
  accent?: string;
  /** Optional pre-FAQ extra paragraph for keyword density */
  closing?: string;
  onNavigate: (page: string) => void;
}

/**
 * Inject FAQPage JSON-LD with the visible FAQ items so Google can show them
 * as rich snippets. Each tool gets its own JSON-LD ID so multiple tools
 * sharing this component on a single page (rare) won't collide.
 */
function useFaqSchema(faqs: ToolSeoFaq[], schemaId: string) {
  useEffect(() => {
    if (!faqs.length) return;
    injectJsonLd(schemaId, {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer,
        },
      })),
    });
    return () => removeJsonLd(schemaId);
  }, [faqs, schemaId]);
}

const ToolPageSeoContent = ({
  heading,
  intro,
  steps,
  useCases,
  faqs,
  related,
  accent = '#A560E8',
  closing,
  onNavigate,
}: ToolPageSeoContentProps) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  // Use the heading as a stable schema id so each tool keeps its own block
  // even if a parent route mounts multiple instances.
  const schemaId = `tool-faq-${heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}`;
  useFaqSchema(faqs, schemaId);

  return (
    <section
      className="relative bg-stone-50 dark:bg-stone-950 border-t-2 border-stone-200 dark:border-stone-800 py-16 sm:py-20"
      aria-labelledby="tool-seo-heading"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading + intro */}
        <header className="mb-10 sm:mb-14 text-center">
          <h2
            id="tool-seo-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 mb-4"
          >
            {heading}
          </h2>
          <p className="text-base sm:text-lg text-stone-700 dark:text-stone-300 leading-relaxed max-w-2xl mx-auto">
            {intro}
          </p>
        </header>

        {/* How to use — numbered steps */}
        <div className="mb-12">
          <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-50 mb-6">
            How to use it
          </h3>
          <ol className="space-y-4">
            {steps.map((s, i) => (
              <li
                key={i}
                className="flex gap-4 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5"
              >
                <span
                  className="flex-shrink-0 w-9 h-9 rounded-full text-white font-extrabold flex items-center justify-center text-base"
                  style={{ backgroundColor: accent }}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div>
                  <h4 className="font-extrabold text-stone-900 dark:text-stone-50 mb-1">{s.title}</h4>
                  <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-[15px]">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Use cases — when you'd use it */}
        <div className="mb-12">
          <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-50 mb-6">
            When you'd use this
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {useCases.map((u, i) => (
              <div
                key={i}
                className="rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5"
              >
                <h4
                  className="font-extrabold mb-2 text-[15px]"
                  style={{ color: accent }}
                >
                  {u.title}
                </h4>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-[14px]">
                  {u.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Optional closing copy */}
        {closing && (
          <div className="mb-12 rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6">
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-[15px]">
              {closing}
            </p>
          </div>
        )}

        {/* FAQ — accordion. Also injected as FAQPage JSON-LD above. */}
        <div className="mb-12">
          <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-50 mb-6">
            Frequently asked questions
          </h3>
          <div className="space-y-3">
            {faqs.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-3 text-left p-5 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors"
                  >
                    <span className="font-extrabold text-stone-900 dark:text-stone-50 text-[15px] sm:text-base">
                      {f.question}
                    </span>
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full text-white text-sm font-extrabold flex items-center justify-center transition-transform"
                      style={{
                        backgroundColor: accent,
                        transform: isOpen ? 'rotate(45deg)' : 'rotate(0)',
                      }}
                      aria-hidden
                    >
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 -mt-1 text-stone-700 dark:text-stone-300 leading-relaxed text-[14px]">
                      {f.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Related tools — internal linking for SEO + UX */}
        {related.length > 0 && (
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-50 mb-6">
              Related free tools
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {related.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onNavigate(r.page)}
                  className="text-left rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 hover:border-[#A560E8] dark:hover:border-[#A560E8] transition-colors group"
                >
                  <div
                    className="font-extrabold text-stone-900 dark:text-stone-50 mb-1 group-hover:text-[#A560E8] transition-colors text-[15px]"
                  >
                    {r.label}
                  </div>
                  <div className="text-[13px] text-stone-600 dark:text-stone-400 leading-snug">
                    {r.teaser}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ToolPageSeoContent;
