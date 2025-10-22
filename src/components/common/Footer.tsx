import React from 'react';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="relative bg-gray-50 py-16 sm:py-24 md:py-32 lg:py-48 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
          {/* Logo and Copyright */}
          <div className="md:col-span-1 sm:-mt-8 md:-mt-12 lg:-mt-20">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl sm:text-2xl">W</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-gray-900">WriteScholar</span>
            </div>
            <p className="text-gray-600 text-sm font-medium">© 2025 WriteScholar. All rights reserved.</p>
          </div>
          
          {/* Company Links */}
          <div className="sm:-mt-8 md:-mt-12 lg:-mt-20 sm:text-right">
            <h4 className="font-semibold text-gray-900 mb-4 sm:mb-6 text-base sm:text-lg">Company</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <button 
                  onClick={() => onNavigate?.('pricing')} 
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors font-medium block"
                >
                  Pricing
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate?.('help')} 
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors font-medium block"
                >
                  FAQ
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate?.('contact')} 
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors font-medium block"
                >
                  Contact Us
                </button>
              </li>
            </ul>
          </div>
          
          {/* Legal Links */}
          <div className="sm:-mt-8 md:-mt-12 lg:-mt-20 sm:text-right md:col-span-1 sm:col-span-2 md:col-span-1">
            <h4 className="font-semibold text-gray-900 mb-4 sm:mb-6 text-base sm:text-lg">Legal</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <button 
                  onClick={() => onNavigate?.('terms')} 
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors font-medium block"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate?.('privacy')} 
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors font-medium block"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate?.('contact')} 
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors font-medium block"
                >
                  Contact Support
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Large WriteScholar Watermark - Responsive */}
      <div className="absolute bottom-0 left-0 right-0 h-2/3 sm:h-3/4 flex items-end justify-center pointer-events-none overflow-hidden">
        <div className="text-6xl sm:text-8xl md:text-9xl lg:text-[12rem] xl:text-[16rem] 2xl:text-[20rem] font-bold text-gray-100/20 sm:text-gray-100/30 select-none leading-none" style={{
          background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 50%, #9ca3af 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          transform: 'translateY(33.4%)'
        }}>
          WriteScholar
        </div>
      </div>
    </footer>
  );
};

export default Footer;
