import React, { useState } from 'react';

interface NewsletterSubscriptionProps {
  variant?: 'blog' | 'footer';
}

const NewsletterSubscription: React.FC<NewsletterSubscriptionProps> = ({ variant = 'blog' }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/email-subscriptions/newsletter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Unable to subscribe. Please try again later.');
    }
  };

  if (variant === 'blog') {
    return (
      <div className="mt-12 mb-8 p-8 bg-[#F3EAFF] dark:bg-[#A560E8]/10 rounded-2xl border-2 border-b-4 border-[#A560E8]/30 dark:border-[#A560E8]/30" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
        <div className="text-center max-w-md mx-auto">
          <div className="w-14 h-14 bg-white dark:bg-stone-800 rounded-2xl border-2 border-b-4 border-[#A560E8]/30 flex items-center justify-center mx-auto mb-4">
            <img src="/mascot-celebrating.webp" alt="Newsletter mascot" className="w-10 h-10 object-contain" />
          </div>
          <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 mb-2">Subscribe to Our Newsletter</h3>
          <p className="text-stone-600 dark:text-stone-400 text-sm mb-6">
            Get the latest study tips, writing guides, and product updates delivered to your inbox.
          </p>
          
          {status === 'success' ? (
            <div className="flex items-center justify-center space-x-2 text-[#A560E8] bg-[#F3EAFF] dark:bg-[#A560E8]/20 py-3 px-4 rounded-xl border-2 border-[#A560E8]/30">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">{message}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 border-2 border-stone-200 dark:border-stone-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A560E8]/40 focus:border-[#A560E8] bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm"
                  disabled={status === 'loading'}
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-6 py-3 bg-[#A560E8] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#7733B5] hover:bg-[#9450D8] active:border-b-2 active:translate-y-0.5 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                >
                  {status === 'loading' ? (
                    <span className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Subscribing...</span>
                    </span>
                  ) : (
                    'Subscribe'
                  )}
                </button>
              </div>
              {status === 'error' && (
                <p className="text-red-600 text-sm">{message}</p>
              )}
              <p className="text-xs text-stone-500 dark:text-stone-400">
                No spam, unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default NewsletterSubscription;
