import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await resetPassword(email);
      setMessage('Password reset instructions sent to your email');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-16 flex justify-center">
      <div className="w-full max-w-md p-8 bg-app-secondary-light dark:bg-app-secondary-dark rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-6 text-app-text-light dark:text-app-text-dark text-center">
          Reset Password
        </h2>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-app-primary-light dark:bg-app-primary-dark border border-app-secondary-light dark:border-app-secondary-dark text-app-text-light dark:text-app-text-dark focus:outline-none focus:ring-2 focus:ring-app-accent"
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Reset Password'}
          </button>
        </form>
        <div className="mt-4 flex justify-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <Link to="/login" className="text-app-accent hover:underline">
            Back to Login
          </Link>
        </div>
        <div className="mt-4 text-center text-xs text-gray-500">
          Demo account: admin@demo.com
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;