import React, { useState } from 'react';

const PricingPage = ({ onNavigate }) => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedPlan, setSelectedPlan] = useState('premium');

  const plans = {
    free: {
      name: 'Free',
      price: { monthly: 0, annual: 0 },
      description: 'Perfect for getting started',
      features: [
        '3 document analyses per month',
        'Basic grammar and style feedback',
        'Standard citation checking',
        'Email support',
        'Basic document history'
      ],
      limitations: [
        'Limited to 5,000 words per document',
        'No priority processing',
        'Standard analysis depth only'
      ],
      color: 'gray'
    },
    premium: {
      name: 'Premium',
      price: { monthly: 29, annual: 278 },
      description: 'Most popular for active researchers',
      features: [
        'Unlimited document analyses',
        'Advanced AI feedback & suggestions',
        'All citation styles (APA, MLA, Chicago, etc.)',
        'Priority processing (2x faster)',
        'Detailed writing analytics',
        'Export to multiple formats',
        'Cloud storage integration',
        'Email & chat support',
        'Advanced plagiarism detection',
        'Collaboration features'
      ],
      limitations: [],
      color: 'blue',
      popular: true
    },
    institution: {
      name: 'Institution',
      price: { monthly: 199, annual: 1990 },
      description: 'For universities and research institutions',
      features: [
        'Everything in Premium',
        'Up to 100 user accounts',
        'Institution-wide analytics',
        'Custom branding options',
        'API access for integration',
        'Dedicated account manager',
        'Custom citation styles',
        'SAML/SSO integration',
        'Advanced security features',
        'Training sessions included',
        'Priority phone support',
        'Custom contract terms'
      ],
      limitations: [],
      color: 'purple'
    }
  };

  const handleSelectPlan = (planType) => {
    setSelectedPlan(planType);
    if (planType === 'free') {
      onNavigate('signup');
    } else {
      // Would normally go to checkout
      onNavigate('signup');
    }
  };

  const formatPrice = (plan) => {
    if (plan.price[billingCycle] === 0) return 'Free';
    const price = plan.price[billingCycle];
    const period = billingCycle === 'monthly' ? '/month' : '/year';
    return `$${price}${period}`;
  };

  const getSavings = (plan) => {
    if (billingCycle === 'annual' && plan.price.monthly > 0) {
      const monthlyCost = plan.price.monthly * 12;
      const savings = monthlyCost - plan.price.annual;
      const percentage = Math.round((savings / monthlyCost) * 100);
      return percentage;
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-xl font-bold text-gray-900">AcademicAI</span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <button onClick={() => onNavigate('landing')} className="text-gray-600 hover:text-gray-900 transition-colors">Home</button>
          <button className="text-blue-600 font-medium">Pricing</button>
          <button className="text-gray-600 hover:text-gray-900 transition-colors">Features</button>
          <button className="text-gray-600 hover:text-gray-900 transition-colors">About</button>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => onNavigate('login')} className="text-gray-600 hover:text-gray-900 transition-colors">
            Login
          </button>
          <button onClick={() => onNavigate('signup')} className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
            Sign up
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Choose the perfect plan for your<br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">academic success</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            From individual researchers to entire institutions, we have a plan that scales with your needs and helps you achieve writing excellence.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-12">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>Monthly</span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>
              Annual
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {Object.entries(plans).map(([key, plan]) => (
            <div
              key={key}
              className={`relative bg-white rounded-2xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl ${
                plan.popular ? 'border-blue-500 transform scale-105' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-gray-900">{formatPrice(plan)}</span>
                    {getSavings(plan) > 0 && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Save {getSavings(plan)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <h4 className="font-semibold text-gray-900 mb-4">What's included:</h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.limitations.length > 0 && (
                    <div className="mt-6">
                      <h5 className="font-medium text-gray-500 mb-2 text-sm">Limitations:</h5>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-gray-500 text-xs">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(key)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:scale-105'
                      : key === 'free'
                      ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {key === 'free' ? 'Get Started Free' : 
                   key === 'institution' ? 'Contact Sales' : 
                   'Start Free Trial'}
                </button>

                {key !== 'free' && (
                  <p className="text-center text-xs text-gray-500 mt-3">
                    {key === 'institution' ? 'Custom pricing available' : '14-day free trial • No credit card required'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Enterprise Section */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-12 text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Need something custom?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            We work with large institutions, research organizations, and enterprises to create custom solutions that fit your specific needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Schedule a Demo
            </button>
            <button className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors">
              Contact Sales
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Can I change plans at any time?</h3>
              <p className="text-gray-600 text-sm">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences.</p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
              <p className="text-gray-600 text-sm">Premium and Institution plans come with a 14-day free trial. No credit card required to start.</p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600 text-sm">We accept all major credit cards, PayPal, and can arrange invoicing for institutional customers.</p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Do you offer student discounts?</h3>
              <p className="text-gray-600 text-sm">Yes! Students get 50% off Premium plans with a valid .edu email address. Verify your student status during signup.</p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2">What happens to my data if I cancel?</h3>
              <p className="text-gray-600 text-sm">You can export all your documents and analyses before canceling. We retain data for 30 days after cancellation for account recovery.</p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Is my academic work secure?</h3>
              <p className="text-gray-600 text-sm">Absolutely. We use enterprise-grade encryption, and your documents are never used to train our AI models or shared with third parties.</p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to improve your academic writing?</h2>
          <p className="text-gray-600 mb-8">Join thousands of researchers, students, and institutions worldwide.</p>
          <button 
            onClick={() => onNavigate('signup')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            Start Your Free Trial
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;