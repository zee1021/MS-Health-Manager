
import React, { useState, useRef, useMemo } from 'react';
import { UserProfile, AuthUser } from '../types';
import PasswordStrength from './auth/PasswordStrength';

interface SettingsProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const Settings: React.FC<SettingsProps> = ({ userProfile, setUserProfile }) => {
  const [name, setName] = useState(userProfile.name);
  const [nameError, setNameError] = useState('');
  const [showProfileSuccess, setShowProfileSuccess] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const passwordValidations = useMemo(() => ({
    length: passwords.newPassword.length >= 8,
    uppercase: /[A-Z]/.test(passwords.newPassword),
    lowercase: /[a-z]/.test(passwords.newPassword),
    number: /[0-9]/.test(passwords.newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(passwords.newPassword),
  }), [passwords.newPassword]);

  const isPasswordValid = Object.values(passwordValidations).every(Boolean);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (e.target.value.trim()) {
      setNameError('');
    }
  };
  
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
        setNameError('Username cannot be empty.');
        return;
    }
    setUserProfile(prev => ({...prev, name}));
    setShowProfileSuccess(true);
    setTimeout(() => setShowProfileSuccess(false), 3000);
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if(event.target?.result) {
            setUserProfile(prev => ({ ...prev, avatar: event.target!.result as string }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleNotificationToggle = (type: keyof UserProfile['notificationSettings']) => {
    setUserProfile(prev => {
      const currentSettings = prev.notificationSettings || { appointments: true, medications: true, tasks: true };
      return {
        ...prev,
        notificationSettings: {
          ...currentSettings,
          [type]: !currentSettings[type],
        },
      };
    });
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!isPasswordValid) {
      setPasswordError('Your new password does not meet all the security requirements.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    const storedUsersRaw = localStorage.getItem('users');
    if (!storedUsersRaw) {
      setPasswordError('Could not find user data. Please sign out and sign in again.');
      return;
    }
    
    const users: AuthUser[] = JSON.parse(storedUsersRaw);
    const currentUserIndex = users.findIndex(u => u.email === userProfile.email);
    
    if (currentUserIndex === -1) {
      setPasswordError('Could not find your user profile.');
      return;
    }
    
    const currentUser = users[currentUserIndex];
    if (currentUser.password !== passwords.currentPassword) {
      setPasswordError('The current password you entered is incorrect.');
      return;
    }
    
    // Update password
    users[currentUserIndex].password = passwords.newPassword;
    localStorage.setItem('users', JSON.stringify(users));

    setPasswordSuccess('Password changed successfully!');
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setPasswordSuccess(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* Profile Settings */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="flex items-center space-x-6">
            <img src={userProfile.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
            <div>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-sm font-medium rounded-md hover:bg-gray-300">
                Upload New Picture
              </button>
              <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 10MB.</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Username</label>
            <input type="text" value={name} onChange={handleNameChange} onBlur={() => !name.trim() && setNameError('Username cannot be empty.')} className={`mt-1 block w-full md:w-1/2 rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 dark:bg-slate-700 dark:border-slate-600 ${nameError ? 'border-red-500' : ''}`} />
            {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
          </div>
          <div className="flex items-center space-x-4">
            <button type="submit" className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:bg-teal-300" disabled={!name.trim()}>Save Profile</button>
            {showProfileSuccess && <span className="text-green-500 text-sm transition-opacity">Profile updated!</span>}
          </div>
        </form>
      </div>

      {/* Notification Settings */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4">Notification Sounds</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Appointment Reminders</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Play a sound for upcoming appointment alerts.</p>
            </div>
            <label htmlFor="appointment-sound-toggle" className="inline-flex relative items-center cursor-pointer">
              <input type="checkbox" checked={userProfile.notificationSettings?.appointments ?? true} onChange={() => handleNotificationToggle('appointments')} id="appointment-sound-toggle" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Medication Reminders</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Play a sound for scheduled medication doses.</p>
            </div>
            <label htmlFor="medication-sound-toggle" className="inline-flex relative items-center cursor-pointer">
              <input type="checkbox" checked={userProfile.notificationSettings?.medications ?? true} onChange={() => handleNotificationToggle('medications')} id="medication-sound-toggle" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Task Reminders</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Play a sound for tasks that are due soon.</p>
            </div>
            <label htmlFor="task-sound-toggle" className="inline-flex relative items-center cursor-pointer">
              <input type="checkbox" checked={userProfile.notificationSettings?.tasks ?? true} onChange={() => handleNotificationToggle('tasks')} id="task-sound-toggle" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
            </label>
          </div>
        </div>
      </div>
      
       {/* Security Settings */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4">Security</h2>
         <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
            {passwordSuccess && <p className="text-green-500 text-sm">{passwordSuccess}</p>}
            <div>
                <label className="block text-sm font-medium">Current Password</label>
                <input type="password" name="currentPassword" value={passwords.currentPassword} onChange={handlePasswordInputChange} required className="mt-1 block w-full md:w-1/2 rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-teal-500 focus:ring-teal-500" />
            </div>
            <div>
                <label className="block text-sm font-medium">New Password</label>
                <input type="password" name="newPassword" value={passwords.newPassword} onChange={handlePasswordInputChange} required className="mt-1 block w-full md:w-1/2 rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-teal-500 focus:ring-teal-500" />
            </div>
            {passwords.newPassword && <PasswordStrength password={passwords.newPassword} />}
            <div>
                <label className="block text-sm font-medium">Confirm New Password</label>
                <input type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handlePasswordInputChange} required className="mt-1 block w-full md:w-1/2 rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-teal-500 focus:ring-teal-500" />
            </div>
            {passwords.newPassword && passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match.</p>
            )}
             <div>
                <button type="submit" className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:bg-teal-300" disabled={!passwords.currentPassword || !isPasswordValid || passwords.newPassword !== passwords.confirmPassword}>
                    Change Password
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
