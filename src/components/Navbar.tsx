import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SunIcon, MoonIcon, UserIcon } from '@heroicons/react/24/outline';

const RAZORPAY_KEY_ID = 'rzp_test_iLdxW7VD3oB4a6';

const Navbar = () => {
  const { user, logout, updateSubscription } = useAuth();
  const [showSubscriptionDetails, setShowSubscriptionDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => 
    document.documentElement.classList.contains('dark')
  );

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  const handleUpgradeToYearly = () => {
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: 1999, // Amount in smallest currency unit (19.99 USD)
      currency: "USD",
      name: "CryptoMockfolio",
      description: "Upgrade to Premium Plan",
      handler: function () {
        // Add one year to current subscription end date
        const currentEndDate = new Date(user?.subscriptionEndDate || new Date());
        const newEndDate = new Date(currentEndDate.setFullYear(currentEndDate.getFullYear() + 1));
        updateSubscription(newEndDate);
        setShowSubscriptionDetails(false);
      },
      prefill: {
        email: user?.email
      },
      theme: {
        color: "#4F46E5"
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-app-primary-light dark:bg-app-primary-dark border-b border-app-secondary-light dark:border-app-secondary-dark z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-app-text-light dark:text-app-text-dark">
            CryptoMockfolio
          </Link>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md bg-app-secondary-light dark:bg-app-secondary-dark text-app-text-light dark:text-app-text-dark hover:bg-app-accent/10"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </button>
            {user && (
              <>
                <button
                  onClick={() => setShowSubscriptionDetails(true)}
                  className="flex items-center px-3 py-2 text-sm rounded-md bg-app-secondary-light dark:bg-app-secondary-dark text-app-text-light dark:text-app-text-dark hover:bg-app-accent/10"
                >
                  <UserIcon className="w-5 h-5 mr-2" />
                  Subscription
                </button>
                <Link
                  to="/dashboard"
                  className="flex items-center px-3 py-2 text-sm rounded-md bg-app-accent text-white hover:bg-app-accent/90 transition-colors"
                >
                  Portfolio
                </Link>
                <button
                  onClick={logout}
                  className="btn btn-primary"
                >
                  Logout
                </button>
              </>
            )}
            {!user && (
              <Link to="/login" className="btn btn-primary">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Details Modal */}
      {showSubscriptionDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-app-primary-light dark:bg-app-primary-dark rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-app-text-light dark:text-app-text-dark">
              Subscription Details
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Status</p>
                <p className="text-lg font-semibold text-app-text-light dark:text-app-text-dark">
                  {user?.isSubscribed ? (
                    user?.subscriptionEndDate && new Date(user.subscriptionEndDate).getFullYear() - new Date().getFullYear() >= 1 ? (
                      <span className="text-green-500">Premium Plan</span>
                    ) : (
                      <>
                        <span className="text-blue-500">Standard Plan</span>
                        <button 
                          onClick={handleUpgradeToYearly}
                          className="ml-2 text-sm text-app-accent hover:underline"
                        >
                          Upgrade to Premium
                        </button>
                      </>
                    )
                  ) : (
                    <span className="text-yellow-500">Free Plan</span>
                  )}
                </p>
              </div>

              {user?.isSubscribed && user?.subscriptionEndDate && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Valid Until</p>
                  <p className="text-lg font-semibold text-app-text-light dark:text-app-text-dark">
                    {new Date(user.subscriptionEndDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {!user?.isSubscribed && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Free Transactions Remaining</p>
                  <p className="text-lg font-semibold text-app-text-light dark:text-app-text-dark">
                    {Math.max(0, 3 - (user?.transactionCount ?? 0))} of 3
                  </p>
                  <div className="mt-4 space-y-2">
                    <button 
                      onClick={() => {
                        const options = {
                          key: RAZORPAY_KEY_ID,
                          amount: 199, // $1.99 in cents
                          currency: "USD",
                          name: "CryptoMockfolio",
                          description: "Standard Plan Subscription",
                          handler: function () {
                            const endDate = new Date();
                            endDate.setMonth(endDate.getMonth() + 1);
                            updateSubscription(endDate);
                            setShowSubscriptionDetails(false);
                          },
                          prefill: {
                            email: user?.email
                          },
                          theme: {
                            color: "#4F46E5"
                          }
                        };
                        const rzp = new (window as any).Razorpay(options);
                        rzp.open();
                      }}
                      className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                    >
                      Subscribe to Standard Plan ($1.99/month)
                    </button>
                    <button 
                      onClick={() => {
                        const options = {
                          key: RAZORPAY_KEY_ID,
                          amount: 1999, // $19.99 in cents
                          currency: "USD",
                          name: "CryptoMockfolio",
                          description: "Premium Plan Subscription",
                          handler: function () {
                            const endDate = new Date();
                            endDate.setFullYear(endDate.getFullYear() + 1);
                            updateSubscription(endDate);
                            setShowSubscriptionDetails(false);
                          },
                          prefill: {
                            email: user?.email
                          },
                          theme: {
                            color: "#4F46E5"
                          }
                        };
                        const rzp = new (window as any).Razorpay(options);
                        rzp.open();
                      }}
                      className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
                    >
                      Subscribe to Premium Plan ($19.99/year)
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setError(null);
                setShowSubscriptionDetails(false);
              }}
              className="btn btn-secondary w-full mt-6"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;