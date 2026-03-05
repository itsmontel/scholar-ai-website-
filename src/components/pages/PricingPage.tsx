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
  const [isTrialEligible, setIsTrialEligible] = useState<boolean>(true);
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
      buttonText: !user 
        ? 'Start 7-Day Free Trial' 
        : (currentPlan === 'free' 
          ? (isTrialEligible ? 'Start 7-Day Free Trial' : 'Upgrade to Starter') 
          : 'Switch to Starter'),
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
      buttonText: !user 
        ? 'Start 7-Day Free Trial' 
        : (currentPlan === 'free' 
          ? (isTrialEligible ? 'Start 7-Day Free Trial' : 'Upgrade to Premium') 
          : 'Switch to Premium'),
      buttonAction: () => handlePlanAction('premium')
    }
  ];

  const faqs = [
    {
      question: "How does the 7-day free trial work?",
      answer: "New users get a 7-day free trial on Starter or Premium plans. Your card is collected at checkout but won't be charged until the trial ends. Cancel anytime during the trial to avoid charges. Each email address can only use one free trial."
    },
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="pricing" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl text-stone-800 mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
            Simple, <span className="text-lime-600 italic">transparent</span> pricing
          </h1>
          <p className="text-lg text-stone-500 mb-8 max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade anytime.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-12">
            <div className="bg-stone-100 rounded-full p-1.5 flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2.5 rounded-full text-base font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-stone-800 shadow-sm'
                    : 'text-stone-600 hover:text-stone-800'
                }`}
              >
                Bill Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2.5 rounded-full text-base font-semibold transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-stone-800 shadow-sm'
                    : 'text-stone-600 hover:text-stone-800'
                }`}
              >
                Bill Yearly
                <span className="ml-2 px-2 py-1 bg-lime-100 text-lime-700 text-xs rounded-full">
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
                  ? 'border-lime-500 ring-2 ring-lime-200'
                  : 'border-stone-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-lime-500 text-stone-900 px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              {/* Trial badge for paid plans */}
              {plan.id !== 'free' && currentPlan === 'free' && isTrialEligible && (
                <div className="absolute -top-4 right-4">
                  <span className="bg-violet-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    7-Day Free Trial
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl text-stone-800 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>{plan.name}</h3>
                <p className="text-stone-500 mb-6">{plan.description}</p>
                
                <div className="mb-4">
                  <span className="text-4xl font-bold text-stone-800">
                    ${getPrice(plan)}
                  </span>
                  <span className="text-stone-500 ml-2">
                    /{billingCycle === 'yearly' ? 'year' : 'month'}
                  </span>
                </div>

                {getSavings(plan) > 0 && (
                  <div className="text-lime-600 text-sm font-medium mb-4">
                    Save {getSavings(plan)}% with yearly billing
                  </div>
                )}
              </div>

              <div className="mb-8">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-lime-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-stone-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={plan.id === currentPlan ? undefined : plan.buttonAction}
                disabled={plan.id === currentPlan}
                className={`w-full py-3 px-6 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  plan.id === currentPlan
                    ? 'bg-stone-100 text-stone-500 cursor-not-allowed'
                    : plan.popular
                    ? 'bg-lime-400 hover:bg-lime-300 text-stone-900'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                }`}
              >
                {plan.id === currentPlan ? 'Current Plan' : plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 mb-10">
          <h2 className="text-xl text-stone-800 mb-6 text-center" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <div key={index} className="space-y-2">
                <h3 className="font-semibold text-stone-800 text-sm">{faq.question}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section - Different for logged-in users */}
        <div className="text-center bg-stone-800 rounded-2xl p-8 sm:p-10">
          <h2 className="text-2xl text-white mb-3" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
            {user ? 'Start writing with AI today' : 'Ready to improve your academic writing?'}
          </h2>
          <p className="text-stone-300 mb-6 max-w-xl mx-auto">
            {user 
              ? 'Head to your dashboard to start analyzing documents and finding citations.'
              : 'Start your 7-day free trial today. No commitment, cancel anytime.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <>
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className="bg-lime-400 hover:bg-lime-300 text-stone-900 px-6 py-3 rounded-full font-semibold transition-colors"
                >
                  Go to Dashboard
                </button>
                <button 
                  onClick={() => onNavigate('contact')}
                  className="border border-stone-500 hover:border-stone-400 text-white px-6 py-3 rounded-full font-semibold transition-colors"
                >
                  Contact Support
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => onNavigate('signup')}
                  className="bg-lime-400 hover:bg-lime-300 text-stone-900 px-6 py-3 rounded-full font-semibold transition-colors"
                >
                  Start Free Trial
                </button>
                <button 
                  onClick={() => onNavigate('contact')}
                  className="border border-stone-500 hover:border-stone-400 text-white px-6 py-3 rounded-full font-semibold transition-colors"
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
