import React from 'react';
import StripeCheckout from './StripeCheckout';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: 'pro' | 'premium';
  billingCycle: 'monthly' | 'yearly';
  onSuccess: (subscriptionId: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  planType,
  billingCycle,
  onSuccess
}) => {
  if (!isOpen) return null;

  const handleSuccess = (subscriptionId: string) => {
    onSuccess(subscriptionId);
    onClose();
  };

  const handleError = (error: string) => {
    console.error('Payment error:', error);
    // You could show a toast notification here
  };

  const getPlanPrice = () => {
    const prices = {
      pro: { monthly: 19.99, yearly: 199.99 },
      premium: { monthly: 39.99, yearly: 399.99 }
    };
    return prices[planType][billingCycle];
  };

  const getPlanName = () => {
    return planType === 'pro' ? 'Pro' : 'Premium';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Subscribe to {getPlanName()}
              </h2>
              <p className="text-gray-600 mt-1">
                {billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} billing
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Pricing Display */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">
              £{getPlanPrice()}
            </div>
            <div className="text-gray-600">
              per {billingCycle === 'monthly' ? 'month' : 'year'}
            </div>
            {billingCycle === 'yearly' && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Save 17% with yearly billing
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Form */}
        <div className="p-6">
          <StripeCheckout
            planType={planType}
            billingCycle={billingCycle}
            onError={handleError}
            onCancel={onClose}
          />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Your payment is secure and encrypted. You can cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
