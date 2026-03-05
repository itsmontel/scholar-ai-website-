import Header from '../common/Header';

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
    // You could add a toast notification here if desired
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Page Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-lime-50/80 text-lime-700 rounded-full text-sm font-medium mb-8 border border-lime-200/50">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Get in Touch
          </div>
          <h1 className="text-5xl text-stone-800 mb-6" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
            Contact <span className="text-lime-600 italic">WriteScholar</span>
          </h1>
          <p className="text-xl text-stone-600 max-w-2xl mx-auto">
            Have questions or need support? We're here to help you succeed with your academic writing.
          </p>
        </div>

        {/* How to Contact Us */}
        <div className="bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-2xl p-8 shadow-lg mb-12">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-lime-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-stone-800 mb-4">Get in Touch</h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Send us an email directly and we'll respond within 24 hours. Choose the appropriate subject line for faster assistance.
            </p>
          </div>

          {/* Email Address */}
          <div className="bg-gradient-to-r from-lime-50 to-green-50 border border-lime-200 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
          <div>
                <h3 className="text-xl font-semibold text-stone-800 mb-2">Email Address</h3>
                <p className="text-2xl font-bold text-lime-600">support@writescholar.com</p>
                <p className="text-sm text-stone-600 mt-1">We respond within 24 hours</p>
              </div>
              <button
                onClick={() => copyToClipboard('support@writescholar.com')}
                className="bg-white hover:bg-stone-50 text-stone-700 px-4 py-2 rounded-lg border border-stone-300 transition-colors duration-200 flex items-center space-x-2"
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
            <h3 className="text-xl font-semibold text-stone-800 mb-4">Recommended Subject Lines</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Technical Support */}
              <div className="bg-white border border-stone-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-stone-800 mb-1">Technical Support</h4>
                    <p className="text-sm text-stone-600 mb-2">For bugs, errors, or technical issues</p>
                    <div className="bg-stone-50 rounded px-3 py-2 text-sm font-mono text-stone-700">
                      [TECH SUPPORT] - Issue with [describe problem]
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Support */}
              <div className="bg-white border border-stone-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-stone-800 mb-1">Billing & Subscriptions</h4>
                    <p className="text-sm text-stone-600 mb-2">For payment, billing, or subscription questions</p>
                    <div className="bg-stone-50 rounded px-3 py-2 text-sm font-mono text-stone-700">
                      [BILLING] - Question about [subscription/payment]
                    </div>
                  </div>
          </div>
        </div>

              {/* Feature Request */}
              <div className="bg-white border border-stone-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-lime-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-stone-800 mb-1">Feature Request</h4>
                    <p className="text-sm text-stone-600 mb-2">Suggest new features or improvements</p>
                    <div className="bg-stone-50 rounded px-3 py-2 text-sm font-mono text-stone-700">
                      [FEATURE REQUEST] - [describe your idea]
                    </div>
                  </div>
                </div>
        </div>

              {/* General Inquiry */}
              <div className="bg-white border border-stone-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-stone-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-stone-800 mb-1">General Question</h4>
                    <p className="text-sm text-stone-600 mb-2">For general questions or feedback</p>
                    <div className="bg-stone-50 rounded px-3 py-2 text-sm font-mono text-stone-700">
                      [QUESTION] - [your question here]
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>

          {/* Email Template */}
          <div className="mt-8 bg-stone-50 border border-stone-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-stone-800 mb-4">Email Template</h3>
            <div className="bg-white border border-stone-300 rounded-lg p-4 font-mono text-sm text-stone-700 space-y-2">
              <div><strong>To:</strong> support@writescholar.com</div>
              <div><strong>Subject:</strong> [CATEGORY] - Brief description of your issue</div>
              <div className="border-t pt-2 mt-2">
                <div><strong>Hi WriteScholar Support,</strong></div>
                <div className="mt-2">
                  <div>My name is [Your Name] and my account email is [Your Email].</div>
                  <div className="mt-2">[Describe your question or issue in detail]</div>
                  <div className="mt-2">Thank you for your help!</div>
                  <div className="mt-2">Best regards,<br />[Your Name]</div>
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
              className="mt-4 bg-lime-500 hover:bg-lime-400 text-stone-900 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy Email Template</span>
            </button>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-lime-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
                  </div>
            <h3 className="text-lg font-semibold text-stone-800 mb-2">Email Support</h3>
            <p className="text-stone-600 mb-2">support@writescholar.com</p>
            <p className="text-sm text-stone-500">We respond within 24 hours</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-stone-800 mb-2">Response Time</h3>
            <p className="text-stone-600 mb-2">24 hours or less</p>
            <p className="text-sm text-stone-500">Monday - Friday</p>
            </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-stone-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-stone-800 mb-2">Help Center</h3>
            <p className="text-stone-600 mb-2">Browse our FAQ</p>
            <p className="text-sm text-stone-500">Find answers instantly</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContactPage;