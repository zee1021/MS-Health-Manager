
import React from 'react';
import { SparklesIcon } from './Icons';

const AboutUs: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in text-gray-700 dark:text-gray-300">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">About Mindful Screen</h1>
        <p className="text-lg text-teal-600 dark:text-teal-400 font-medium">Your Personal AI Health Companion</p>
      </header>

      <section>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Our Mission</h2>
          <p className="leading-relaxed">
            At Mindful Screen, our mission is to empower you to take control of your health journey. We believe that managing your wellness should be simple, intuitive, and secure. We've designed this application to be a comprehensive, private-by-design tool that helps you organize medical appointments, track medications, manage health-related tasks, and gain valuable insights into your well-being, all powered by cutting-edge AI.
          </p>
        </div>
      </section>

      <section>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Our Commitment to Your Privacy</h2>
          <p className="leading-relaxed">
            In an age of data breaches and intrusive tracking, we've taken a firm stand on privacy. <strong className="text-teal-500">All of your health data is stored exclusively on your local device.</strong> It never leaves your computer or phone, and we never see it. This ensures that your sensitive information remains completely private and under your control. You get the benefits of a smart health manager without sacrificing your privacy.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-6">The Technology Behind the Screen</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex items-start space-x-4">
            <div className="flex-shrink-0 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg className="w-6 h-6 text-blue-500 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Local-First Storage</h3>
              <p className="mt-1 text-sm">Your data's security is paramount. By storing everything on your device, we provide a secure, offline-capable experience. You are the sole owner and custodian of your health information.</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex items-start space-x-4">
            <div className="flex-shrink-0 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <SparklesIcon />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">AI-Powered Insights</h3>
              <p className="mt-1 text-sm">Leveraging the power of Google's Gemini API, our AI Insights feature provides non-diagnostic, wellness-focused analysis of your health metrics to help you identify trends and make informed lifestyle choices.</p>
            </div>
          </div>
        </div>
      </section>
      
      <footer className="text-center pt-8 border-t border-gray-200 dark:border-slate-700">
        <p className="text-gray-600 dark:text-gray-400">Thank you for choosing Mindful Screen to be a part of your wellness journey.</p>
        <p className="mt-2 text-sm text-gray-500">Have feedback or a feature request? We'd love to hear from you!</p>
      </footer>

    </div>
  );
};

export default AboutUs;
