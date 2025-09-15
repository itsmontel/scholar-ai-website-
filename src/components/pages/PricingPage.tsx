import { useState } from 'react';
import Header from '../common/Header';
import PaymentModal from '../payment/PaymentModal';

interface PricingPageProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

const PricingPage = ({ onNavigate, user, onLogout }: PricingPageProps) => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    planType: 'starter' | 'premium';
    billingCycle: 'monthly' | 'yearly';
  }>({
    isOpen: false,
    planType: 'starter',
    billingCycle: 'monthly'
  });

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        '5 documents per month',
        'Basic AI analysis',
        'Standard citation styles',
        'Email support',
        'Basic grammar check'
      ],
      limitations: [
        'Limited to 5 documents',
        'Basic analysis only',
        'No priority support'
      ],
      popular: false,
      buttonText: 'Get Started Free',
      buttonAction: () => onNavigate('signup')
    },
    {
      id: 'starter',
      name: 'Starter',
      description: 'Most popular for students',
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      features: [
        'Unlimited document uploads',
        'AI-powered analysis',
        'All citation styles',
        'Grammar and style checks',
        'Plagiarism detection',
        'Export in multiple file formats'
      ],
      limitations: [],
      popular: true,
      buttonText: 'Upgrade to Starter',
      buttonAction: () => {
        if (user) {
          setPaymentModal({
            isOpen: true,
            planType: 'starter',
            billingCycle: billingCycle as 'monthly' | 'yearly'
          });
        } else {
          onNavigate('signup');
        }
      }
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'For researchers and institutions',
      monthlyPrice: 39.99,
      yearlyPrice: 399.99,
      features: [
        'Everything in Starter',
        'Advanced AI analysis',
        'Advanced grammar and style checking',
        'Additional premium features'
      ],
      limitations: [],
      popular: false,
      buttonText: 'Upgrade to Pro',
      buttonAction: () => {
        if (user) {
          setPaymentModal({
            isOpen: true,
            planType: 'premium',
            billingCycle: billingCycle as 'monthly' | 'yearly'
          });
        } else {
          onNavigate('signup');
        }
      }
    }
  ];

  const faqs = [
    {
      question: "What's included in the free plan?",
      answer: "The free plan includes 5 document analyses per month, basic AI feedback, standard citation styles, and email support. It's perfect for students just getting started with academic writing."
    },
    {
      question: "What's the difference between Starter and Premium?",
      answer: "Starter includes unlimited documents, AI analysis, all citation styles, grammar checks, plagiarism detection, and multiple export formats. Premium adds advanced AI analysis, advanced grammar checking, and additional premium features."
    },
    {
      question: "Can I change my plan after subscribing?",
      answer: "No, plan changes are not available after subscription. Please choose your plan carefully as subscriptions are final and cannot be modified once activated."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept PayPal, Visa, and Mastercard payments processed securely through Stripe. All transactions are encrypted and secure."
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
    // You could show a success message or redirect to dashboard
    onNavigate('dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="pricing" />

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
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  billingCycle === 'yearly'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white/90 backdrop-blur-xl border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
                plan.popular 
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200/60'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
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
                onClick={plan.buttonAction}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                    plan.popular
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                {plan.buttonText}
                </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-12 shadow-lg">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about our pricing and plans.
                </p>
              </div>

          <div className="grid md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <div key={index} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to improve your academic writing?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of students and researchers who trust Scholar to help them achieve academic excellence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => onNavigate('signup')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Get Started Free
            </button>
            <button 
              onClick={() => onNavigate('contact')}
              className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-8 py-3 rounded-xl font-semibold transition-all duration-200"
            >
              Contact Sales
            </button>
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
    </div>
  );
};

export default PricingPage;