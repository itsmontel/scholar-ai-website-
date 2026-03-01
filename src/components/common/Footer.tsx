import React from 'react';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Logo and Description */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2.5 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <span className="text-xl font-bold text-gray-900">WriteScholar</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              AI-powered academic writing assistant helping students and researchers achieve excellence.
            </p>
          </div>
          
          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-sm">Product</h4>
            <ul className="space-y-3">
              <li>
                <a href="/features" onClick={(e) => { e.preventDefault(); onNavigate?.('features'); }} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="/pricing" onClick={(e) => { e.preventDefault(); onNavigate?.('pricing'); }} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/blog" onClick={(e) => { e.preventDefault(); onNavigate?.('blog'); }} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Free Tools Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-sm">Free Tools</h4>
            <ul className="space-y-3">
              <li>
                <a href="/tools/word-counter" onClick={(e) => { e.preventDefault(); onNavigate?.('word-counter'); }} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  Free Word Counter
                </a>
              </li>
              <li>
                <a href="/tools/citation-generator" onClick={(e) => { e.preventDefault(); onNavigate?.('citation-generator-tool'); }} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  Free Citation Generator
                </a>
              </li>
              <li>
                <a href="/tools/grammar-checker" onClick={(e) => { e.preventDefault(); onNavigate?.('grammar-checker'); }} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  Free Grammar Checker
                </a>
              </li>
              <li>
                <a href="/tools/readability-score" onClick={(e) => { e.preventDefault(); onNavigate?.('readability-score'); }} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  Free Readability Checker
                </a>
              </li>
              <li>
                <a href="/tools/thesis-generator" onClick={(e) => { e.preventDefault(); onNavigate?.('thesis-generator'); }} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  Free Thesis Generator
                </a>
              </li>
              <li>
                <a href="/tools/essay-outline" onClick={(e) => { e.preventDefault(); onNavigate?.('essay-outline'); }} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  Free Essay Outline
                </a>
              </li>
              <li>
                <a href="/tools/text-case-converter" onClick={(e) => { e.preventDefault(); onNavigate?.('text-case-converter'); }} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  Free Case Converter
                </a>
              </li>
              <li>
                <a href="/tools/paraphrasing-tips" onClick={(e) => { e.preventDefault(); onNavigate?.('paraphrasing-tips'); }} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  Free Paraphrasing Tips
                </a>
              </li>
            </ul>
          </div>
          
          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-sm">Support</h4>
            <ul className="space-y-3">
              <li>
                <a href="/help" onClick={(e) => { e.preventDefault(); onNavigate?.('help'); }} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="/contact" onClick={(e) => { e.preventDefault(); onNavigate?.('contact'); }} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="/about" onClick={(e) => { e.preventDefault(); onNavigate?.('about'); }} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  About
                </a>
              </li>
            </ul>
          </div>
          
          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-sm">Legal</h4>
            <ul className="space-y-3">
              <li>
                <a href="/terms" onClick={(e) => { e.preventDefault(); onNavigate?.('terms'); }} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/privacy" onClick={(e) => { e.preventDefault(); onNavigate?.('privacy'); }} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 flex justify-center">
          <p className="text-gray-400 text-sm">
            © 2026 WriteScholar. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
