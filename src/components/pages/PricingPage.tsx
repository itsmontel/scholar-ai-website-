import { useState, useEffect } from 'react';
import {
  FREE_PLAN_DESCRIPTION,
  FREE_PLAN_FEATURE_BULLETS,
  FREE_PLAN_LIMITATIONS,
  FREE_PLAN_FAQ_ANSWER,
} from '../../constants/freePlanCopy';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';

interface PricingPageProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

/** Auto-applied welcome discount for first-time customers: 50% off the
 *  first monthly invoice (Pro $19.99 → $9.99, Premium $39.99 → $19.99).
 *  The backend strips the code for anyone with prior subscription
 *  history, so showing it optimistically here is safe. */
const WELCOME_PROMO_CODE = 'NEWCUSTOMER';
const FIRST_MONTH_PRICE: Record<string, number> = { pro: 9.99, premium: 19.99 };

const PricingPage = ({ onNavigate, user, onLogout }: PricingPageProps) => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  // Logged-out visitors are treated as new customers (the discount is
  // the acquisition pitch); logged-in users get a real eligibility check.
  const [newCustomer, setNewCustomer] = useState<boolean>(true);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('authToken');
    const base = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}`;
    const headers = { Authorization: `Bearer ${token}` } as const;
    let cancelled = false;

    (async () => {
      try {
        const [planRes, eligRes] = await Promise.all([
          fetch(`${base}/subscriptions/current`, { headers }),
          fetch(`${base}/subscriptions/trial-eligibility`, { headers }),
        ]);
        if (cancelled) return;
        if (planRes.ok) {
          const data = await planRes.json();
          setCurrentPlan(data.plan || 'free');
        }
        if (eligRes.ok) {
          const elig = await eligRes.json();
          setNewCustomer(elig.trialEligible === true);
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
            cancelUrl: `${window.location.origin}/dashboard?payment=cancelled`,
            // Auto-apply the new-customer first-month discount on monthly
            // plans (coupon is 50% off the first invoice — applying it to
            // yearly would halve the whole year). Backend re-verifies
            // eligibility and strips it for returning subscribers.
            ...(newCustomer && billingCycle === 'monthly' ? { promoCode: WELCOME_PROMO_CODE } : {}),
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
      description: FREE_PLAN_DESCRIPTION,
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [...FREE_PLAN_FEATURE_BULLETS],
      limitations: [...FREE_PLAN_LIMITATIONS],
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
        '99 combined analyses, study packs & citations/mo',
        '999,999 words Paper Summarizer',
        'All citation styles, PDF/Word export',
        'Quiz, flashcards, crossword & Crater Blast',
        '100MB total library storage; uploads up to 100MB per file',
        'Full annotations & feedback; Apply WriteScholar revisions into your draft'
      ],
      limitations: [],
      popular: true,
      buttonText: !user
        ? 'Start with Pro'
        : currentPlan === 'free'
          ? 'Upgrade to Pro'
          : 'Switch to Pro',
      buttonAction: () => handlePlanAction('pro'),
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Higher limits + more storage',
      monthlyPrice: 39.99,
      yearlyPrice: 399.99,
      features: [
        'Everything in Pro',
        '499 combined analyses, study packs & citations/mo — great for heavy citation use',
        'Summarise unlimited research papers',
        '1GB total document library storage'
      ],
      limitations: [],
      popular: false,
      buttonText: !user
        ? 'Start with Premium'
        : currentPlan === 'free'
          ? 'Upgrade to Premium'
          : 'Switch to Premium',
      buttonAction: () => handlePlanAction('premium'),
    }
  ];

  const faqs = [
    {
      question: "What's included in the free plan?",
        answer: FREE_PLAN_FAQ_ANSWER
    },
    {
      question: "What does Pro include?",
      answer: "Pro includes 99 combined actions per month (analyses, study packs & citations), 999,999 words for the Paper Summarizer, uploads up to 100MB per file, 100MB total library storage, all citation styles, full annotations and feedback, Apply WriteScholar revisions into your draft, and full access to quizzes, flashcards, crossword & Crater Blast."
    },
    {
      question: "What does Premium add?",
      answer: "Premium includes everything in Pro with 5× usage: 499 combined actions per month, unlimited research-paper summarisation, and 1GB total library storage for your document library."
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

  const pricingContent = (
    <>
      {/* Hero + plans — same surface treatment as landing pricing section */}
      <section
        className="relative py-16 sm:py-24 overflow-hidden"
        aria-labelledby="pricing-page-heading"
      >
        <div className="absolute inset-0 bg-[#FAF7FF] dark:bg-stone-950" aria-hidden />

        {/* Mascot working on a laptop — top-right of the pricing hero. Tells
            users "this is what you'll be doing on Pro". Hidden on small screens. */}
        <img
          src="/mascot-laptop.webp"
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="hidden lg:block pointer-events-none absolute top-10 right-6 xl:right-12 w-44 xl:w-52 h-auto z-10"
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#A560E8] dark:text-[#A560E8] mb-3">
              Pricing
            </p>
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#A560E8]" aria-hidden />
            <h1
              id="pricing-page-heading"
              className="dash-serif text-[2rem] sm:text-[2.6rem] lg:text-[3rem] font-extrabold text-stone-900 dark:text-stone-50 mb-4 tracking-tight leading-[1.05]"
            >
              Simple, transparent pricing
            </h1>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed font-medium">
              Start free, upgrade when you need more analyses, citations, and study tools.
            </p>
          </div>

          <div className="flex flex-col items-center mb-10 sm:mb-12">
            <div className="inline-flex rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-1">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 sm:px-6 py-2.5 rounded-[0.65rem] text-sm sm:text-base font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-[#A560E8] text-white border-2 border-b-4 border-[#8A48C7] font-extrabold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                }`}
              >
                Bill monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 sm:px-6 py-2.5 rounded-[0.65rem] text-sm sm:text-base font-semibold transition-all flex items-center gap-2 ${
                  billingCycle === 'yearly'
                    ? 'bg-[#A560E8] text-white border-2 border-b-4 border-[#8A48C7] font-extrabold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                }`}
              >
                Bill yearly
                <span
                  className={`px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded-full ${
                    billingCycle === 'yearly'
                      ? 'bg-white/20 text-white'
                      : 'bg-[#F3EAFF] dark:bg-[#A560E8]/20 text-[#A560E8] dark:text-[#A560E8]'
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
              className={`relative rounded-3xl p-6 sm:p-8 flex flex-col transition-all duration-200 bg-white dark:bg-stone-900 hover:-translate-y-1 ${
                plan.popular
                  ? 'border-2 border-b-4 border-[#A560E8] dark:border-[#A560E8] ring-2 ring-[#A560E8]/20 shadow-[0_26px_54px_-24px_rgba(165,96,232,0.5)]'
                  : plan.id === 'premium'
                  ? 'border-2 border-b-4 border-[#FFC800] dark:border-[#FFC800] bg-[#FFFAE5] dark:bg-stone-900 sm:col-span-2 lg:col-span-1 shadow-[0_18px_44px_-24px_rgba(255,200,0,0.40)]'
                  : 'border-2 border-b-4 border-stone-200 dark:border-stone-700 shadow-[0_12px_34px_-22px_rgba(0,0,0,0.16)]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#A560E8] text-white px-3 py-1 rounded-xl text-xs font-extrabold border-2 border-[#8A48C7]">
                    Most popular
                  </span>
                </div>
              )}
              {plan.id === 'premium' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#FFC800] text-[#6B27A3] px-3 py-1 rounded-xl text-xs font-extrabold border-2 border-[#D4A300]">
                    5× usage
                  </span>
                </div>
              )}
              <div className={`text-center mb-6 ${plan.popular || plan.id === 'premium' ? 'pt-1' : ''}`}>
                <h3
                  className="text-xl font-extrabold mb-1 text-stone-900 dark:text-stone-100"
                >
                  {plan.name}
                </h3>
                <p className="mb-6 text-sm text-stone-500 dark:text-stone-400">{plan.description}</p>
                
                <div className="mb-4">
                  {plan.id !== 'free' && billingCycle === 'monthly' ? (
                    newCustomer ? (
                      /* New-customer monthly display — leads with the
                         NEWCUSTOMER first-month price (Pro $9.99,
                         Premium $19.99), anchored against the standard
                         monthly price, with the renewal price spelled
                         out underneath. The coupon is auto-applied at
                         checkout so this is exactly what Stripe charges. */
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl font-semibold text-stone-400 dark:text-stone-500 line-through decoration-2">
                          ${plan.monthlyPrice.toFixed(2)}
                        </span>
                        <span className="text-4xl font-bold text-stone-800 dark:text-stone-100">
                          ${(FIRST_MONTH_PRICE[plan.id] ?? plan.monthlyPrice).toFixed(2)}
                        </span>
                        <span className="text-stone-500 dark:text-stone-400 text-sm">
                          first month, then ${plan.monthlyPrice.toFixed(2)}/mo
                        </span>
                        <span className="text-[#46A302] text-xs font-extrabold">
                          NEWCUSTOMER discount applied at checkout
                        </span>
                      </div>
                    ) : (
                      /* Returning customers see the plain standard price. */
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-4xl font-bold text-stone-800 dark:text-stone-100">
                          ${plan.monthlyPrice.toFixed(2)}
                        </span>
                        <span className="text-stone-500 dark:text-stone-400 text-sm">
                          /month
                        </span>
                      </div>
                    )
                  ) : plan.id !== 'free' && billingCycle === 'yearly' ? (
                    /* Yearly price display:
                       • Struck-through "was" price = yearlyPrice + $100
                         (Pro: $299.99 → $199.99 ; Premium: $499.99 → $399.99).
                       • Active price = the real plan.yearlyPrice from
                         the plans data. */
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl font-semibold text-stone-400 dark:text-stone-500 line-through decoration-2">
                        ${(plan.yearlyPrice + 100).toFixed(2)}
                      </span>
                      <span className="text-4xl font-bold text-stone-800 dark:text-stone-100">
                        ${plan.yearlyPrice.toFixed(2)}
                      </span>
                      <span className="text-stone-500 dark:text-stone-400 text-sm">
                        /year
                      </span>
                    </div>
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
                  <div className="text-[#A560E8] text-sm font-extrabold mb-4">
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
                            ? 'text-[#D4A300]'
                            : 'text-[#A560E8]'
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
                className={`w-full py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isCurrentPlanId(plan.id)
                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 border-2 border-stone-200 dark:border-stone-700 cursor-not-allowed font-extrabold'
                    : plan.popular
                      ? 'bg-[#A560E8] hover:bg-[#8A48C7] text-white font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#8A48C7] active:border-b-2 active:translate-y-0.5'
                      : plan.id === 'premium'
                        ? 'bg-[#FFC800] hover:bg-[#FFD52E] text-[#6B27A3] font-extrabold uppercase tracking-wide border-2 border-b-4 border-[#D4A300] active:border-b-2 active:translate-y-0.5'
                        : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 border-2 border-b-4 border-stone-200 dark:border-stone-600 font-extrabold active:border-b-2 active:translate-y-0.5'
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

              {/* Social proof — only on the popular plan, right under its CTA. */}
              {plan.popular && (
                <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] font-bold text-stone-500 dark:text-stone-400">
                  <span className="text-[#FFC800] tracking-tight" aria-hidden>★★★★★</span>
                  Join <span className="text-stone-700 dark:text-stone-200 font-extrabold tabular-nums">50,000+</span> students on Pro
                </p>
              )}
            </div>
          ))}
          </div>
        </div>
      </section>

      {/* FAQ — landing FAQ / editorial theme */}
      <section
        className="relative py-16 sm:py-24 overflow-hidden"
        aria-labelledby="pricing-faq-heading"
      >
        <div className="absolute inset-0 bg-white dark:bg-stone-950" aria-hidden />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#A560E8] dark:text-[#A560E8] mb-3">
              FAQ
            </p>
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#A560E8]" aria-hidden />
            <h2
              id="pricing-faq-heading"
              className="text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold text-stone-900 dark:text-stone-100 mb-4 tracking-tight leading-tight"
            >
              Frequently Asked Questions
            </h2>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
              Billing, plans, and what&apos;s included.
            </p>
          </div>

          <div className="rounded-3xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-[0_12px_34px_-22px_rgba(0,0,0,0.16)] p-6 sm:p-8">
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
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[#FAF7FF] dark:bg-stone-950" aria-hidden />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center rounded-3xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-[0_12px_34px_-22px_rgba(0,0,0,0.16)] px-6 py-10 sm:px-10 sm:py-12">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#A560E8] dark:text-[#A560E8] mb-3">
              Get started
            </p>
            <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-[#A560E8]" aria-hidden />
            <h2
              className="text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold text-stone-900 dark:text-stone-50 mb-4 tracking-tight leading-[1.15]"
            >
              {user ? 'Continue with WriteScholar' : 'Ready to improve your academic writing?'}
            </h2>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 mb-8 max-w-xl mx-auto leading-relaxed">
              {user
                ? 'Go to your dashboard to analyze documents, find citations, and use study tools.'
                : 'Subscribe to Pro or Premium anytime. Cancel anytime.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigate('dashboard')}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#A560E8] hover:bg-[#4CAF00] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#8A48C7] active:border-b-2 active:translate-y-0.5 transition-all duration-150 text-base"
                  >
                    Go to dashboard
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('contact')}
                    className="inline-flex items-center justify-center px-7 py-3.5 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-stone-200 dark:border-stone-600 active:border-b-2 active:translate-y-0.5 hover:bg-stone-50 dark:hover:bg-stone-700 transition-all duration-150 text-base"
                  >
                    Contact support
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigate('signup')}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#A560E8] hover:bg-[#4CAF00] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#8A48C7] active:border-b-2 active:translate-y-0.5 transition-all duration-150 text-base"
                  >
                    Sign up free
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('contact')}
                    className="inline-flex items-center justify-center px-7 py-3.5 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-stone-200 dark:border-stone-600 active:border-b-2 active:translate-y-0.5 hover:bg-stone-50 dark:hover:bg-stone-700 transition-all duration-150 text-base"
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
    </>
  );

  if (user) {
    return (
      <div className="bg-[#FAF7FF] dark:bg-stone-950" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
        {pricingContent}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#FAF7FF] dark:bg-stone-950" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="pricing" />
      {pricingContent}
    </div>
  );
};

export default PricingPage;
