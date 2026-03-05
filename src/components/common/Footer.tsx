import React from 'react';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-stone-200" style={{ background: 'linear-gradient(180deg, #F5F3F0 0%, #FAF8F5 100%)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Logo and Description */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2.5 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <span className="text-xl font-bold text-stone-800">WriteScholar</span>
            </div>
            <p className="text-stone-500 text-sm leading-relaxed">
              AI-powered academic writing assistant helping students and researchers achieve excellence.
            </p>
          </div>
          
          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-stone-800 mb-4 text-sm">Product</h4>
            <ul className="space-y-3">
              <li>
                <a href="/features" onClick={(e) => { e.preventDefault(); onNavigate?.('features'); }} className="text-stone-500 hover:text-stone-900 text-sm transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="/why-students-choose" onClick={(e) => { e.preventDefault(); onNavigate?.('why-students-choose'); }} className="text-stone-500 hover:text-stone-900 text-sm transition-colors">
                  Why Students Choose
                </a>
              </li>
              <li>
                <a href="/pricing" onClick={(e) => { e.preventDefault(); onNavigate?.('pricing'); }} className="text-stone-500 hover:text-stone-900 text-sm transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/blog" onClick={(e) => { e.preventDefault(); onNavigate?.('blog'); }} className="text-lime-600 hover:text-lime-700 text-sm font-medium transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Free Tools Links */}
          <div>
            <h4 className="font-semibold text-stone-800 mb-4 text-sm">Free Tools</h4>
            <ul className="space-y-3">
              <li>
                <a href="/tools/word-counter" onClick={(e) => { e.preventDefault(); onNavigate?.('word-counter'); }} className="text-stone-500 hover:text-stone-900 text-sm transition-colors">
                  Word Counter
                </a>
              </li>
              <li>
                <a href="/tools/citation-generator" onClick={(e) => { e.preventDefault(); onNavigate?.('citation-generator-tool'); }} className="text-stone-500 hover:text-stone-900 text-sm transition-colors">
                  Citation Generator
                </a>
              </li>
              <li>
                <a href="/tools/grammar-checker" onClick={(e) => { e.preventDefault(); onNavigate?.('grammar-checker'); }} className="text-stone-500 hover:text-stone-900 text-sm transition-colors">
                  Grammar Checker
                </a>
              </li>
              <li>
                <a href="/tools/readability-score" onClick={(e) => { e.preventDefault(); onNavigate?.('readability-score'); }} className="text-stone-500 hover:text-stone-900 text-sm transition-colors">
                  Readability Checker
                </a>
              </li>
              <li>
                <a href="/tools/thesis-generator" onClick={(e) => { e.preventDefault(); onNavigate?.('thesis-generator'); }} className="text-stone-500 hover:text-stone-900 text-sm transition-colors">
                  Thesis Generator
                </a>
              </li>
              <li>
                <a href="/tools/essay-outline" onClick={(e) => { e.preventDefault(); onNavigate?.('essay-outline'); }} className="text-stone-500 hover:text-stone-900 text-sm transition-colors">
                  Essay Outline
                </a>
              </li>
              <li>
                <a href="/tools/text-case-converter" onClick={(e) => { e.preventDefault(); onNavigate?.('text-case-converter'); }} className="text-stone-500 hover:text-stone-900 text-sm transition-colors">
                  Case Converter
                </a>
              </li>
              <li>
                <a href="/tools/paraphrasing-tips" onClick={(e) => { e.preventDefault(); onNavigate?.('paraphrasing-tips'); }} className="text-stone-500 hover:text-stone-900 text-sm transition-colors">
                  Paraphrasing Tips
                </a>
              </li>
              <li>
                <a href="/tools/gpa-calculator" onClick={(e) => { e.preventDefault(); onNavigate?.('gpa-calculator'); }} className="text-stone-500 hover:text-stone-900 text-sm transition-colors">
                  GPA Calculator
                </a>
              </li>
              <li>
                <a href="/tools/pomodoro-timer" onClick={(e) => { e.preventDefault(); onNavigate?.('pomodoro-timer'); }} className="text-stone-500 hover:text-stone-900 text-sm transition-colors">
                  Pomodoro Timer
                </a>
              </li>
            </ul>
          </div>

          {/* AI Tools Links */}
          <div>
            <h4 className="font-semibold text-stone-800 mb-4 text-sm flex items-center gap-2">
              AI Tools
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="/tools/analyze" onClick={(e) => { e.preventDefault(); onNavigate?.('analyze'); }} className="text-lime-600 hover:text-lime-700 text-sm font-medium transition-colors flex items-center gap-1.5">
                  Analyze Essay
                  <span className="text-xs opacity-75">📊</span>
                </a>
              </li>
              <li>
                <a href="/tools/citations" onClick={(e) => { e.preventDefault(); onNavigate?.('citations'); }} className="text-sm font-medium transition-colors flex items-center gap-1.5 hover:opacity-80" style={{ color: '#22A7AB' }}>
                  Citations Finder
                  <span className="text-xs opacity-75">📚</span>
                </a>
              </li>
              <li>
                <a href="/tools/humanizer" onClick={(e) => { e.preventDefault(); onNavigate?.('humanizer'); }} className="text-violet-600 hover:text-violet-700 text-sm font-medium transition-colors flex items-center gap-1.5">
                  AI Humanizer
                  <span className="text-xs opacity-75">✨</span>
                </a>
              </li>
              <li>
                <a href="/tools/summarizer" onClick={(e) => { e.preventDefault(); onNavigate?.('summarizer'); }} className="text-teal-600 hover:text-teal-700 text-sm font-medium transition-colors flex items-center gap-1.5">
                  AI Summarizer
                  <span className="text-xs opacity-75">📝</span>
                </a>
              </li>
              <li>
                <a href="/tools/quiz-generator" onClick={(e) => { e.preventDefault(); onNavigate?.('quiz-generator'); }} className="text-amber-600 hover:text-amber-700 text-sm font-medium transition-colors flex items-center gap-1.5">
                  AI Quiz Generator
                  <span className="text-xs opacity-75">📝</span>
                </a>
              </li>
              <li>
                <a href="/tools/flashcard-generator" onClick={(e) => { e.preventDefault(); onNavigate?.('flashcard-generator'); }} className="text-amber-600 hover:text-amber-700 text-sm font-medium transition-colors flex items-center gap-1.5">
                  AI Flashcard Generator
                  <span className="text-xs opacity-75">🃏</span>
                </a>
              </li>
              <li>
                <a href="/tools/crossword-generator" onClick={(e) => { e.preventDefault(); onNavigate?.('crossword-generator'); }} className="text-amber-600 hover:text-amber-700 text-sm font-medium transition-colors flex items-center gap-1.5">
                  AI Crossword Generator
                  <span className="text-xs opacity-75">🧩</span>
                </a>
              </li>
            </ul>
          </div>
          
          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-stone-800 mb-4 text-sm">Support</h4>
            <ul className="space-y-3">
              <li>
                <a href="/help" onClick={(e) => { e.preventDefault(); onNavigate?.('help'); }} className="text-stone-500 hover:text-stone-900 text-sm transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="/contact" onClick={(e) => { e.preventDefault(); onNavigate?.('contact'); }} className="text-stone-500 hover:text-stone-900 text-sm transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="/about" onClick={(e) => { e.preventDefault(); onNavigate?.('about'); }} className="text-stone-500 hover:text-stone-900 text-sm transition-colors">
                  About
                </a>
              </li>
            </ul>
          </div>
          
          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-stone-800 mb-4 text-sm">Legal</h4>
            <ul className="space-y-3">
              <li>
                <a href="/terms" onClick={(e) => { e.preventDefault(); onNavigate?.('terms'); }} className="text-stone-500 hover:text-stone-900 text-sm transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/privacy" onClick={(e) => { e.preventDefault(); onNavigate?.('privacy'); }} className="text-stone-500 hover:text-stone-900 text-sm transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="pt-8 border-t border-stone-200 flex justify-center">
          <p className="text-stone-400 text-sm">
            © 2026 WriteScholar. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
