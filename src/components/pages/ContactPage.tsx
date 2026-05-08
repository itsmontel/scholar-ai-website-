import Header from '../common/Header';
import Footer from '../common/Footer';

interface User {
  name: string;
  email: string;
  plan: string;
}

interface ContactPageProps {
  onNavigate: (page: string) => void;
  user: User | null;
  onLogout: () => void;
}

const ContactPage = ({ onNavigate, user, onLogout }: ContactPageProps) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden transition-colors bg-stone-50 dark:bg-stone-950" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="contact" />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Page Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-flex items-center px-4 py-2 bg-[#DDF4FF] dark:bg-[#1CB0F6]/20 text-[#1899D6] dark:text-[#1CB0F6] rounded-full text-sm font-extrabold mb-6 border-2 border-[#1CB0F6]/30 dark:border-[#1CB0F6]/40">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            GET IN TOUCH
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-4 tracking-tight">
            Contact <span className="text-[#A560E8]">WriteScholar</span>
          </h1>
          <p className="text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto font-semibold">
            Have questions or need support? We're here to help you succeed with your academic writing.
          </p>
        </div>

        {/* How to Contact Us */}
        <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 mb-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#F3EAFF] dark:bg-[#A560E8]/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-[#A560E8]/30">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#A560E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 dark:text-stone-100 mb-3">Get in Touch</h2>
            <p className="text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
              Send us an email directly and we'll respond within 24 hours. Choose the appropriate subject line for faster assistance.
            </p>
          </div>

          {/* Email Address */}
          <div className="bg-[#F3EAFF] dark:bg-[#A560E8]/10 border-2 border-[#A560E8]/30 dark:border-[#8A48C7]/40 rounded-xl p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wide">Email Address</h3>
                <p className="text-xl sm:text-2xl font-extrabold text-[#A560E8]">support@writescholar.com</p>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1 font-semibold">We respond within 24 hours</p>
              </div>
              <button
                onClick={() => copyToClipboard('support@writescholar.com')}
                className="shrink-0 inline-flex items-center justify-center gap-2 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 px-4 py-2.5 rounded-xl border-2 border-b-4 border-stone-200 dark:border-stone-600 active:border-b-2 active:translate-y-0.5 transition-all font-extrabold uppercase tracking-wide text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
              </button>
            </div>
          </div>

          {/* Subject Line Templates */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wide">Recommended Subject Lines</h3>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Technical Support */}
              <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-4 hover:border-[#FF4B4B] dark:hover:border-[#FF4B4B] transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFE8E8] dark:bg-[#FF4B4B]/20 rounded-xl flex items-center justify-center shrink-0 border-2 border-[#FF4B4B]/30">
                    <svg className="w-5 h-5 text-[#FF4B4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-stone-800 dark:text-stone-100 mb-1">Technical Support</h4>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mb-2">For bugs, errors, or technical issues</p>
                    <div className="bg-stone-50 dark:bg-stone-800 rounded-xl px-3 py-2 text-sm font-mono text-stone-700 dark:text-stone-300 border-2 border-stone-200 dark:border-stone-600">
                      [TECH SUPPORT] - Issue with [describe problem]
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Support */}
              <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-4 hover:border-[#58CC02] dark:hover:border-[#58CC02] transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#EAFFD6] dark:bg-[#58CC02]/20 rounded-xl flex items-center justify-center shrink-0 border-2 border-[#58CC02]/30">
                    <svg className="w-5 h-5 text-[#58CC02]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-stone-800 dark:text-stone-100 mb-1">Billing & Subscriptions</h4>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mb-2">For payment, billing, or subscription questions</p>
                    <div className="bg-stone-50 dark:bg-stone-800 rounded-xl px-3 py-2 text-sm font-mono text-stone-700 dark:text-stone-300 border-2 border-stone-200 dark:border-stone-600">
                      [BILLING] - Question about [subscription/payment]
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Request */}
              <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-4 hover:border-[#FF9600] dark:hover:border-[#FF9600] transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF4E0] dark:bg-[#FF9600]/20 rounded-xl flex items-center justify-center shrink-0 border-2 border-[#FF9600]/30">
                    <svg className="w-5 h-5 text-[#FF9600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-stone-800 dark:text-stone-100 mb-1">Feature Request</h4>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mb-2">Suggest new features or improvements</p>
                    <div className="bg-stone-50 dark:bg-stone-800 rounded-xl px-3 py-2 text-sm font-mono text-stone-700 dark:text-stone-300 border-2 border-stone-200 dark:border-stone-600">
                      [FEATURE REQUEST] - [describe your idea]
                    </div>
                  </div>
                </div>
              </div>

              {/* General Inquiry */}
              <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl p-4 hover:border-[#1CB0F6] dark:hover:border-[#1CB0F6] transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#DDF4FF] dark:bg-[#1CB0F6]/20 rounded-xl flex items-center justify-center shrink-0 border-2 border-[#1CB0F6]/30">
                    <svg className="w-5 h-5 text-[#1CB0F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-stone-800 dark:text-stone-100 mb-1">General Question</h4>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mb-2">For general questions or feedback</p>
                    <div className="bg-stone-50 dark:bg-stone-800 rounded-xl px-3 py-2 text-sm font-mono text-stone-700 dark:text-stone-300 border-2 border-stone-200 dark:border-stone-600">
                      [QUESTION] - [your question here]
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Email Template */}
          <div className="mt-8 bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 rounded-xl p-6">
            <h3 className="text-sm font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-4">Email Template</h3>
            <div className="bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-600 rounded-xl p-4 font-mono text-sm text-stone-700 dark:text-stone-300 space-y-2">
              <div><strong>To:</strong> support@writescholar.com</div>
              <div><strong>Subject:</strong> [CATEGORY] - Brief description of your issue</div>
              <div className="border-t-2 border-stone-200 dark:border-stone-600 pt-2 mt-2">
                <div><strong>Hi WriteScholar Support,</strong></div>
                <div className="mt-2 space-y-2">
                  <div>My name is [Your Name] and my account email is [Your Email].</div>
                  <div>[Describe your question or issue in detail]</div>
                  <div>Thank you for your help!</div>
                  <div>Best regards,<br />[Your Name]</div>
                </div>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(`To: support@writescholar.com
Subject: [CATEGORY] - Brief description of your issue

Hi WriteScholar Support,

My name is [Your Name] and my account email is [Your Email].

[Describe your question or issue in detail]

Thank you for your help!

Best regards,
[Your Name]`)}
              className="mt-4 inline-flex items-center gap-2 bg-[#A560E8] hover:bg-[#8A48C7] text-white px-5 py-2.5 rounded-xl border-2 border-b-4 border-[#8A48C7] active:border-b-2 active:translate-y-0.5 transition-all font-extrabold uppercase tracking-wide text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Email Template
            </button>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
          <div className="text-center p-6 border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl">
            <div className="w-14 h-14 bg-[#F3EAFF] dark:bg-[#A560E8]/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-[#A560E8]/30">
              <svg className="w-7 h-7 text-[#A560E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-base font-extrabold text-stone-800 dark:text-stone-100 mb-2">Email Support</h3>
            <p className="text-stone-600 dark:text-stone-400 text-sm mb-1 font-semibold">support@writescholar.com</p>
            <p className="text-xs text-stone-500 dark:text-stone-500 font-semibold">We respond within 24 hours</p>
          </div>

          <div className="text-center p-6 border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl">
            <div className="w-14 h-14 bg-[#DDF4FF] dark:bg-[#1CB0F6]/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-[#1CB0F6]/30">
              <svg className="w-7 h-7 text-[#1CB0F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-extrabold text-stone-800 dark:text-stone-100 mb-2">Response Time</h3>
            <p className="text-stone-600 dark:text-stone-400 text-sm mb-1 font-semibold">24 hours or less</p>
            <p className="text-xs text-stone-500 dark:text-stone-500 font-semibold">Monday - Friday</p>
          </div>

          <div className="text-center p-6 border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl">
            <div className="w-14 h-14 bg-[#FFF4E0] dark:bg-[#FF9600]/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-[#FF9600]/30">
              <svg className="w-7 h-7 text-[#FF9600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-extrabold text-stone-800 dark:text-stone-100 mb-2">Help Center</h3>
            <p className="text-stone-600 dark:text-stone-400 text-sm mb-1 font-semibold">Browse our FAQ</p>
            <button
              onClick={() => onNavigate('help')}
              className="text-xs text-[#1CB0F6] font-extrabold hover:text-[#1899D6] mt-1 uppercase tracking-wide"
            >
              Find answers instantly →
            </button>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default ContactPage;
