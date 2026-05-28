import { useEffect, useMemo, useState } from 'react';
import { HIDE_FRIENDS } from '../../config/featureFlags';
import LandingScrollReveal from './LandingScrollReveal';
import LandingSectionBackdrop from './LandingSectionBackdrop';

const LANDING_FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: 'Can I actually write my essay in WriteScholar?',
    answer:
      "Yes, that's the main thing it does. You write, paste, or import a Word doc into a real editor with headings, bold, italics, tables and images. As you write, professor-style feedback shows up next to your draft, and you can drop a suggested fix straight into the text with one click. It autosaves as you go, and you export a clean Word document when you're done.",
  },
  {
    question: 'What kind of feedback will I get on my essay?',
    answer:
      'Line-by-line notes colour-coded green for strong, amber for needs work, and red for serious concerns, plus an estimated grade with a full rubric covering thesis, evidence, structure, clarity and academic style, and specific rewrite suggestions you can apply. It reads your draft the way a marker would.',
  },
  {
    question: 'How does the analyzer work?',
    answer:
      'Write in the editor, paste your essay, or upload a PDF, DOCX or TXT. The AI grades structure, argument, clarity, citations and academic tone the way a professor would and gives you an estimated grade out of 100 with a letter band and detailed notes, usually in under a minute.',
  },
  {
    question: 'How accurate is the grade? Is it my real grade?',
    answer:
      "It's an AI estimate, not your official grade. It uses the same rubric weights professors mark with and in practice lands within a few points of real scores. Use it to find and fix the weak spots before you hand in, not as a guarantee of what you'll get.",
  },
  {
    question: 'Can I import a Word or PDF, and export it back?',
    answer:
      "Yes. Import a .docx and your bold, italics, headings and paragraphs carry over. PDF and TXT come in as clean text. When you're finished, export back to a properly formatted Word document with no reformatting on your end.",
  },
  {
    question: 'Is WriteScholar for college and university students?',
    answer:
      "Yes, it's built for undergrad and postgrad coursework worldwide, UK or US. Set your education level so the feedback fits your course. We support the major citation styles (APA, MLA, Chicago, Harvard, IEEE, Vancouver), and there are high school options too.",
  },
  {
    question: 'How long does an analysis take?',
    answer:
      'Usually under 60 seconds. Write or paste your essay, hit Analyze, and you get the rubric, the estimated grade and a ranked fix list. The free plan includes 2 analyses a month.',
  },
  {
    question: 'Can I also turn my notes into study tools?',
    answer:
      'Yes. Alongside the writing workspace, Study Pack turns any notes into flashcards, quizzes, crosswords and arcade mode. Free users get lessons and flashcards; the rest unlocks with Pro.',
  },
  {
    question: 'What citation styles are supported?',
    answer:
      "APA 7th, MLA 9th, Chicago (notes-bibliography and author-date), Harvard, IEEE and Vancouver. There's also a citation finder that pulls relevant academic sources for your topic.",
  },
  {
    question: 'Is my content private and secure?',
    answer:
      'Yes. Your work is encrypted, never sold or used to train AI models, and you can delete any document whenever you want.',
  },
  {
    question: "What's the difference between Free, Pro and Premium?",
    answer:
      'Free: 3 documents, 2 analyses and 2 study packs a month. Pro: 99 combined analyses, study packs and citations a month, apply WriteScholar revisions into your draft, all citation styles, PDF and Word export, uploads up to 100MB, and the full study tools. Premium: 5x the Pro usage at 499 actions a month, unlimited research-paper summarising, and 1GB of library storage.',
  },
  {
    question: 'How do I add friends and share my study materials?',
    answer:
      'Every account gets a unique friend code. Share it so people can add you. Once connected, you can send flashcards, quizzes, crosswords or notes with one tap, they tap Accept, and it lands in their library. Core sharing is free.',
  },
];

export default function LandingFAQSection() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqs = useMemo(
    () => LANDING_FAQ_ITEMS.filter((faq) => !HIDE_FRIENDS || !faq.question.toLowerCase().includes('friends')),
    [],
  );

  useEffect(() => {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(faqSchema);
    script.id = 'faq-schema-landing-writescholar';
    document.head.appendChild(script);
    return () => {
      document.getElementById('faq-schema-landing-writescholar')?.remove();
    };
  }, [faqs]);

  return (
    <section
      id="faq"
      className="relative w-full py-16 sm:py-24 lg:py-28 overflow-hidden scroll-mt-20"
      aria-labelledby="landing-faq-heading"
    >
      <LandingSectionBackdrop
        base="bg-[#FCFBF7] dark:bg-stone-950"
        bottomTo="from-[#F3EAFF]/80 dark:from-[#1A0B2E]/80"
        radial="bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(165,96,232,0.08),transparent_60%)]"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingScrollReveal>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-10 mb-10 sm:mb-14">
            <div className="text-center lg:text-left flex-1 max-w-2xl mx-auto lg:mx-0">
              <div className="inline-flex items-center gap-2 mb-5 rounded-full border-2 border-[#A560E8]/40 bg-[#F3EAFF] dark:bg-[#A560E8]/15 px-3.5 py-1.5 shadow-[0_0_12px_rgba(165,96,232,0.25)]">
                <svg className="w-3.5 h-3.5 text-[#A560E8]" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.18em] text-[#7733B5] dark:text-[#C9A0F0]">
                  Help
                </span>
              </div>
              <h2
                id="landing-faq-heading"
                className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#3C3C3C] dark:text-white tracking-tight leading-[1.1] mb-4"
                style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
              >
                Frequently Asked{' '}
                <span className="relative inline-block text-[#A560E8]">
                  Questions
                  <svg
                    className="absolute -bottom-1.5 left-0 w-full h-2 text-[#A560E8]"
                    viewBox="0 0 200 8"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <path d="M2 6 Q50 1 100 5 T198 4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </span>
              </h2>
              <p className="text-sm sm:text-base text-[#777] dark:text-stone-300 leading-relaxed">
                Essay feedback, citations, and study tools for college and university coursework.
              </p>
            </div>

            <div className="hidden lg:flex flex-shrink-0 items-center justify-center pt-2">
              <div className="relative">
                <div className="pointer-events-none absolute -inset-6 rounded-full bg-[#A560E8]/20 blur-2xl" aria-hidden />
                <img
                  src="/mascot-thinking.webp"
                  alt=""
                  aria-hidden
                  loading="lazy"
                  decoding="async"
                  className="relative w-40 xl:w-48 h-auto drop-shadow-[0_18px_30px_rgba(165,96,232,0.35)]"
                />
              </div>
            </div>
          </div>

          <div className="relative rounded-3xl border-2 border-[#D8B4FE]/70 bg-white/70 dark:bg-[#2A0E40]/40 shadow-[0_0_60px_-20px_rgba(165,96,232,0.35)] p-4 sm:p-5 lg:p-6 backdrop-blur-sm max-w-4xl mx-auto">
            <div className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 rounded-full bg-[#A560E8]/15 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-[#58CC02]/10 blur-3xl" aria-hidden />

            <div className="relative space-y-3 sm:space-y-4">
              {faqs.map((faq, idx) => {
                const isOpen = openFAQ === idx;
                return (
                  <div
                    key={faq.question}
                    className={`rounded-2xl border-2 border-b-4 bg-white dark:bg-stone-900 overflow-hidden transition-all duration-200 ${
                      isOpen
                        ? 'border-[#A560E8] shadow-[0_12px_32px_-12px_rgba(165,96,232,0.45)]'
                        : 'border-[#E5E5E5] dark:border-stone-700 shadow-[0_8px_24px_-14px_rgba(0,0,0,0.12)] hover:border-[#A560E8]/50 hover:-translate-y-0.5'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFAQ(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className={`w-full min-w-0 px-5 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between gap-3 sm:gap-4 transition-colors duration-200 ${
                        isOpen ? 'bg-[#F3EAFF]/60 dark:bg-[#A560E8]/10' : 'hover:bg-[#FAF7FF]/80 dark:hover:bg-stone-800/50'
                      }`}
                    >
                      <span
                        className={`font-extrabold text-base sm:text-[1.05rem] leading-snug pr-2 min-w-0 flex-1 text-left ${
                          isOpen ? 'text-[#7733B5] dark:text-[#C9A0F0]' : 'text-[#3C3C3C] dark:text-stone-100'
                        }`}
                        style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
                      >
                        {faq.question}
                      </span>
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-b-[3px] transition-all duration-200 ${
                          isOpen
                            ? 'border-[#7733B5] bg-[#A560E8] text-white rotate-180'
                            : 'border-[#E5E5E5] dark:border-stone-700 bg-[#FAF7FF] dark:bg-stone-800 text-[#A560E8]'
                        }`}
                        aria-hidden
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ease-out ${isOpen ? 'max-h-[min(28rem,70vh)]' : 'max-h-0'}`}>
                      <div className="px-5 sm:px-6 pb-5 pt-0 text-[#555] dark:text-stone-300 text-sm sm:text-base leading-relaxed border-t-2 border-[#F3EAFF] dark:border-stone-800">
                        <div className="pt-4">{faq.answer}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
