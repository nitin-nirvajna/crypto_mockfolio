import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY_ID = 'rzp_test_iLdxW7VD3oB4a6';

const SubscriptionModal = ({ isOpen, onClose }: SubscriptionModalProps) => {
  const { user, updateSubscription } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = (amount: number, isYearly: boolean) => {
    setError(null);
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: amount * 100, // Amount in paise
      currency: 'USD',
      name: 'CryptoMockfolio',
      description: `${isYearly ? 'Yearly' : 'Monthly'} Subscription`,
      handler: function() {
        try {
          // Handle successful payment
          const endDate = new Date();
          if (isYearly) {
            endDate.setFullYear(endDate.getFullYear() + 1);
          } else {
            endDate.setMonth(endDate.getMonth() + 1);
          }
          updateSubscription(endDate);
          onClose();
        } catch (err) {
          setError('Failed to process payment. Please try again.');
        }
      },
      prefill: {
        email: user?.email,
        name: user?.name
      },
      theme: {
        color: '#4F46E5'
      },
      modal: {
        ondismiss: function() {
          setError(null);
        }
      }
    };

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError('Failed to initialize payment. Please try again.');
    }
  };

  const handleMonthlySubscription = () => {
    handlePayment(1.99, false);
  };

  const handleYearlySubscription = () => {
    handlePayment(19.99, true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-app-primary-light dark:bg-app-primary-dark rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-app-text-light dark:text-app-text-dark">
          Upgrade to Premium
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You've reached the limit of 3 free transactions. Upgrade to continue trading!
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="border border-app-accent rounded-lg p-4">
            <h3 className="text-lg font-semibold text-app-text-light dark:text-app-text-dark mb-2">
              Monthly Plan
            </h3>
            <p className="text-2xl font-bold text-app-accent mb-2">$1.99/month</p>
            <button
              onClick={handleMonthlySubscription}
              className="btn btn-primary w-full"
            >
              Subscribe Monthly
            </button>
          </div>

          <div className="border border-app-accent rounded-lg p-4">
            <h3 className="text-lg font-semibold text-app-text-light dark:text-app-text-dark mb-2">
              Yearly Plan
            </h3>
            <p className="text-2xl font-bold text-app-accent mb-2">$19.99/year</p>
            <p className="text-sm text-green-500 mb-2">Save 16%</p>
            <button
              onClick={handleYearlySubscription}
              className="btn btn-primary w-full"
            >
              Subscribe Yearly
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            setError(null);
            onClose();
          }}
          className="btn btn-secondary w-full mt-6"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default SubscriptionModal;