import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface User {
  name: string;
  email: string;
  isSubscribed: boolean;
  subscriptionEndDate?: Date;
  transactionCount: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateSubscription: (endDate: Date) => void;
  incrementTransactionCount: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER = {
  email: 'admin@demo.com',
  password: 'pwd@123',
  name: 'Admin User'
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      if (email.toLowerCase() === DEMO_USER.email.toLowerCase() && password === DEMO_USER.password) {
        const userData = {
          ...DEMO_USER,
          isSubscribed: false,
          transactionCount: 0
        };
        setUser(userData);
        toast.success('Logged in successfully!');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      toast.error('Invalid email or password');
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    toast.success('Logged out successfully');
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      // In a real app, you would make an API call here
      if (email.toLowerCase() === DEMO_USER.email.toLowerCase()) {
        throw new Error('Email already in use');
      }
      
      const userData = {
        name,
        email,
        isSubscribed: false,
        transactionCount: 0
      };
      setUser(userData);
      toast.success('Account created successfully!');
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // In a real app, you would make an API call here
      if (email.toLowerCase() === DEMO_USER.email.toLowerCase()) {
        toast.success('Password reset link sent to your email');
      } else {
        throw new Error('Email not found');
      }
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    }
  };

  const updateSubscription = (endDate: Date) => {
    if (user) {
      setUser({ ...user, isSubscribed: true, subscriptionEndDate: endDate });
      toast.success('Subscription updated successfully');
    }
  };

  const incrementTransactionCount = () => {
    if (user) {
      setUser({ ...user, transactionCount: (user.transactionCount || 0) + 1 });
      toast.success('Transaction added successfully');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        signup,
        resetPassword,
        updateSubscription,
        incrementTransactionCount,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};