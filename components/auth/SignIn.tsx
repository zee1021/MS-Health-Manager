import React, { useState } from 'react';
import AuthLayout from './AuthLayout';
import { AuthUser } from '../../types';
import { EyeIcon, EyeOffIcon } from '../Icons';

interface SignInProps {
  onLogin: (user: AuthUser, rememberMe: boolean) => void;
  onSwitchView: () => void;
}

const SignIn: React.FC<SignInProps> = ({ onLogin, onSwitchView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string; form?: string } = {};
    if (!email) {
        newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = "Email is invalid.";
    }
    if (!password) {
        newErrors.password = "Password is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validate()) return;

    const storedUsersRaw = localStorage.getItem('users');
    if (!storedUsersRaw) {
      setErrors({ form: 'Invalid email or password.' });
      return;
    }

    const users: AuthUser[] = JSON.parse(storedUsersRaw);
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      onLogin(user, rememberMe);
    } else {
      setErrors({ form: 'Invalid email or password.' });
    }
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      validate();
  }

  return (
    <AuthLayout title="Sign In">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                <span className="block sm:inline">{errors.form}</span>
            </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleBlur}
            className={`input-field ${errors.email ? 'border-red-500' : ''}`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
          <div className="relative">
             <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={handleBlur}
                className={`input-field ${errors.password ? 'border-red-500' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
           {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <input 
                    id="remember-me" 
                    name="remember-me" 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Remember me
                </label>
            </div>
            <div className="text-sm">
                <a href="#" className="font-medium text-teal-600 hover:text-teal-500">
                    Forgot your password?
                </a>
            </div>
        </div>
        <div>
          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
            Sign In
          </button>
        </div>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <button type="button" onClick={onSwitchView} className="font-medium text-teal-600 hover:text-teal-500 focus:outline-none">
                Sign Up
            </button>
        </p>
      </form>
       <style>{`
        .input-field {
          margin-top: 0.25rem;
          display: block;
          width: 100%;
          padding: 0.5rem 0.75rem;
          background-color: white;
          border: 1px solid #D1D5DB;
          border-radius: 0.375rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .dark .input-field {
            background-color: #334155;
            border-color: #475569;
        }
        .input-field:focus {
          outline: none;
          --tw-ring-color: #14B8A6;
          box-shadow: 0 0 0 2px var(--tw-ring-color);
          border-color: #14B8A6;
        }
        .input-field.border-red-500 { border-color: #EF4444; }
        .input-field.border-red-500:focus { box-shadow: 0 0 0 1px #EF4444; border-color: #EF4444; }
      `}</style>
    </AuthLayout>
  );
};

export default SignIn;