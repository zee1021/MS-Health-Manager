
import React from 'react';
import { Tab } from '../types';
import {
  DashboardIcon,
  CalendarIcon,
  PillIcon,
  CheckCircleIcon,
  SparklesIcon,
  CogIcon,
  InfoIcon,
} from './Icons';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}

const navItems = [
  { tab: Tab.Dashboard, icon: <DashboardIcon /> },
  { tab: Tab.Appointments, icon: <CalendarIcon /> },
  { tab: Tab.Medications, icon: <PillIcon /> },
  { tab: Tab.Tasks, icon: <CheckCircleIcon /> },
  { tab: Tab.AIInsights, icon: <SparklesIcon /> },
  { tab: Tab.Settings, icon: <CogIcon /> },
  { tab: Tab.AboutUs, icon: <InfoIcon /> },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isSidebarOpen, setSidebarOpen }) => {
  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    if(window.innerWidth < 1024) { // Close sidebar on mobile after navigation
      setSidebarOpen(false);
    }
  };

  // FIX: Replaced JSX.Element with React.ReactElement to fix 'Cannot find namespace JSX' error.
  const NavLink: React.FC<{ item: { tab: Tab; icon: React.ReactElement } }> = ({ item }) => (
    <button
      onClick={() => handleTabClick(item.tab)}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
        activeTab === item.tab
          ? 'bg-teal-500 text-white shadow-lg'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
      }`}
    >
      {item.icon}
      <span className="ml-4">{item.tab}</span>
    </button>
  );

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      ></div>
      
      {/* Sidebar */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 bg-white dark:bg-slate-800 w-64 p-4 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-gray-200 dark:border-slate-700 flex flex-col`}
      >
        <div className="flex items-center mb-8">
            <div className="p-2 bg-teal-500 rounded-lg">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H8v-2h3V7h2v4h3v2h-3v4h-2z" />
                </svg>
            </div>
            <span className="ml-3 text-lg font-semibold text-gray-800 dark:text-white">Health Suite</span>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink key={item.tab} item={item} />
          ))}
        </nav>

        <div className="mt-auto p-4 bg-gray-100 dark:bg-slate-700 rounded-lg text-center">
            <h4 className="font-semibold text-gray-800 dark:text-white">Stay Mindful</h4>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Your wellness journey, simplified and secured.</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;