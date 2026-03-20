import { useState, useEffect } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import ScholarMascot from '../common/ScholarMascot';

interface PricingPageProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

const PricingPage = ({ onNavigate, user, onLogout }: PricingPageProps) => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [isTrialEligible, setIsTrialEligible] = useState<boolean>(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

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

  useEffect(() => {
    const checkTrialEligibility = async () => {
      if (!user) {
        setIsTrialEligible(true);
        return;
      }
      
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/subscriptions/trial-eligibility`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsTrialEligible(data.eligible);
        }
      } catch (error) {
        console.error('Error checking trial eligibility:', error);
      }
    };

    checkTrialEligibility();
  }, [user]);

  const handlePlanAction = async (planId: string) => {
    if (!user) {
      onNavigate('signup');
      return;
    }

    if (planId === 'free') return;

    setProcessingPlan(planId);

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
      // Free user upgrading: go straight to Stripe checkout
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/subscriptions/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
            body: JSON.stringify({
            planType: planId as 'pro' | 'premium',
            billingCycle: billingCycle as 'monthly' | 'yearly',
            successUrl: `${window.location.origin}/dashboard?payment=success`,
            cancelUrl: `${window.location.origin}/pricing?payment=cancelled`
          })
        });

        const data = await response.json();
        if (data.success && data.data?.checkoutUrl) {
          window.location.href = data.data.checkoutUrl;
        } else {
          throw new Error(data.message || 'Failed to create checkout session');
        }
      } catch (error) {
        console.error('Error starting checkout:', error);
        setProcessingPlan(null);
      }
    }
  };

  const getFreePlanButtonText = () => {
    if (!user) return 'Try Free';
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
        '3 documents, 2 analyses, 2 study packs/mo',
        '5,000 words Paper Summarizer',
        '2 citation searches',
        'Basic grammar & citation styles',
        'Focus Mode (3 sites)'
      ],
      limitations: [
        'Quiz & crossword locked (Pro)',
        '3 documents max',
        '3 sites in Focus Mode',
        'Basic AI model'
      ],
      popular: false,
      buttonText: getFreePlanButtonText(),
      buttonAction: handleFreePlanAction
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Most popular for students',
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      features: [
        'Unlimited documents',
        '99 combined analyses, study packs & citations/mo',
        '99,999 words Paper Summarizer',
        'All citation styles, PDF/Word export',
        'Focus Mode (20 sites)',
        'Quiz, flashcards, crossword & Crater Blast',
        'Paper Summarizer (long documents)'
      ],
      limitations: [],
      popular: true,
      buttonText: !user 
        ? 'Get $10 Off' 
        : (currentPlan === 'free' 
          ? (isTrialEligible ? 'Get $10 Off' : 'Upgrade to Pro') 
          : 'Switch to Pro'),
        buttonAction: () => handlePlanAction('pro')
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'For researchers and institutions',
      monthlyPrice: 39.99,
      yearlyPrice: 399.99,
      features: [
        'Everything in Pro • 10× usage',
        '999 combined analyses, study packs & citations/mo',
        '999,999 words Paper Summarizer',
        'Premium AI model, advanced essay analysis',
        'Priority support',
        'Focus Mode (unlimited sites)',
        'Larger document uploads (up to 1GB)'
      ],
      limitations: [],
      popular: false,
      buttonText: !user 
        ? 'Get $10 Off' 
        : (currentPlan === 'free' 
          ? (isTrialEligible ? 'Get $10 Off' : 'Upgrade to Premium') 
          : 'Switch to Premium'),
      buttonAction: () => handlePlanAction('premium')
    }
  ];

  const faqs = [
    {
      question: "How does the $10 off work?",
      answer: "First-time subscribers get $10 off their first month on Pro or Premium. Pro starts at $9.99 (then $19.99/mo) and Premium at $29.99 (then $39.99/mo). The discount is applied automatically at checkout. Each email address can only use the offer once."
    },
    {
      question: "What's included in the free plan?",
        answer: "The free plan includes 3 documents per month, 2 AI essay analyses, 2 study pack generations (lesson, flashcards & quiz included — crossword & Crater Blast unlock with Pro), 5,000 words for the Paper Summarizer, and 2 citation searches. It's perfect for students just getting started."
    },
    {
      question: "What's the difference between Pro and Premium?",
      answer: "Pro: 99 combined actions (analyses, study packs & citations)/mo, 99,999 words for the Paper Summarizer, all citation styles, Focus Mode (20 sites). Premium gives you 10× the usage: 999 combined actions/mo, 999,999 words, plus unlimited Focus Mode, premium AI model, advanced analysis, and priority support."
    },
    {
      question: "Can I change my plan after subscribing?",
      answer: "Yes, you can switch plans anytime. Upgrade or downgrade through your account settings. Plan changes take effect at your next billing cycle."
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
      answer: "Yes. We offer a 7-day money-back guarantee. If you're not satisfied, contact support within 7 days of your purchase for a full refund."
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/80 via-stone-50 to-white dark:from-stone-950 dark:via-stone-900 dark:to-stone-900">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="pricing" />

      {/* Hero Section - mascot instead of illustration */}
      <section className="relative py-12 sm:py-16 border-b border-stone-200/60 dark:border-stone-700/60 overflow-hidden">
        <div className="absolute top-[30%] left-[5%] hidden xl:block text-4xl opacity-50 animate-float">💰</div>
        <div className="absolute top-[35%] right-[6%] hidden xl:block text-3xl opacity-45 animate-float-delayed">✨</div>
        <div className="absolute bottom-[40%] left-[6%] hidden xl:block text-3xl opacity-45 animate-float">📋</div>
        <div className="absolute bottom-[35%] right-[5%] hidden xl:block text-4xl opacity-50 animate-float-delayed">🎯</div>
        {/* Mascot - pointing pose */}
        <div className="hidden lg:flex absolute right-4 xl:right-12 top-1/2 -translate-y-1/2 z-10 items-center justify-center">
          <ScholarMascot size={140} animated={true} pose="pointing" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-12">
            <div className="flex-1 text-center lg:text-left max-w-3xl mx-auto lg:mx-0">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-4">
                Simple, <span className="bg-gradient-to-r from-rose-500 to-rose-600 bg-clip-text text-transparent">transparent</span> pricing
              </h1>
              <p className="text-lg text-stone-500 dark:text-stone-400 max-w-2xl mx-auto lg:mx-0">
                Choose the plan that fits your needs. Upgrade anytime.
              </p>
            </div>
            <div className="hidden lg:block flex-shrink-0 w-24 h-28 xl:w-28 xl:h-32" />
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="text-center mb-10">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-12">
            <div className="bg-stone-100 dark:bg-stone-800 rounded-full p-1.5 flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2.5 rounded-full text-base font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100'
                }`}
              >
                Bill Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2.5 rounded-full text-base font-semibold transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100'
                }`}
              >
                Bill Yearly
                <span className="ml-2 px-2 py-1 bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 text-xs font-semibold rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-8 hover:shadow-lg transition-all ${
                plan.popular 
                  ? 'bg-white dark:bg-stone-800 border border-rose-500 ring-2 ring-rose-200 dark:ring-rose-800'
                  : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg shadow-rose-500/25">
                    Most Popular
                  </span>
                </div>
              )}
              {plan.id === 'premium' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg shadow-amber-500/25">
                    10× Usage
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl mb-2 text-stone-800 dark:text-stone-100" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>{plan.name}</h3>
                <p className="mb-6 text-stone-500 dark:text-stone-400">{plan.description}</p>
                
                <div className="mb-4">
                  {plan.id !== 'free' && billingCycle === 'monthly' ? (
                    <>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl font-semibold text-red-600 dark:text-red-400 line-through decoration-2 decoration-red-500">
                          ${plan.id === 'pro' ? '19.99' : '39.99'}
                        </span>
                        <span className="text-4xl font-bold text-stone-800 dark:text-stone-100">
                          ${plan.id === 'pro' ? '9.99' : '29.99'}
                        </span>
                        <span className="text-stone-500 dark:text-stone-400 text-sm">
                          /month <span className="text-rose-600 dark:text-rose-400 font-semibold">first month only</span>
                        </span>
                        <span className="text-xs text-stone-500 dark:text-stone-400">Then ${plan.id === 'pro' ? '19.99' : '39.99'}/mo</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-stone-800 dark:text-stone-100">
                        ${getPrice(plan)}
                      </span>
                      <span className="text-stone-500 dark:text-stone-400 ml-2">
                        /{billingCycle === 'yearly' ? 'year' : 'month'}
                      </span>
                    </>
                  )}
                </div>

                {getSavings(plan) > 0 && (
                  <div className="text-rose-600 dark:text-rose-400 text-sm font-medium mb-4">
                    Save {getSavings(plan)}% with yearly billing
                  </div>
                )}
              </div>

              <div className="mb-8">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-rose-500 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-stone-600 dark:text-stone-400">{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.limitations?.length > 0 && (
                  <ul className="space-y-2 mt-4 pt-4 border-t border-stone-200 dark:border-stone-600">
                    {plan.limitations.map((lim, i) => (
                      <li key={i} className="flex items-start text-sm text-stone-500 dark:text-stone-500">
                        <span className="mr-2">•</span>
                        <span>{lim}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                onClick={plan.id === currentPlan ? undefined : () => plan.buttonAction()}
                disabled={plan.id === currentPlan || processingPlan !== null}
                className={`w-full py-3 px-6 rounded-2xl font-bold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${
                    plan.id === currentPlan
                    ? 'bg-stone-100 dark:bg-stone-700 text-stone-500 cursor-not-allowed'
                    : plan.popular
                    ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white shadow-lg shadow-rose-500/25'
                    : 'bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-100'
                }`}
              >
                {plan.id === currentPlan ? (
                  'Current Plan'
                ) : processingPlan === plan.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" aria-hidden="true" />
                    Redirecting…
                  </span>
                ) : (
                  plan.buttonText
                )}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 sm:p-8 mb-10">
          <h2 className="text-xl font-extrabold text-stone-800 dark:text-stone-100 mb-6 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <div key={index} className="space-y-2">
                <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-sm">{faq.question}</h3>
                <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section - Different for logged-in users */}
        <div className="text-center bg-stone-800 dark:bg-stone-900 rounded-2xl p-8 sm:p-10">
          <h2 className="text-2xl font-extrabold text-white mb-3">
            {user ? 'Start writing with AI today' : 'Ready to improve your academic writing?'}
          </h2>
          <p className="text-stone-300 mb-6 max-w-xl mx-auto">
            {user 
              ? 'Head to your dashboard to start analyzing documents and finding citations.'
              : 'Get $10 off your first month. No commitment, cancel anytime.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <>
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-rose-500/25 transition-all"
                >
                  Go to Dashboard
                </button>
                <button 
                  onClick={() => onNavigate('contact')}
                  className="border-2 border-stone-500 hover:border-stone-400 text-white px-6 py-3 rounded-2xl font-semibold transition-colors"
                >
                  Contact Support
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => onNavigate('signup')}
                  className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-rose-500/25 transition-all"
                >
                  Get $10 Off
                </button>
                <button 
                  onClick={() => onNavigate('contact')}
                  className="border-2 border-stone-500 hover:border-stone-400 text-white px-6 py-3 rounded-2xl font-semibold transition-colors"
                >
                  Contact Sales
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default PricingPage;
