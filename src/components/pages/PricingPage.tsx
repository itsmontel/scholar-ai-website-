import { useState, useEffect } from 'react';

interface PricingPageProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

const PricingPage = ({ onNavigate, user, onLogout }: PricingPageProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [, setSelectedPlan] = useState('premium');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen && !(event.target as Element).closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const plans: Record<string, any> = {
    basic: {
      name: 'Basic',
      price: { monthly: 19.99, annual: 199.99 },
      description: 'Perfect for students and individual researchers',
      features: [
        'Unlimited document analyses',
        'AI writing feedback & suggestions',
        'Citation style checking (APA, MLA, Chicago)',
        'Grammar and style improvements',
        'Export to PDF and Word',
        'Email support'
      ],
      color: 'blue'
    },
    premium: {
      name: 'Premium',
      price: { monthly: 39.99, annual: 399.99 },
      description: 'Most popular for serious academic writers',
      features: [
        'Everything in Basic',
        'Advanced writing analysis',
        'Plagiarism detection',
        'Document history & version control',
        'Priority processing',
        'Phone support'
      ],
      color: 'purple',
      popular: true
    }
  };

  const handleSelectPlan = (planType: string) => {
    setSelectedPlan(planType);
      // Would normally go to checkout
      onNavigate('signup');
  };

  const formatPrice = (plan: any) => {
    const price = plan.price[billingCycle];
    const period = billingCycle === 'monthly' ? '/mo' : '/yr';
    return `$${price}${period}`;
  };

  const getSavings = (plan: any) => {
    if (billingCycle === 'annual' && plan.price.monthly > 0) {
      const monthlyCost = plan.price.monthly * 12;
      const savings = monthlyCost - plan.price.annual;
      const percentage = Math.round((savings / monthlyCost) * 100);
      return percentage;
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => onNavigate('dashboard')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Scholar</span>
            </button>

            <nav className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => onNavigate('dashboard')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100/50 transition-all duration-200"
              >
                Dashboard
              </button>
              <button 
                onClick={() => onNavigate('library')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100/50 transition-all duration-200"
              >
                Library
              </button>
              <button 
                onClick={() => onNavigate('settings')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100/50 transition-all duration-200"
              >
                Account
              </button>
            </nav>

            <div className="flex items-center space-x-4">
              {/* User Profile Dropdown */}
              <div className="relative dropdown-container">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-3 px-4 py-2 rounded-xl hover:bg-gray-100/60 transition-all duration-200 border border-gray-200/50 bg-white/50 backdrop-blur-sm"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-sm">
                      {(user?.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">{user?.name || 'User Name'}</div>
                    <div className="text-xs text-gray-500">{user?.email || 'user@example.com'}</div>
          </div>
                  <svg 
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200/50 backdrop-blur-sm z-50">
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">{user?.name || 'User Name'}</div>
                      <div className="text-xs text-gray-500">{user?.email || 'user@example.com'}</div>
                      <div className="flex items-center mt-2">
                        <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs text-gray-600">0 credits</span>
        </div>
        </div>

                    {/* Navigation Links */}
                    <div className="py-2">
                      <button 
                        onClick={() => { onNavigate('dashboard'); setIsDropdownOpen(false); }}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Dashboard</span>
                      </button>
                      
                      <button 
                        onClick={() => { onNavigate('settings'); setIsDropdownOpen(false); }}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Account</span>
                      </button>
                      
                      <button 
                        onClick={() => { onNavigate('library'); setIsDropdownOpen(false); }}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span>Documents</span>
                      </button>
                      
                      <button 
                        onClick={() => { onNavigate('pricing'); setIsDropdownOpen(false); }}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Upgrade Plan</span>
          </button>
                    </div>

                    {/* Logout Section */}
                    <div className="border-t border-gray-100 py-2">
                      <button 
                        onClick={() => { onLogout(); setIsDropdownOpen(false); }}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
          </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Simple and transparent pricing
          </h1>
          
          {/* Key Benefits */}
          <div className="flex justify-center items-center space-x-12 mb-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <span className="text-gray-700 text-sm font-medium">A fraction of traditional editing costs</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-gray-700 text-sm font-medium">Used by thousands of researchers</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
            <p className="text-gray-600">Select the plan that fits your needs.</p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-1 flex shadow-lg border border-gray-200/50">
            <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  billingCycle === 'monthly'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Bill Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  billingCycle === 'annual'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Bill Yearly (2 Months Free)
            </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16 max-w-5xl mx-auto">
          {Object.entries(plans).map(([key, plan]) => (
            <div
              key={key}
              className={`relative bg-white/90 backdrop-blur-xl rounded-2xl border transition-all duration-300 hover:shadow-xl ${
                plan.popular 
                  ? 'border-blue-500/60 shadow-lg' 
                  : 'border-gray-200/60 shadow-md hover:border-gray-300/60'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl text-center font-bold text-sm shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">{formatPrice(plan)}</span>
                    {getSavings(plan) > 0 && (
                      <div className="mt-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                          Save {getSavings(plan)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <ul className="space-y-3">
                    {plan.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(key)}
                  className={`w-full py-3 px-6 rounded-xl font-semibold text-base transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {key === 'basic' ? 'Upgrade to Basic' : 'Upgrade to Premium'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Alternatives Section */}
        <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white py-16 relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-8 relative z-10">
            <h2 className="text-3xl font-bold text-center mb-12">Alternatives are expensive</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Hire Editors */}
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">Hire Editors</h3>
                <p className="text-gray-300 text-sm">
                  Expensive: Pay hundreds for basic editing, plus extra costs for revisions and multiple rounds of feedback.
                </p>
              </div>

              {/* Do It Yourself */}
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">Do It Yourself Manually</h3>
                <p className="text-gray-300 text-sm">
                  Time-consuming: Requires learning academic writing principles, citation styles, and countless hours of self-editing.
                </p>
              </div>

              {/* Scholar AI */}
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">Scholar AI</h3>
                <p className="text-gray-300 text-sm">
                  Generate professional academic feedback instantly with AI. Fast, affordable, and high-quality writing enhancement.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gradient-to-br from-gray-50 to-white py-16">
          <div className="max-w-6xl mx-auto px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 shadow-lg">
                <h3 className="font-bold text-gray-900 mb-3">What types of documents can Scholar AI analyze?</h3>
                <p className="text-gray-600 text-sm">Scholar AI supports PDF, DOCX, and TXT files. Our AI provides comprehensive analysis including writing quality, structure, citations, and academic standards compliance.</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 shadow-lg">
                <h3 className="font-bold text-gray-900 mb-3">How does the AI analysis work?</h3>
                <p className="text-gray-600 text-sm">Our advanced AI analyzes your document for academic writing quality, provides interactive annotations with specific feedback, and offers suggestions for improvement based on academic standards.</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 shadow-lg">
                <h3 className="font-bold text-gray-900 mb-3">What citation styles are supported?</h3>
                <p className="text-gray-600 text-sm">Scholar AI supports all major academic citation styles including APA, Harvard, MLA, Chicago, and more. The AI can check and suggest corrections for your citations.</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 shadow-lg">
                <h3 className="font-bold text-gray-900 mb-3">Can I save and access my analysis history?</h3>
                <p className="text-gray-600 text-sm">Yes! All your analyses are saved to your account and can be accessed anytime. You can view your analysis history and track your writing improvements over time.</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 shadow-lg">
                <h3 className="font-bold text-gray-900 mb-3">Is there a word limit for document analysis?</h3>
                <p className="text-gray-600 text-sm">There's a minimum of 200 words required for analysis to ensure meaningful feedback. There's no maximum limit - we can analyze documents of any length.</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 shadow-lg">
                <h3 className="font-bold text-gray-900 mb-3">How secure is my academic work?</h3>
                <p className="text-gray-600 text-sm">Your documents are encrypted and secure. We never use your content to train our AI models or share it with third parties. Your academic work remains completely private.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;