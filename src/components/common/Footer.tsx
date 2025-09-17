import React from 'react';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="relative bg-gray-50 py-48 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-6 pt-4">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Logo and Copyright - Top Left */}
          <div className="md:col-span-1 -mt-20">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Scholar</span>
            </div>
            <p className="text-gray-600 text-sm font-medium">© 2025 Scholar. All rights reserved.</p>
          </div>
          
          {/* Company Links */}
          <div className="-mt-20 text-right">
            <h4 className="font-semibold text-gray-900 mb-6 text-lg">Company</h4>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => onNavigate?.('pricing')} 
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors font-medium"
                >
                  Pricing
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate?.('help')} 
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors font-medium"
                >
                  FAQ
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate?.('contact')} 
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors font-medium"
                >
                  Contact Us
                </button>
              </li>
            </ul>
          </div>
          
          {/* Legal Links */}
          <div className="-mt-20 text-right">
            <h4 className="font-semibold text-gray-900 mb-6 text-lg">Legal</h4>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => onNavigate?.('terms')} 
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors font-medium"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate?.('privacy')} 
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors font-medium"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate?.('contact')} 
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors font-medium"
                >
                  Contact Support
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Large Scholar Watermark - Positioned to show 66.6% of the word */}
      <div className="absolute bottom-0 left-0 right-0 h-3/4 flex items-end justify-center pointer-events-none overflow-hidden">
        <div className="text-[20rem] font-bold text-gray-100/30 select-none leading-none" style={{
          background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 50%, #9ca3af 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          transform: 'translateY(33.4%)'
        }}>
          Scholar
        </div>
      </div>
    </footer>
  );
};

export default Footer;
