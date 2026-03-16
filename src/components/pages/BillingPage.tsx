import React, { useState, useEffect } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';

interface BillingPageProps {
  onNavigate?: (page: string) => void;
  user?: { name: string; email: string } | null;
  onLogout?: () => void;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
  stripePriceId: string;
  description: string;
  icon: string;
}

interface UsageStats {
  documentsUploaded: number;
  documentsAnalyzed: number;
  citationSearchesUsed?: number;
  studyPacksGenerated?: number;
  storageUsed: number;
  storageLimit: number;
  uploadsRemaining: number;
  analysesRemaining: number;
  combinedActionsUsed?: number;
  combinedActionsRemaining?: number;
  combinedWordsUsed?: number;
  combinedWordsRemaining?: number;
  plan?: string;
}

const BillingPage: React.FC<BillingPageProps> = ({ onNavigate, user, onLogout }) => {
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isTrialEligible, setIsTrialEligible] = useState<boolean>(true);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    documentsUploaded: 0,
    documentsAnalyzed: 0,
    storageUsed: 0,
    storageLimit: 1024 * 1024, // 1MB in bytes
    uploadsRemaining: 3,
    analysesRemaining: 1
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: 'month',
      description: 'Perfect for getting started',
      icon: '🆓',
      features: [
        '3 documents, 3 analyses, 2 study packs/mo',
        '5k words Humanizer & Summarizer',
        '2 citation searches/mo',
        'Basic grammar check'
      ],
      stripePriceId: ''
    },
    {
      id: 'pro',
      name: 'Pro',
      price: billingCycle === 'monthly' ? 19.99 : 199.99,
      interval: billingCycle === 'monthly' ? 'month' : 'year',
      description: 'Most popular for students',
      icon: '🚀',
      features: [
        'Unlimited documents',
        '99 combined analyses, study packs & citations/mo',
        '99,999 words Humanizer & Summarizer',
        'All citation styles, PDF/Word export',
        'Focus Mode (20 sites)',
        'Quiz, flashcards, crossword & Crater Blast',
        'Humanizer & Summarizer (all styles & lengths)'
      ],
      popular: true,
      stripePriceId: billingCycle === 'monthly' ? 'price_starter_monthly' : 'price_starter_yearly'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: billingCycle === 'monthly' ? 39.99 : 399.99,
      interval: billingCycle === 'monthly' ? 'month' : 'year',
      description: 'For researchers and institutions',
      icon: '⭐',
      features: [
        'Everything in Pro, 10× usage',
        '999 combined analyses, study packs & citations/mo',
        '999,999 words Humanizer & Summarizer',
        'Premium AI model, advanced essay analysis',
        'Priority support',
        'Focus Mode (unlimited sites)',
        'Larger document uploads (up to 1GB)'
      ],
      stripePriceId: billingCycle === 'monthly' ? 'price_premium_monthly' : 'price_premium_yearly'
    }
  ];

  useEffect(() => {
    fetchSubscriptionData();
    checkTrialEligibility();
  }, []);

  const checkTrialEligibility = async () => {
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

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      // Fetch current subscription
      const subscriptionResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/subscriptions/current`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        setCurrentPlan(subscriptionData.plan || 'free');
      }

      // Fetch usage stats
      const usageResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/subscriptions/usage`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        setUsageStats(usageData);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setError('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') return;
    
    try {
      setProcessing(planId);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      
      // Check if user already has a subscription (not free plan)
      if (currentPlan !== 'free') {
        // User has existing subscription - redirect to billing portal to manage/change plan
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/subscriptions/billing-portal`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            returnUrl: `${window.location.origin}/billing`
          })
        });

        const data = await response.json();
        
        if (data.success && data.url) {
          window.location.href = data.url;
        } else {
          throw new Error(data.message || 'Failed to create billing portal session');
        }
      } else {
        // User is on free plan - create new checkout session
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/subscriptions/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            planType: planId,
            billingCycle: billingCycle,
            successUrl: `${window.location.origin}/billing?success=true`,
            cancelUrl: `${window.location.origin}/billing?canceled=true`
          })
        });

        const data = await response.json();
        
        if (data.success && data.data?.checkoutUrl) {
          window.location.href = data.data.checkoutUrl;
        } else {
          throw new Error(data.message || 'Failed to create checkout session');
        }
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      setError(error instanceof Error ? error.message : 'Failed to upgrade plan');
    } finally {
      setProcessing(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      setProcessing('billing');
      setError(null);
      
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/subscriptions/billing-portal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.message || 'Failed to open billing portal');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      setError(error instanceof Error ? error.message : 'Failed to open billing portal');
    } finally {
      setProcessing(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStoragePercentage = () => {
    return Math.min((usageStats.storageUsed / usageStats.storageLimit) * 100, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
        <Header 
          onNavigate={onNavigate} 
          user={user} 
          onLogout={onLogout}
          currentPage="billing"
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
            <p className="text-stone-600">Loading billing information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)' }}>
      <Header 
        onNavigate={onNavigate} 
        user={user} 
        onLogout={onLogout}
        currentPage="billing"
      />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl text-stone-800 mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>
            Billing & Subscription
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-6">
            Manage your subscription and view your usage
          </p>
          
          {/* Current Plan Badge */}
          <div className="inline-flex items-center bg-stone-50 rounded-xl px-5 py-3 border border-stone-200">
            <span className="text-sm font-medium text-stone-600 mr-2">Current Plan:</span>
            <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
              currentPlan === 'free' 
                ? 'bg-stone-200 text-stone-800' 
                : 'bg-violet-100 text-violet-800'
            }`}>
              {plans.find(p => p.id === currentPlan)?.name}
            </span>
          </div>
        </div>

        {/* Billing Management */}
        {currentPlan !== 'free' && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 mb-8">
            <h2 className="text-xl font-bold text-stone-800 mb-4">Billing Management</h2>
            <p className="text-stone-600 text-sm mb-6">Manage your payment methods, view invoices, and update billing details.</p>
            <button
              onClick={handleManageBilling}
              disabled={processing === 'billing'}
              className="bg-stone-800 text-white py-3 px-6 rounded-full font-medium hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing === 'billing' ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Opening...
                </div>
              ) : (
                'Manage Billing & Invoices'
              )}
            </button>
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center mb-10">
          <div className="bg-stone-100 rounded-xl p-1.5 flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Bill Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center ${
                billingCycle === 'yearly'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Bill Yearly
              <span className="ml-2 px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full font-medium">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white border rounded-2xl p-6 transition-all ${
                plan.popular 
                  ? 'border-violet-500 ring-2 ring-violet-100' 
                  : 'border-stone-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              {plan.id === 'premium' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-1 rounded-full text-xs font-semibold shadow-md shadow-amber-500/20">
                    10× Usage
                  </span>
                </div>
              )}

              {/* Plan Name & Description */}
              <div className="text-center mb-6 pt-2">
                <h3 className="text-xl font-bold text-stone-800 mb-1">{plan.name}</h3>
                <p className="text-stone-500 text-sm">{plan.description}</p>
              </div>
              
              {/* Price */}
              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-stone-800">
                  ${plan.price}
                </span>
                <span className="text-stone-500 text-sm">
                  /{plan.interval}
                </span>
              </div>

              {/* Features */}
              <div className="mb-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <svg className="w-5 h-5 text-violet-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-stone-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trial badge for paid plans */}
              {plan.id !== 'free' && currentPlan === 'free' && isTrialEligible && (
                <div className="mb-4">
                  <span className="bg-violet-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    7-Day Free Trial
                  </span>
                </div>
              )}

              {/* CTA Button */}
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={plan.id === currentPlan || processing === plan.id}
                className={`w-full py-3 px-6 rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  plan.id === currentPlan
                    ? 'bg-stone-100 text-stone-500 cursor-not-allowed'
                    : plan.popular
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-900'
                }`}
              >
                {plan.id === currentPlan ? (
                  'Current Plan'
                ) : processing === plan.id ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : plan.id === 'free' ? (
                  'Stay Free'
                ) : currentPlan === 'free' ? (
                  isTrialEligible ? 'Try for Free' : `Upgrade to ${plan.name}`
                ) : (
                  `Switch to ${plan.name}`
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Usage Stats Section */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-stone-800 mb-6">Your Usage Overview</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Storage Usage */}
            <div className="bg-violet-50 border border-violet-100 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-stone-800 text-sm">Storage Used</h3>
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-stone-800 mb-1">
                {formatBytes(usageStats.storageUsed)}
              </div>
              <div className="text-xs text-stone-500 mb-3">
                of {formatBytes(usageStats.storageLimit)} used
              </div>
              <div className="w-full bg-violet-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all ${
                    getStoragePercentage() > 90 ? 'bg-red-500' : 
                    getStoragePercentage() > 70 ? 'bg-amber-500' : 'bg-violet-600'
                  }`}
                  style={{ width: `${getStoragePercentage()}%` }}
                ></div>
              </div>
            </div>

            {/* Uploads Remaining */}
            <div className="bg-violet-50 border border-violet-100 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-stone-800 text-sm">Uploads</h3>
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-stone-800 mb-1">
                {usageStats.uploadsRemaining === -1 ? '∞' : usageStats.uploadsRemaining}
              </div>
              <div className="text-xs text-stone-500">
                {currentPlan === 'free' ? 'uploads remaining' : 'unlimited uploads'}
              </div>
            </div>

            {/* Combined Actions (Pro/Premium) or Analyses (Free) */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-stone-800 text-sm">
                  {currentPlan === 'pro' || currentPlan === 'premium' ? 'Combined actions' : 'Analyses'}
                </h3>
                <div className="w-8 h-8 bg-stone-200 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-stone-800 mb-1">
                {(currentPlan === 'pro' || currentPlan === 'premium') && usageStats.combinedActionsRemaining != null
                  ? (usageStats.combinedActionsRemaining === -1 ? '∞' : usageStats.combinedActionsRemaining)
                  : (usageStats.analysesRemaining === -1 ? '∞' : usageStats.analysesRemaining)}
              </div>
              <div className="text-xs text-stone-500">
                {currentPlan === 'free' ? 'analyses remaining' : currentPlan === 'pro' ? '99 combined/month' : '999 combined/month (10× Pro)'}
              </div>
            </div>

            {/* Documents Analyzed */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-stone-800 text-sm">Documents</h3>
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-stone-800 mb-1">
                {usageStats.documentsAnalyzed}
              </div>
              <div className="text-xs text-stone-500">total analyzed</div>
            </div>
          </div>
        </div>


        {/* Trust Indicators */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-stone-800 text-sm">Secure Payments</h3>
                <p className="text-xs text-stone-500">Processed through Stripe</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-stone-800 text-sm">Cancel Anytime</h3>
                <p className="text-xs text-stone-500">No hidden fees</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-stone-800 text-sm">24/7 Support</h3>
                <p className="text-xs text-stone-500">Help when you need it</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default BillingPage;