import React, { useState } from 'react';

interface StripeCheckoutProps {
  planType: 'pro' | 'premium';
  billingCycle: 'monthly' | 'yearly';
  onError: (error: string) => void;
  onCancel: () => void;
}

const StripeCheckout: React.FC<StripeCheckoutProps> = ({ 
  planType, 
  billingCycle, 
  onError, 
  onCancel 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [promoValidation, setPromoValidation] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoValidation(null);
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/subscriptions/validate-promo-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({ promoCode: promoCode.trim() })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setPromoValidation({
          valid: true,
          message: data.data.message
        });
      } else {
        setPromoValidation({
          valid: false,
          message: data.message || 'Invalid promo code'
        });
      }
    } catch (err) {
      setPromoValidation({
        valid: false,
        message: 'Failed to validate promo code'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleCheckout = async () => {
    setIsLoading(true);

    try {
      const successUrl = `${window.location.origin}/dashboard?payment=success`;
      const cancelUrl = `${window.location.origin}/dashboard?payment=cancelled`;

      // Create checkout session on backend - let backend handle price ID mapping
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/subscriptions/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          planType,
          billingCycle,
          successUrl,
          cancelUrl,
          promoCode: promoCode.trim() || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.data.checkoutUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start checkout';
      onError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Secure Payment with Stripe
        </h3>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            You'll be redirected to Stripe's secure checkout page to complete your payment.
          </p>
          
          <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-violet-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-violet-800">
                Your payment information is secure and encrypted
              </span>
            </div>
          </div>

          {/* Promo Code Section */}
          <div className="space-y-2">
            <label htmlFor="promoCode" className="block text-sm font-medium text-gray-700">
              Promo Code (Optional)
            </label>
            <div className="flex gap-2">
              <input
                id="promoCode"
                type="text"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoValidation(null);
                }}
                onBlur={validatePromoCode}
                placeholder="Enter code"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                disabled={isLoading || isValidating}
              />
              <button
                type="button"
                onClick={validatePromoCode}
                disabled={!promoCode.trim() || isValidating || isLoading}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 rounded-lg font-medium transition-colors duration-200"
              >
                {isValidating ? 'Checking...' : 'Apply'}
              </button>
            </div>
            
            {/* Promo Code Validation Message */}
            {promoValidation && (
              <div className={`text-sm ${promoValidation.valid ? 'text-green-600' : 'text-red-600'} flex items-center gap-1`}>
                {promoValidation.valid ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{promoValidation.message}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleCheckout}
            disabled={isLoading}
            className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
          >
            {isLoading ? 'Redirecting...' : `Continue to Checkout`}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default StripeCheckout;









