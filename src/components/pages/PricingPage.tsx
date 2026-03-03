import { useState, useEffect } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import PaymentModal from '../payment/PaymentModal';

interface PricingPageProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

const PricingPage = ({ onNavigate, user, onLogout }: PricingPageProps) => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    planType: 'starter' | 'premium';
    billingCycle: 'monthly' | 'yearly';
  }>({
    isOpen: false,
    planType: 'starter',
    billingCycle: 'monthly'
  });

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      if (!user) return;
      
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/subscriptions/current`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentPlan(data.plan || 'free');
        }
      } catch (error) {
        console.error('Error fetching current plan:', error);
      }
    };

    fetchCurrentPlan();
  }, [user]);

  const handlePlanAction = async (planId: string) => {
    if (!user) {
      onNavigate('signup');
      return;
    }

    if (planId === 'free') return;

    if (currentPlan !== 'free') {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/subscriptions/billing-portal`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            returnUrl: `${window.location.origin}/pricing`
          })
        });

        const data = await response.json();
        
        if (data.success && data.url) {
          window.location.href = data.url;
        } else {
          throw new Error(data.message || 'Failed to create billing portal session');
        }
      } catch (error) {
        console.error('Error opening billing portal:', error);
      }
    } else {
      setPaymentModal({
        isOpen: true,
        planType: planId as 'starter' | 'premium',
        billingCycle: billingCycle as 'monthly' | 'yearly'
      });
    }
  };

  const getFreePlanButtonText = () => {
    if (!user) return 'Get Started Free';
    if (currentPlan === 'free') return 'Current Plan';
    return 'Switch to Free';
  };

  const handleFreePlanAction = async () => {
    if (!user) {
      onNavigate('signup');
      return;
    }
    
    if (currentPlan === 'free') return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/subscriptions/billing-portal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/pricing`
        })
      });

      const data = await response.json();
      
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.message || 'Failed to create billing portal session');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        '3 documents per month',
        '3 AI essay analyses per month',
        '3 study tool generations/month (quiz, flashcards, crossword)',
        '1,000 words/month for Humanizer & Summarizer',
        '2 citation searches per month',
        'Basic grammar check',
        'Standard citation styles'
      ],
      limitations: [
        'Limited to 3 documents',
        'Basic AI model',
        'No priority support'
      ],
      popular: false,
      buttonText: getFreePlanButtonText(),
      buttonAction: handleFreePlanAction
    },
    {
      id: 'starter',
      name: 'Starter',
      description: 'Most popular for students',
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      features: [
        'Unlimited document uploads',
        '999 AI essay analyses per month',
        'Unlimited quiz, flashcard & crossword generation',
        '999,999 words/month for Humanizer & Summarizer',
        '999 citation searches per month',
        'All citation styles (APA, MLA, Chicago, Harvard…)',
        'Grammar and style checks',
        'Export to PDF & Word',
        'Study tools history'
      ],
      limitations: [],
      popular: true,
      buttonText: !user ? 'Get Started' : (currentPlan === 'free' ? 'Upgrade to Starter' : 'Switch to Starter'),
      buttonAction: () => handlePlanAction('starter')
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'For researchers and institutions',
      monthlyPrice: 39.99,
      yearlyPrice: 399.99,
      features: [
        'Everything in Starter',
        'Our top-tier premium AI model',
        'All quiz types & difficulty levels unlocked',
        'All summarizer styles & lengths unlocked',
        'Advanced AI essay analysis',
        'Advanced grammar and style checking',
        'Priority support'
      ],
      limitations: [],
      popular: false,
      buttonText: !user ? 'Get Started' : (currentPlan === 'free' ? 'Upgrade to Premium' : 'Switch to Premium'),
      buttonAction: () => handlePlanAction('premium')
    }
  ];

  const faqs = [
    {
      question: "What's included in the free plan?",
      answer: "The free plan includes 3 documents per month, 3 AI essay analyses, 3 study tool generations (quiz, flashcards, or crossword), 1,000 words for the Humanizer and Summarizer, and 2 citation searches. It's perfect for students just getting started."
    },
    {
      question: "What's the difference between Starter and Premium?",
      answer: "Starter gives you unlimited documents, 999 AI analyses, unlimited study tool generations (quizzes, flashcards, crosswords), 999,999 Humanizer/Summarizer words, all citation styles, and PDF/Word export. Premium upgrades you to our top-tier premium AI model, unlocks all quiz types and difficulty levels, all summarizer styles and lengths, advanced essay analysis, advanced grammar checking, and priority support."
    },
    {
      question: "Can I change my plan after subscribing?",
      answer: "No, plan changes are not available after subscription. Please choose your plan carefully as subscriptions are final and cannot be modified once activated."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept Visa and Mastercard payments processed securely through Stripe. All transactions are encrypted and secure."
    },
    {
      question: "Do you offer student discounts?",
      answer: "No, we do not offer any discounts or special pricing. All plans are priced as shown with no exceptions."
    },
    {
      question: "Is there a money-back guarantee?",
      answer: "No, we do not offer a money-back guarantee. All sales are final. Please review the plan features carefully before subscribing."
    },
    {
      question: "Do you offer team collaboration features?",
      answer: "No, our service is designed for individual use only. We do not offer team accounts, collaboration features, or multi-user access."
    },
    {
      question: "How does billing work?",
      answer: "Subscriptions are billed monthly or annually based on your chosen plan. Payment is processed automatically on your billing date through your selected payment method."
    }
  ];

  const getPrice = (plan: any) => {
    return billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  };

  const getSavings = (plan: any) => {
    if (billingCycle === 'yearly' && plan.monthlyPrice > 0) {
      const monthlyTotal = plan.monthlyPrice * 12;
      const savings = monthlyTotal - plan.yearlyPrice;
      return Math.round((savings / monthlyTotal) * 100);
    }
    return 0;
  };

  const handlePaymentSuccess = (subscriptionId: string) => {
    console.log('Payment successful:', subscriptionId);
    onNavigate('dashboard');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Conditional Header - Show logged-in header if user exists */}
      {user ? (
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="pricing" />
      ) : (
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100" aria-label="Main navigation">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-18 py-4">
              <a href="/" onClick={(e) => { e.preventDefault(); onNavigate('landing'); }} className="flex items-center space-x-2.5">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">W</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">WriteScholar</span>
              </a>
              
              <div className="hidden md:flex items-center space-x-2">
                <a href="/features" onClick={(e) => { e.preventDefault(); onNavigate('features'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">Features</a>
                <a href="/pricing" onClick={(e) => { e.preventDefault(); onNavigate('pricing'); }} className="px-4 py-2.5 text-base text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-medium">Pricing</a>
                <a href="/blog" onClick={(e) => { e.preventDefault(); onNavigate('blog'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">Blog</a>
                <a href="/about" onClick={(e) => { e.preventDefault(); onNavigate('about'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">About</a>
              </div>
              
              <div className="flex items-center space-x-3">
                <a href="/login" onClick={(e) => { e.preventDefault(); onNavigate('login'); }} className="hidden sm:inline-flex px-4 py-2.5 text-base text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-colors">Log in</a>
                <a href="/signup" onClick={(e) => { e.preventDefault(); onNavigate('signup'); }} className="inline-flex items-center px-5 py-2.5 bg-gray-900 text-white text-base font-semibold rounded-xl hover:bg-gray-800 transition-colors">
                  Get Started
                </a>
              </div>
            </div>
          </div>
        </nav>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade anytime.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-12">
            <div className="bg-gray-100 rounded-xl p-1.5 flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2.5 rounded-lg text-base font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Bill Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2.5 rounded-lg text-base font-semibold transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Bill Yearly
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white border rounded-2xl p-8 hover:shadow-lg transition-all ${
                plan.popular 
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${getPrice(plan)}
                  </span>
                  <span className="text-gray-600 ml-2">
                    /{billingCycle === 'yearly' ? 'year' : 'month'}
                  </span>
                </div>

                {getSavings(plan) > 0 && (
                  <div className="text-green-600 text-sm font-medium mb-4">
                    Save {getSavings(plan)}% with yearly billing
                  </div>
                )}
              </div>

              <div className="mb-8">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={plan.id === currentPlan ? undefined : plan.buttonAction}
                disabled={plan.id === currentPlan}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  plan.id === currentPlan
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : plan.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
              >
                {plan.id === currentPlan ? 'Current Plan' : plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-8 mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <div key={index} className="space-y-2">
                <h3 className="font-semibold text-gray-900 text-sm">{faq.question}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section - Different for logged-in users */}
        <div className="text-center bg-gray-900 rounded-2xl p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-white mb-3">
            {user ? 'Start writing with AI today' : 'Ready to improve your academic writing?'}
          </h2>
          <p className="text-gray-300 mb-6 max-w-xl mx-auto">
            {user 
              ? 'Head to your dashboard to start analyzing documents and finding citations.'
              : 'Join thousands of students and researchers who trust WriteScholar.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <>
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className="bg-white hover:bg-gray-100 text-gray-900 px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  Go to Dashboard
                </button>
                <button 
                  onClick={() => onNavigate('contact')}
                  className="border border-gray-600 hover:border-gray-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  Contact Support
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => onNavigate('signup')}
                  className="bg-white hover:bg-gray-100 text-gray-900 px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  Get Started Free
                </button>
                <button 
                  onClick={() => onNavigate('contact')}
                  className="border border-gray-600 hover:border-gray-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  Contact Sales
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
        planType={paymentModal.planType}
        billingCycle={paymentModal.billingCycle}
        onSuccess={handlePaymentSuccess}
      />

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default PricingPage;
