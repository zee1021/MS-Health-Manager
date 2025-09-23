
import React, { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Tab, Appointment, Medication, Task, UserProfile, AuthUser } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Appointments from './components/Appointments';
import Medications from './components/Medications';
import Tasks from './components/Tasks';
import AIInsights from './components/AIInsights';
import Settings from './components/Settings';
import AboutUs from './components/AboutUs';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import { requestNotificationPermission } from './utils/notifications';
import { SunIcon, MoonIcon, MenuIcon, ChevronDownIcon } from './components/Icons';

type AuthView = 'signIn' | 'signUp';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authView, setAuthView] = useState<AuthView>('signIn');
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile | null>('userProfile', null);

  useEffect(() => {
    // Migration for old user profile structure
    if (userProfile && (userProfile as any).notificationSound !== undefined) {
      const oldSoundSetting = (userProfile as any).notificationSound;
      const newProfile: UserProfile = {
        name: userProfile.name,
        email: userProfile.email,
        avatar: userProfile.avatar,
        notificationSettings: {
          appointments: oldSoundSetting,
          medications: oldSoundSetting,
          tasks: oldSoundSetting,
        },
      };
      setUserProfile(newProfile);
    }
  }, [userProfile, setUserProfile]);

  useEffect(() => {
    const sessionToken = sessionStorage.getItem('authToken');
    const localToken = localStorage.getItem('authToken');
    if ((sessionToken || localToken) && userProfile) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [userProfile]);
  
  const handleLogin = useCallback((user: AuthUser, rememberMe: boolean) => {
    if (rememberMe) {
      localStorage.setItem('authToken', 'true');
    } else {
      sessionStorage.setItem('authToken', 'true');
    }
    setUserProfile({
      name: user.firstName,
      email: user.email,
      avatar: `https://picsum.photos/seed/${user.email}/100`,
      notificationSettings: {
        appointments: true,
        medications: true,
        tasks: true,
      },
    });
    setIsAuthenticated(true);
  }, [setUserProfile]);

  const handleSignOut = () => {
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('authToken');
    // also remove theme to reset to system preference on next login
    localStorage.removeItem('theme');
    setUserProfile(null);
    setIsAuthenticated(false);
    setAuthView('signIn');
  };

  if (!isAuthenticated || !userProfile) {
    return authView === 'signIn' ? (
      <SignIn onLogin={handleLogin} onSwitchView={() => setAuthView('signUp')} />
    ) : (
      <SignUp onSignUp={handleLogin} onSwitchView={() => setAuthView('signIn')} />
    );
  }

  return <MainApp userProfile={userProfile} setUserProfile={setUserProfile} onSignOut={handleSignOut} />;
};

interface MainAppProps {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile | null) => void;
  onSignOut: () => void;
}

const MainApp: React.FC<MainAppProps> = ({ userProfile, setUserProfile, onSignOut }) => {
  const getInitialSystemTheme = (): 'light' | 'dark' => {
    // This function is used as a fallback if no theme is set in localStorage
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };
  
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', getInitialSystemTheme());
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Dashboard);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('appointments', []);
  const [medications, setMedications] = useLocalStorage<Medication[]>('medications', []);
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Effect to listen for OS-level theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // If user hasn't manually set a theme, follow the system preference
      if (!('theme' in localStorage)) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [setTheme]);


  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const renderContent = () => {
    switch (activeTab) {
      case Tab.Dashboard:
        return <Dashboard setActiveTab={setActiveTab} appointments={appointments} medications={medications} tasks={tasks} userName={userProfile.name} />;
      case Tab.Appointments:
        return <Appointments appointments={appointments} setAppointments={setAppointments} profile={userProfile} />;
      case Tab.Medications:
        return <Medications medications={medications} setMedications={setMedications} profile={userProfile} />;
      case Tab.Tasks:
        return <Tasks tasks={tasks} setTasks={setTasks} profile={userProfile} />;
      case Tab.AIInsights:
        return <AIInsights />;
      case Tab.Settings:
        return <Settings userProfile={userProfile} setUserProfile={setUserProfile as (profile: UserProfile) => void} />;
      case Tab.AboutUs:
        return <AboutUs />;
      default:
        return <Dashboard setActiveTab={setActiveTab} appointments={appointments} medications={medications} tasks={tasks} userName={userProfile.name} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-gray-200 font-sans antialiased">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="text-gray-500 dark:text-gray-400 focus:outline-none lg:hidden mr-4"
              aria-label="Open sidebar"
            >
              <MenuIcon />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
              Mindful <span className="text-teal-500">Screen</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:focus:ring-offset-slate-800" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <img
                  src={userProfile.avatar}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-teal-500"
                />
                <span className="hidden md:block font-medium">{userProfile.name}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isProfileDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-md shadow-lg py-1 z-50 animate-fade-in-up"
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  <button
                    onClick={onSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
