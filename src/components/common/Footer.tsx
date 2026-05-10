import React from 'react';
// ScholarMascot replaced with logo PNG

interface FooterProps {
  onNavigate?: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t-2 border-stone-200 dark:border-stone-700 bg-stone-800 dark:bg-stone-950" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Logo and Description */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2.5 mb-4">
              <div className="flex-shrink-0">
                <img src="/main-logo.png" alt="WriteScholar" className="w-9 h-9 object-contain" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                WriteScholar
              </span>
            </div>
            <p className="text-stone-400 text-sm leading-relaxed">
              AI essay feedback, study packs & Focus Mode. The all-in-one study app for students.
            </p>
          </div>
          
          {/* Product Links */}
          <div>
            <h4 className="font-extrabold text-white mb-4 text-sm uppercase tracking-wide">Product</h4>
            <ul className="space-y-3">
              <li>
                <a href="/features" onClick={(e) => { e.preventDefault(); onNavigate?.('features'); }} className="text-stone-400 hover:text-white text-sm transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="/focus-mode" onClick={(e) => { e.preventDefault(); onNavigate?.('focus-mode'); }} className="text-stone-400 hover:text-white text-sm transition-colors">
                  Focus Mode
                </a>
              </li>
              <li>
                <a href="/why-students-choose" onClick={(e) => { e.preventDefault(); onNavigate?.('why-students-choose'); }} className="text-stone-400 hover:text-white text-sm transition-colors">
                  Why Students Choose
                </a>
              </li>
              <li>
                <a href="/vs-quizlet-knowt" onClick={(e) => { e.preventDefault(); onNavigate?.('study-tools-comparison'); }} className="text-stone-400 hover:text-white text-sm transition-colors">
                  vs Quizlet & Knowt
                </a>
              </li>
              <li>
                <a href="/pricing" onClick={(e) => { e.preventDefault(); onNavigate?.('pricing'); }} className="text-stone-400 hover:text-white text-sm transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/blog" onClick={(e) => { e.preventDefault(); onNavigate?.('blog'); }} className="text-stone-400 hover:text-white text-sm transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Free Tools Links */}
          <div>
            <h4 className="font-extrabold text-white mb-4 text-sm uppercase tracking-wide">Free Tools</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="/tools/citation-generator"
                  title="Free APA, MLA, Chicago & Harvard citation generator for research papers"
                  onClick={(e) => { e.preventDefault(); onNavigate?.('citation-generator-tool'); }}
                  className="text-stone-400 hover:text-white text-sm transition-colors"
                >
                  Citation Generator
                </a>
              </li>
              <li>
                <a
                  href="/tools/word-counter"
                  title="Free word counter for essays — characters, reading time, word limits"
                  onClick={(e) => { e.preventDefault(); onNavigate?.('word-counter'); }}
                  className="text-stone-400 hover:text-white text-sm transition-colors"
                >
                  Word Counter
                </a>
              </li>
              <li>
                <a
                  href="/tools/grammar-checker"
                  title="Free grammar and spelling checker for college papers and assignments"
                  onClick={(e) => { e.preventDefault(); onNavigate?.('grammar-checker'); }}
                  className="text-stone-400 hover:text-white text-sm transition-colors"
                >
                  Grammar Checker
                </a>
              </li>
              <li>
                <a
                  href="/tools/readability-score"
                  title="Readability checker — Flesch-Kincaid and grade level for academic writing"
                  onClick={(e) => { e.preventDefault(); onNavigate?.('readability-score'); }}
                  className="text-stone-400 hover:text-white text-sm transition-colors"
                >
                  Readability Checker
                </a>
              </li>
              <li>
                <a
                  href="/tools/thesis-generator"
                  title="Thesis statement generator for argumentative and analytical essays"
                  onClick={(e) => { e.preventDefault(); onNavigate?.('thesis-generator'); }}
                  className="text-stone-400 hover:text-white text-sm transition-colors"
                >
                  Thesis Generator
                </a>
              </li>
              <li>
                <a
                  href="/tools/essay-outline"
                  title="Essay outline generator — argumentative, research, and compare-contrast papers"
                  onClick={(e) => { e.preventDefault(); onNavigate?.('essay-outline'); }}
                  className="text-stone-400 hover:text-white text-sm transition-colors"
                >
                  Essay Outline
                </a>
              </li>
              <li>
                <a
                  href="/tools/text-case-converter"
                  title="Text case converter — Title Case, sentence case, uppercase for headings"
                  onClick={(e) => { e.preventDefault(); onNavigate?.('text-case-converter'); }}
                  className="text-stone-400 hover:text-white text-sm transition-colors"
                >
                  Case Converter
                </a>
              </li>
              <li>
                <a
                  href="/tools/paraphrasing-tips"
                  title="Paraphrasing tips and wordiness checker for academic writing"
                  onClick={(e) => { e.preventDefault(); onNavigate?.('paraphrasing-tips'); }}
                  className="text-stone-400 hover:text-white text-sm transition-colors"
                >
                  Paraphrasing Tips
                </a>
              </li>
              <li>
                <a
                  href="/tools/gpa-calculator"
                  title="College GPA calculator — semester and cumulative on a 4.0 scale"
                  onClick={(e) => { e.preventDefault(); onNavigate?.('gpa-calculator'); }}
                  className="text-stone-400 hover:text-white text-sm transition-colors"
                >
                  GPA Calculator
                </a>
              </li>
              <li>
                <a
                  href="/tools/pomodoro-timer"
                  title="Pomodoro timer for focused study sessions and exam prep"
                  onClick={(e) => { e.preventDefault(); onNavigate?.('pomodoro-timer'); }}
                  className="text-stone-400 hover:text-white text-sm transition-colors"
                >
                  Pomodoro Timer
                </a>
              </li>
              <li>
                <a
                  href="/tools/calculator"
                  title="Free online scientific calculator — trig, logs, powers for STEM homework"
                  onClick={(e) => { e.preventDefault(); onNavigate?.('calculator'); }}
                  className="text-stone-400 hover:text-white text-sm transition-colors"
                >
                  Scientific Calculator
                </a>
              </li>
              <li>
                <a
                  href="/tools/converter"
                  title="Unit converter — length, weight, temperature, volume for labs and problem sets"
                  onClick={(e) => { e.preventDefault(); onNavigate?.('converter'); }}
                  className="text-stone-400 hover:text-white text-sm transition-colors"
                >
                  Unit Converter
                </a>
              </li>
            </ul>
          </div>

          {/* AI Tools Links */}
          <div>
            <h4 className="font-extrabold text-white mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
              <img src="/main-logo.png" alt="" width={24} height={24} className="w-6 h-6 object-contain" loading="lazy" />
              AI Tools
            </h4>
            <ul className="space-y-3">
              {/* Rose/Pink */}
              <li>
                <a href="/tools/analyze" onClick={(e) => { e.preventDefault(); onNavigate?.('analyze'); }} className="text-sm font-bold transition-colors flex items-center gap-1.5 text-[#FF4B4B] hover:text-[#FF6B6B]">
                  Analyze Essay
                  <span className="text-xs opacity-75">📊</span>
                </a>
              </li>
              {/* Study Pack / Citations */}
              <li>
                <a href="/tools/study-pack" onClick={(e) => { e.preventDefault(); onNavigate?.('study-pack'); }} className="text-[#FF9600] hover:text-[#FFB340] text-sm font-bold transition-colors flex items-center gap-1.5">
                  Study Pack
                  <span className="text-xs opacity-75">📦</span>
                </a>
              </li>
              <li>
                <a href="/tools/citations" onClick={(e) => { e.preventDefault(); onNavigate?.('citations'); }} className="text-[#1CB0F6] hover:text-[#4CC3FF] text-sm font-bold transition-colors flex items-center gap-1.5">
                  Citations Finder
                  <span className="text-xs opacity-75">📚</span>
                </a>
              </li>
              <li>
                <a href="/tools/summarizer" onClick={(e) => { e.preventDefault(); onNavigate?.('summarizer'); }} className="text-[#58CC02] hover:text-[#6EE020] text-sm font-bold transition-colors flex items-center gap-1.5">
                  AI Summarizer
                  <span className="text-xs opacity-75">📝</span>
                </a>
              </li>
              {/* Violets/Purples */}
              <li>
                <a href="/tools/crater-blast" onClick={(e) => { e.preventDefault(); onNavigate?.('crater-blast'); }} className="text-[#A560E8] hover:text-[#B87DEF] text-sm font-bold transition-colors flex items-center gap-1.5">
                  Crater Blast
                  <span className="text-xs opacity-75">💥</span>
                </a>
              </li>
              <li>
                <a href="/tools/word-tower" onClick={(e) => { e.preventDefault(); onNavigate?.('word-tower'); }} className="text-[#58CC02] hover:text-[#6EE020] text-sm font-bold transition-colors flex items-center gap-1.5">
                  Word Tower
                  <span className="text-xs opacity-75">🗼</span>
                </a>
              </li>
              <li>
                <a href="/word-blitz" onClick={(e) => { e.preventDefault(); onNavigate?.('word-blitz'); }} className="text-[#FF9600] hover:text-[#FFB340] text-sm font-bold transition-colors flex items-center gap-1.5">
                  Word Blitz
                  <span className="text-xs opacity-75">⚡</span>
                </a>
              </li>
              {/* Ambers/Oranges */}
              <li>
                <a href="/tools/quiz-generator" onClick={(e) => { e.preventDefault(); onNavigate?.('quiz-generator'); }} className="text-[#FF9600] hover:text-[#FFB340] text-sm font-bold transition-colors flex items-center gap-1.5">
                  AI Quiz Generator
                  <span className="text-xs opacity-75">📝</span>
                </a>
              </li>
              <li>
                <a href="/tools/create-flashcards" onClick={(e) => { e.preventDefault(); onNavigate?.('create-flashcards'); }} className="text-[#FF9600] hover:text-[#FFB340] text-sm font-bold transition-colors flex items-center gap-1.5">
                  Flashcards
                  <span className="text-xs opacity-75">🃏</span>
                </a>
              </li>
            </ul>
          </div>
          
          {/* Support Links */}
          <div>
            <h4 className="font-extrabold text-white mb-4 text-sm uppercase tracking-wide">Support</h4>
            <ul className="space-y-3">
              <li>
                <a href="/help" onClick={(e) => { e.preventDefault(); onNavigate?.('help'); }} className="text-stone-400 hover:text-white text-sm transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="/contact" onClick={(e) => { e.preventDefault(); onNavigate?.('contact'); }} className="text-stone-400 hover:text-white text-sm transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="/about" onClick={(e) => { e.preventDefault(); onNavigate?.('about'); }} className="text-stone-400 hover:text-white text-sm transition-colors">
                  About
                </a>
              </li>
            </ul>
          </div>
          
          {/* Legal Links */}
          <div>
            <h4 className="font-extrabold text-white mb-4 text-sm uppercase tracking-wide">Legal</h4>
            <ul className="space-y-3">
              <li>
                <a href="/terms" onClick={(e) => { e.preventDefault(); onNavigate?.('terms'); }} className="text-stone-400 hover:text-white text-sm transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/privacy" onClick={(e) => { e.preventDefault(); onNavigate?.('privacy'); }} className="text-stone-400 hover:text-white text-sm transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ─── Guides & Resources mega-section ───────────────────────────
            Internal-link footer block for the 30 programmatic SEO landing
            pages (/study/*, /alternatives/*, /guides/*, /best/*). Without
            this, those pages are SEO orphans — discoverable only by direct
            URL or Google search, never by clicking around the site. The
            block also gives Google a clear "internal link graph" to follow,
            which is one of the strongest signals for ranking related pages.

            Plain <a href> tags (not the SPA onNavigate handler) because:
              - Google crawler follows real <a href> internally without JS
              - Each programmatic page is prerendered to static HTML, so a
                full page load actually serves cached HTML fast
              - Avoids needing the SPA router to know about every URL
        ─── */}
        <div className="mb-10 pb-10 border-b border-stone-700">
          <h4 className="font-extrabold text-white mb-2 text-sm uppercase tracking-wide">Guides &amp; Resources</h4>
          <p className="text-stone-400 text-xs mb-6">Free study guides, tool comparisons, and writing tutorials for college students.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {/* Study by subject */}
            <div>
              <p className="text-stone-300 text-xs font-extrabold uppercase tracking-wider mb-3">Study by subject</p>
              <ul className="space-y-2">
                <li><a href="/study/biology" className="text-stone-400 hover:text-white text-sm transition-colors">Biology study tools</a></li>
                <li><a href="/study/chemistry" className="text-stone-400 hover:text-white text-sm transition-colors">Chemistry study tools</a></li>
                <li><a href="/study/anatomy" className="text-stone-400 hover:text-white text-sm transition-colors">Anatomy flashcards</a></li>
                <li><a href="/study/calculus" className="text-stone-400 hover:text-white text-sm transition-colors">Calculus help</a></li>
                <li><a href="/study/psychology" className="text-stone-400 hover:text-white text-sm transition-colors">Psychology study tools</a></li>
                <li><a href="/study/statistics" className="text-stone-400 hover:text-white text-sm transition-colors">Statistics study tools</a></li>
              </ul>
            </div>
            {/* Compare alternatives */}
            <div>
              <p className="text-stone-300 text-xs font-extrabold uppercase tracking-wider mb-3">Compare</p>
              <ul className="space-y-2">
                <li><a href="/alternatives/quizlet" className="text-stone-400 hover:text-white text-sm transition-colors">Quizlet alternative</a></li>
                <li><a href="/alternatives/course-hero" className="text-stone-400 hover:text-white text-sm transition-colors">Course Hero alternative</a></li>
                <li><a href="/alternatives/grammarly" className="text-stone-400 hover:text-white text-sm transition-colors">Grammarly alternative</a></li>
                <li><a href="/alternatives/chegg" className="text-stone-400 hover:text-white text-sm transition-colors">Chegg alternative</a></li>
                <li><a href="/alternatives/knowt" className="text-stone-400 hover:text-white text-sm transition-colors">Knowt alternative</a></li>
              </ul>
            </div>
            {/* Writing guides */}
            <div>
              <p className="text-stone-300 text-xs font-extrabold uppercase tracking-wider mb-3">Writing guides</p>
              <ul className="space-y-2">
                <li><a href="/guides/how-to-write-argumentative-essay" className="text-stone-400 hover:text-white text-sm transition-colors">How to write an argumentative essay</a></li>
                <li><a href="/guides/how-to-write-thesis-statement" className="text-stone-400 hover:text-white text-sm transition-colors">How to write a thesis statement</a></li>
                <li><a href="/guides/how-to-write-research-paper" className="text-stone-400 hover:text-white text-sm transition-colors">How to write a research paper</a></li>
                <li><a href="/guides/how-to-write-college-essay" className="text-stone-400 hover:text-white text-sm transition-colors">How to write a college essay</a></li>
                <li><a href="/guides/how-to-cite-sources-apa" className="text-stone-400 hover:text-white text-sm transition-colors">APA citation guide</a></li>
                <li><a href="/guides/how-to-write-analytical-essay" className="text-stone-400 hover:text-white text-sm transition-colors">How to write an analytical essay</a></li>
              </ul>
            </div>
            {/* Best for */}
            <div>
              <p className="text-stone-300 text-xs font-extrabold uppercase tracking-wider mb-3">Best for</p>
              <ul className="space-y-2">
                <li><a href="/best/ai-essay-grader-for-college" className="text-stone-400 hover:text-white text-sm transition-colors">Best AI essay grader for college</a></li>
                <li><a href="/best/flashcard-app-for-medical-school" className="text-stone-400 hover:text-white text-sm transition-colors">Best flashcard app for med school</a></li>
                <li><a href="/best/study-app-for-college" className="text-stone-400 hover:text-white text-sm transition-colors">Best study app for college</a></li>
                <li><a href="/best/quiz-maker-for-teachers" className="text-stone-400 hover:text-white text-sm transition-colors">Best quiz maker for teachers</a></li>
                <li><a href="/best/citation-generator" className="text-stone-400 hover:text-white text-sm transition-colors">Best citation generator</a></li>
                <li><a href="/press" className="text-stone-400 hover:text-white text-sm transition-colors">Press &amp; media kit</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* VivoResume — sister product (logo: public/Vivoresumemeta.png) */}
        <div className="mb-10 rounded-2xl border-2 border-b-4 border-stone-600 bg-stone-900 px-5 py-5 sm:px-6 sm:py-6 flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
          <a
            href="https://vivoresume.com"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-xl bg-white p-2.5 border-2 border-b-4 border-stone-200 transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02]/80"
          >
            <img
              src="/Vivoresumemeta.png"
              alt="VivoResume — AI resume feedback"
              className="h-11 w-auto max-h-12 max-w-[160px] object-contain object-left"
              width={160}
              height={48}
              loading="lazy"
              decoding="async"
            />
          </a>
          <div className="flex-1 text-center sm:text-left min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 mb-1.5">
              From the makers of WriteScholar
            </p>
            <a
              href="https://vivoresume.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-lg font-extrabold text-white hover:text-[#58CC02] transition-colors"
            >
              VivoResume
            </a>
            <p className="text-stone-400 text-sm mt-1.5 leading-relaxed max-w-md mx-auto sm:mx-0">
              AI resume feedback. See exactly what&apos;s holding your resume back.
            </p>
          </div>
          <a
            href="https://vivoresume.com"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center justify-center rounded-xl bg-[#58CC02] hover:bg-[#4CAF00] border-2 border-b-4 border-[#46A302] px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white active:border-b-2 active:translate-y-0.5 transition-all"
          >
            Try VivoResume
          </a>
        </div>
        
        {/* Bottom Bar */}
        <div
          className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6"
          style={{ borderColor: 'rgba(255,255,255,0.15)' }}
        >
          <p className="text-stone-500 text-sm text-center sm:text-left">
            © 2026 WriteScholar. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <a
              href="https://www.instagram.com/writescholar/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WriteScholar on Instagram"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-stone-600 text-stone-400 transition-all hover:bg-stone-700 hover:text-white hover:border-stone-500 active:translate-y-0.5"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a
              href="https://www.tiktok.com/@writescholar"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WriteScholar on TikTok"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-stone-600 text-stone-400 transition-all hover:bg-stone-700 hover:text-white hover:border-stone-500 active:translate-y-0.5"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
