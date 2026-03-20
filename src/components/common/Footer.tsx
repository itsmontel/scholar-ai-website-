import React from 'react';
import ScholarMascot from './ScholarMascot';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-stone-300 dark:border-stone-700 bg-stone-800 dark:bg-stone-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Logo and Description */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2.5 mb-4">
              <div className="flex-shrink-0">
                <ScholarMascot size={36} animated={false} pose="default" />
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
            <h4 className="font-semibold text-white mb-4 text-sm">Product</h4>
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
            <h4 className="font-semibold text-white mb-4 text-sm">Free Tools</h4>
            <ul className="space-y-3">
              <li>
                <a href="/tools/citation-generator" onClick={(e) => { e.preventDefault(); onNavigate?.('citation-generator-tool'); }} className="text-stone-400 hover:text-white text-sm transition-colors">
                  Citation Generator
                </a>
              </li>
              <li>
                <a href="/tools/word-counter" onClick={(e) => { e.preventDefault(); onNavigate?.('word-counter'); }} className="text-stone-400 hover:text-white text-sm transition-colors">
                  Word Counter
                </a>
              </li>
              <li>
                <a href="/tools/grammar-checker" onClick={(e) => { e.preventDefault(); onNavigate?.('grammar-checker'); }} className="text-stone-400 hover:text-white text-sm transition-colors">
                  Grammar Checker
                </a>
              </li>
              <li>
                <a href="/tools/readability-score" onClick={(e) => { e.preventDefault(); onNavigate?.('readability-score'); }} className="text-stone-400 hover:text-white text-sm transition-colors">
                  Readability Checker
                </a>
              </li>
              <li>
                <a href="/tools/thesis-generator" onClick={(e) => { e.preventDefault(); onNavigate?.('thesis-generator'); }} className="text-stone-400 hover:text-white text-sm transition-colors">
                  Thesis Generator
                </a>
              </li>
              <li>
                <a href="/tools/essay-outline" onClick={(e) => { e.preventDefault(); onNavigate?.('essay-outline'); }} className="text-stone-400 hover:text-white text-sm transition-colors">
                  Essay Outline
                </a>
              </li>
              <li>
                <a href="/tools/text-case-converter" onClick={(e) => { e.preventDefault(); onNavigate?.('text-case-converter'); }} className="text-stone-400 hover:text-white text-sm transition-colors">
                  Case Converter
                </a>
              </li>
              <li>
                <a href="/tools/paraphrasing-tips" onClick={(e) => { e.preventDefault(); onNavigate?.('paraphrasing-tips'); }} className="text-stone-400 hover:text-white text-sm transition-colors">
                  Paraphrasing Tips
                </a>
              </li>
              <li>
                <a href="/tools/gpa-calculator" onClick={(e) => { e.preventDefault(); onNavigate?.('gpa-calculator'); }} className="text-stone-400 hover:text-white text-sm transition-colors">
                  GPA Calculator
                </a>
              </li>
              <li>
                <a href="/tools/pomodoro-timer" onClick={(e) => { e.preventDefault(); onNavigate?.('pomodoro-timer'); }} className="text-stone-400 hover:text-white text-sm transition-colors">
                  Pomodoro Timer
                </a>
              </li>
              <li>
                <a href="/tools/calculator" onClick={(e) => { e.preventDefault(); onNavigate?.('calculator'); }} className="text-stone-400 hover:text-white text-sm transition-colors">
                  Scientific Calculator
                </a>
              </li>
              <li>
                <a href="/tools/converter" onClick={(e) => { e.preventDefault(); onNavigate?.('converter'); }} className="text-stone-400 hover:text-white text-sm transition-colors">
                  Unit Converter
                </a>
              </li>
            </ul>
          </div>

          {/* AI Tools Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm flex items-center gap-2">
              <ScholarMascot size={24} animated={false} pose="default" />
              AI Tools
            </h4>
            <ul className="space-y-3">
              {/* Rose/Pink */}
              <li>
                <a href="/tools/analyze" onClick={(e) => { e.preventDefault(); onNavigate?.('analyze'); }} className="text-sm font-medium transition-colors flex items-center gap-1.5 text-rose-400 hover:text-rose-300">
                  Analyze Essay
                  <span className="text-xs opacity-75">📊</span>
                </a>
              </li>
              {/* Teal/Blues */}
              <li>
                <a href="/tools/citations" onClick={(e) => { e.preventDefault(); onNavigate?.('citations'); }} className="text-sky-400 hover:text-sky-300 text-sm font-medium transition-colors flex items-center gap-1.5">
                  Citations Finder
                  <span className="text-xs opacity-75">📚</span>
                </a>
              </li>
              <li>
                <a href="/tools/summarizer" onClick={(e) => { e.preventDefault(); onNavigate?.('summarizer'); }} className="text-teal-400 hover:text-teal-300 text-sm font-medium transition-colors flex items-center gap-1.5">
                  AI Summarizer
                  <span className="text-xs opacity-75">📝</span>
                </a>
              </li>
              {/* Violets/Purples */}
              <li>
                <a href="/tools/crater-blast" onClick={(e) => { e.preventDefault(); onNavigate?.('crater-blast'); }} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors flex items-center gap-1.5">
                  Crater Blast
                  <span className="text-xs opacity-75">💥</span>
                </a>
              </li>
              {/* Ambers/Oranges */}
              <li>
                <a href="/tools/quiz-generator" onClick={(e) => { e.preventDefault(); onNavigate?.('quiz-generator'); }} className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors flex items-center gap-1.5">
                  AI Quiz Generator
                  <span className="text-xs opacity-75">📝</span>
                </a>
              </li>
              <li>
                <a href="/tools/create-flashcards" onClick={(e) => { e.preventDefault(); onNavigate?.('create-flashcards'); }} className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors flex items-center gap-1.5">
                  Flashcards
                  <span className="text-xs opacity-75">🃏</span>
                </a>
              </li>
            </ul>
          </div>
          
          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Support</h4>
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
            <h4 className="font-semibold text-white mb-4 text-sm">Legal</h4>
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
        
        {/* Bottom Bar */}
        <div className="pt-8 border-t flex justify-center" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
          <p className="text-stone-500 text-sm">
            © 2026 WriteScholar. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
