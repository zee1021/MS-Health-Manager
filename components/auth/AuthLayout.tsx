
import React, { useEffect } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title }) => {
  const [theme] = useLocalStorage<'light' | 'dark'>('theme', 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-900 p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="flex justify-center items-center mb-6">
           <div className="p-2 bg-teal-500 rounded-lg">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H8v-2h3V7h2v4h3v2h-3v4h-2z" />
                </svg>
            </div>
            <h1 className="ml-3 text-2xl font-bold text-gray-800 dark:text-white">
              Mindful <span className="text-teal-500">Screen</span>
            </h1>
        </div>
        <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">{title}</h2>
            {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
