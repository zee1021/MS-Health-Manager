import React, { useState, useMemo, useEffect } from 'react';
import AuthLayout from './AuthLayout';
import PasswordStrength from './PasswordStrength';
import { AuthUser } from '../../types';
import { EyeIcon, EyeOffIcon } from '../Icons';

interface SignUpProps {
  onSignUp: (user: AuthUser, rememberMe: boolean) => void;
  onSwitchView: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onSignUp, onSwitchView }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordValidations = useMemo(() => ({
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  }), [formData.password]);

  const isPasswordValid = Object.values(passwordValidations).every(Boolean);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName) newErrors.firstName = "First name is required.";
    if (!formData.lastName) newErrors.lastName = "Last name is required.";
    if (!formData.email) {
        newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Email is invalid.";
    }
    if (!formData.password) newErrors.password = "Password is required.";
    else if (!isPasswordValid) newErrors.password = "Password does not meet all requirements.";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const isFormValid = useMemo(() => {
    return formData.firstName && formData.lastName && formData.email && isPasswordValid && (formData.password === formData.confirmPassword);
  }, [formData, isPasswordValid]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const { name } = e.target;
      setTouched(prev => ({ ...prev, [name]: true }));
  };

  useEffect(() => {
      if(Object.keys(touched).length > 0) {
          validate();
      }
  }, [formData, touched]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ firstName: true, lastName: true, email: true, password: true, confirmPassword: true });
    if (!validate()) return;
    
    setErrors({});

    const storedUsersRaw = localStorage.getItem('users');
    const users: AuthUser[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];

    if (users.some(user => user.email === formData.email)) {
      setErrors({ email: 'An account with this email already exists.' });
      return;
    }

    const newUser: AuthUser = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    onSignUp(newUser, false);
  };

  return (
    <AuthLayout title="Create Account">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
            <span className="block sm:inline">{errors.form}</span>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} onBlur={handleBlur} className={`input-field ${touched.firstName && errors.firstName ? 'border-red-500' : ''}`}/>
            {touched.firstName && errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} onBlur={handleBlur} className={`input-field ${touched.lastName && errors.lastName ? 'border-red-500' : ''}`}/>
             {touched.lastName && errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} className={`input-field ${touched.email && errors.email ? 'border-red-500' : ''}`}/>
          {touched.email && errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} onBlur={handleBlur} className={`input-field ${touched.password && errors.password ? 'border-red-500' : ''}`}/>
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>
        <PasswordStrength password={formData.password} />
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
             <div className="relative">
                <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} className={`input-field ${touched.confirmPassword && errors.confirmPassword ? 'border-red-500' : ''}`}/>
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
            </div>
             {touched.confirmPassword && errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
            )}
        </div>
        <div>
          <button type="submit" disabled={!isFormValid} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-300 disabled:cursor-not-allowed">
            Sign Up
          </button>
        </div>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <button type="button" onClick={onSwitchView} className="font-medium text-teal-600 hover:text-teal-500 focus:outline-none">
                Sign In
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

export default SignUp;