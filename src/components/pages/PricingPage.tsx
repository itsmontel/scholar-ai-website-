import { useState, useEffect } from 'react';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';

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
    if (!user) {
      setIsTrialEligible(true);
      return;
    }
    const token = localStorage.getItem('authToken');
    const base = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}`;
    const headers = { Authorization: `Bearer ${token}` } as const;
    let cancelled = false;

    (async () => {
      try {
        const [planRes, trialRes] = await Promise.all([
          fetch(`${base}/subscriptions/current`, { headers }),
          fetch(`${base}/subscriptions/trial-eligibility`, { headers }),
        ]);
        if (cancelled) return;
        if (planRes.ok) {
          const data = await planRes.json();
          setCurrentPlan(data.plan || 'free');
        }
        if (trialRes.ok) {
          const data = await trialRes.json();
          setIsTrialEligible(data.off10Eligible ?? data.eligible ?? false);
        }
      } catch (error) {
        console.error('Error loading pricing subscription data:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const isCurrentPlanId = (id: string) =>
    (id === 'free' && currentPlan === 'free') ||
    (id === 'pro' && currentPlan === 'pro') ||
    (id === 'premium' && currentPlan === 'premium');

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
            planType: planId,
            billingCycle: billingCycle as 'monthly' | 'yearly',
            successUrl: `${window.location.origin}/dashboard?payment=success`,
            cancelUrl: `${window.location.origin}/dashboard?payment=cancelled`
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
        '2MB document library storage',
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
        '49 combined analyses, study packs & citations/mo',
        '999,999 words Paper Summarizer',
        'All citation styles, PDF/Word export',
        'Focus Mode (unlimited blocked sites)',
        'Quiz, flashcards, crossword & Crater Blast',
        '100MB total library storage; uploads up to 100MB per file',
        'Full annotations & feedback; Apply WriteScholar revisions into your draft'
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
      description: 'Higher limits + more storage',
      monthlyPrice: 39.99,
      yearlyPrice: 399.99,
      features: [
        'Everything in Pro',
        '199 combined analyses, study packs & citations/mo — great for heavy citation use',
        'Summarise unlimited research papers',
        '1GB total document library storage'
      ],
      limitations: [],
      popular: false,
      buttonText: !user
        ? 'Get $10 Off Premium'
        : (currentPlan === 'free'
          ? (isTrialEligible ? 'Get $10 Off' : 'Upgrade to Premium')
          : 'Switch to Premium'),
      buttonAction: () => handlePlanAction('premium')
    }
  ];

  const faqs = [
    {
      question: "How does the $10 off work?",
      answer: "First-time subscribers get $10 off their first month on Pro or Premium (e.g. Pro $9.99 then $19.99/mo; Premium $29.99 then $39.99/mo). The discount is applied automatically at checkout. Each email address can only use the offer once."
    },
    {
      question: "What's included in the free plan?",
        answer: "The free plan includes 3 documents per month, 2 AI essay analyses, 2 study pack generations (lesson, flashcards & quiz included — crossword & Crater Blast unlock with Pro), 5,000 words for the Paper Summarizer, 2 citation searches, and 2MB document library storage. It's perfect for students just getting started."
    },
    {
      question: "What does Pro include?",
      answer: "Pro includes 49 combined actions per month (analyses, study packs & citations), 999,999 words for the Paper Summarizer, unlimited Focus Mode blocked sites, uploads up to 100MB per file, 100MB total library storage, all citation styles, full annotations and feedback, Apply WriteScholar revisions into your draft, and full access to quizzes, flashcards, crossword & Crater Blast."
    },
    {
      question: "What does Premium add?",
      answer: "Premium includes everything in Pro with 4× usage: 199 combined actions per month, unlimited research-paper summarisation, and 1GB total library storage for your document library."
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
    <div className="relative min-h-screen overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="pricing" />

      {/* Hero + plans — same surface treatment as landing pricing section */}
      <section
        className="relative py-16 sm:py-24 overflow-hidden border-b border-stone-200/90 dark:border-stone-800"
        aria-labelledby="pricing-page-heading"
      >
        <div className="absolute inset-0 bg-[#f8fafc] dark:bg-[#0c0a09]" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-[#f1f5f9] via-white to-[#f8fafc] dark:from-stone-950 dark:via-stone-950 dark:to-stone-900 pointer-events-none" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-12%,rgba(91,33,182,0.08),transparent_55%)] dark:bg-[radial-gradient(ellipse_85%_50%_at_50%_-8%,rgba(109,40,217,0.12),transparent_58%)] pointer-events-none" aria-hidden />
        <div
          className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15] pointer-events-none bg-[length:32px_32px] bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.07)_1px,transparent_1px)]"
          aria-hidden
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-violet-800/90 dark:text-violet-300/95 mb-3">
              Pricing
            </p>
            <div className="mx-auto mb-4 h-0.5 w-16 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 opacity-90 dark:opacity-85" aria-hidden />
            <h1
              id="pricing-page-heading"
              className="text-2xl sm:text-3xl lg:text-[2.35rem] font-semibold text-stone-900 dark:text-stone-100 mb-4 tracking-tight leading-tight"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              Simple, transparent pricing
            </h1>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
              Start free, upgrade when you need more analyses, citations, and study tools.
            </p>
          </div>

          <div className="flex flex-col items-center mb-10 sm:mb-12">
            <div className="inline-flex rounded-xl border border-violet-200/90 dark:border-violet-700/60 bg-white/90 dark:bg-stone-800/90 backdrop-blur-sm p-1 shadow-sm ring-1 ring-violet-500/10">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 sm:px-6 py-2.5 rounded-[0.65rem] text-sm sm:text-base font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-900/20'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                Bill monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 sm:px-6 py-2.5 rounded-[0.65rem] text-sm sm:text-base font-semibold transition-all flex items-center gap-2 ${
                  billingCycle === 'yearly'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-900/20'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                Bill yearly
                <span
                  className={`px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded-full ${
                    billingCycle === 'yearly'
                      ? 'bg-white/20 text-white'
                      : 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-400'
                  }`}
                >
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 sm:p-8 flex flex-col transition-shadow hover:shadow-[0_20px_50px_-20px_rgba(15,23,42,0.15)] dark:hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.5)] ${
                plan.popular
                  ? 'border border-violet-500/90 dark:border-violet-500/70 bg-white/85 dark:bg-stone-900/55 shadow-[0_12px_40px_-12px_rgba(91,33,182,0.18)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] ring-2 ring-violet-200/80 dark:ring-violet-800/60'
                  : plan.id === 'premium'
                  ? 'border border-amber-400/90 dark:border-amber-500/60 bg-gradient-to-b from-amber-50/90 to-white/90 dark:from-amber-950/40 dark:to-stone-900/55 shadow-[0_12px_40px_-12px_rgba(180,83,9,0.15)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] ring-2 ring-amber-200/80 dark:ring-amber-800/50 sm:col-span-2 lg:col-span-1'
                  : 'border border-stone-200/90 dark:border-stone-700/90 bg-white/80 dark:bg-stone-900/50 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.1)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.4)] ring-1 ring-white/50 dark:ring-white/5'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-violet-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md shadow-violet-500/25">
                    Most popular
                  </span>
                </div>
              )}
              {plan.id === 'premium' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 px-3 py-1 rounded-full text-xs font-bold shadow-md shadow-amber-500/30 ring-1 ring-amber-400/50">
                    4× usage
                  </span>
                </div>
              )}
              <div className={`text-center mb-6 ${plan.popular || plan.id === 'premium' ? 'pt-1' : ''}`}>
                <h3
                  className="text-xl font-semibold mb-1 text-stone-900 dark:text-stone-100"
                  style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                >
                  {plan.name}
                </h3>
                <p className="mb-6 text-sm text-stone-500 dark:text-stone-400">{plan.description}</p>
                
                <div className="mb-4">
                  {plan.id !== 'free' && billingCycle === 'monthly' ? (
                    <>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl font-semibold text-red-600 dark:text-red-400 line-through decoration-2 decoration-red-500">
                          ${plan.monthlyPrice.toFixed(2)}
                        </span>
                        <span className="text-4xl font-bold text-stone-800 dark:text-stone-100">
                          ${(plan.monthlyPrice - 10).toFixed(2)}
                        </span>
                        <span className="text-stone-500 dark:text-stone-400 text-sm">
                          /month <span className="text-violet-600 dark:text-violet-400 font-semibold">first month only</span>
                        </span>
                        <span className="text-xs text-stone-500 dark:text-stone-400">Then ${plan.monthlyPrice.toFixed(2)}/mo</span>
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
                  <div className="text-violet-600 dark:text-violet-400 text-sm font-medium mb-4">
                    Save {getSavings(plan)}% with yearly billing
                  </div>
                )}
              </div>

              <div className="mb-8">
                <ul className="space-y-2.5">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm sm:text-[0.9375rem]">
                      <svg
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          plan.id === 'premium'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-violet-500 dark:text-violet-400'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
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
                type="button"
                onClick={isCurrentPlanId(plan.id) ? undefined : () => plan.buttonAction()}
                disabled={isCurrentPlanId(plan.id) || processingPlan !== null}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${
                  isCurrentPlanId(plan.id)
                    ? 'bg-stone-100 dark:bg-stone-700 text-stone-500 cursor-not-allowed'
                    : plan.popular
                      ? 'bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white shadow-md shadow-violet-900/15 dark:shadow-violet-950/40 ring-1 ring-violet-900/10 dark:ring-white/10'
                      : plan.id === 'premium'
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 shadow-md shadow-amber-900/15 ring-1 ring-amber-700/20'
                        : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 ring-1 ring-stone-200/80 dark:ring-stone-600/80'
                }`}
              >
                {isCurrentPlanId(plan.id) ? (
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
        </div>
      </section>

      {/* FAQ — landing FAQ / editorial theme */}
      <section
        className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800"
        aria-labelledby="pricing-faq-heading"
      >
        <div className="absolute inset-0 bg-[#f8fafc] dark:bg-[#0c0a09]" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f8fafc] to-[#f1f5f9] dark:from-stone-950 dark:via-stone-950 dark:to-stone-950 pointer-events-none" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(91,33,182,0.07),transparent_55%)] dark:bg-[radial-gradient(ellipse_90%_55%_at_50%_-10%,rgba(109,40,217,0.12),transparent_58%)] pointer-events-none" aria-hidden />
        <div
          className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15] pointer-events-none bg-[length:32px_32px] bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.07)_1px,transparent_1px)]"
          aria-hidden
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-violet-800/90 dark:text-violet-300/95 mb-3">
              FAQ
            </p>
            <div className="mx-auto mb-4 h-0.5 w-16 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 opacity-90 dark:opacity-85" aria-hidden />
            <h2
              id="pricing-faq-heading"
              className="text-2xl sm:text-3xl lg:text-[2.35rem] font-semibold text-stone-900 dark:text-stone-100 mb-4 tracking-tight leading-tight"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              Frequently Asked Questions
            </h2>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
              Billing, plans, and what&apos;s included.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200/90 dark:border-stone-700/90 bg-white/80 dark:bg-stone-900/50 p-6 sm:p-8 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.1)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.4)] ring-1 ring-white/50 dark:ring-white/5 backdrop-blur-sm">
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              {faqs.map((faq, index) => (
                <div key={index} className="space-y-2">
                  <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm leading-snug">{faq.question}</h3>
                  <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA — same glass card feel as landing “Get started” */}
      <section className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800">
        <div className="absolute inset-0 bg-[#f8fafc] dark:bg-[#0c0a09]" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-[#f1f5f9] via-white to-[#f8fafc] dark:from-stone-950 dark:via-stone-950 dark:to-stone-900 pointer-events-none" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_20%,rgba(91,33,182,0.06),transparent_50%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_15%,rgba(109,40,217,0.1),transparent_55%)] pointer-events-none" aria-hidden />
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.12] pointer-events-none bg-[length:32px_32px] bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.07)_1px,transparent_1px)]"
          aria-hidden
        />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center rounded-2xl border border-stone-200/90 dark:border-stone-800/90 bg-white/75 dark:bg-stone-900/45 px-6 py-10 sm:px-10 sm:py-12 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.12)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] backdrop-blur-[8px] ring-1 ring-white/50 dark:ring-white/5">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-violet-800/90 dark:text-violet-300/95 mb-3">
              Get started
            </p>
            <div className="mx-auto mb-5 h-0.5 w-16 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 opacity-90 dark:opacity-85" aria-hidden />
            <h2
              className="text-2xl sm:text-3xl lg:text-[2.35rem] font-semibold text-stone-900 dark:text-stone-50 mb-4 tracking-tight leading-[1.15]"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              {user ? 'Continue with WriteScholar' : 'Ready to improve your academic writing?'}
            </h2>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 mb-8 max-w-xl mx-auto leading-relaxed">
              {user
                ? 'Go to your dashboard to analyze documents, find citations, and use study tools.'
                : 'Get $10 off your first month on Pro or Premium. Cancel anytime.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigate('dashboard')}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white font-semibold rounded-xl shadow-md shadow-violet-900/15 dark:shadow-violet-950/40 ring-1 ring-violet-900/10 dark:ring-white/10 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 text-base"
                  >
                    Go to dashboard
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('contact')}
                    className="inline-flex items-center justify-center px-7 py-3.5 border border-stone-300/95 dark:border-stone-600 bg-white/90 dark:bg-stone-900/50 text-stone-800 dark:text-stone-200 font-medium rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-base shadow-sm"
                  >
                    Contact support
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigate('signup')}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white font-semibold rounded-xl shadow-md shadow-violet-900/15 dark:shadow-violet-950/40 ring-1 ring-violet-900/10 dark:ring-white/10 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 text-base"
                  >
                    Get $10 off
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('contact')}
                    className="inline-flex items-center justify-center px-7 py-3.5 border border-stone-300/95 dark:border-stone-600 bg-white/90 dark:bg-stone-900/50 text-stone-800 dark:text-stone-200 font-medium rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-base shadow-sm"
                  >
                    Contact us
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default PricingPage;
