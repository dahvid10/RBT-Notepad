
import React from 'react';
import { SunIcon, MoonIcon } from './icons';

interface HeaderProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, setTheme }) => {

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
      <div className="container mx-auto px-4 sm:px-8">
        <div className="relative flex items-center justify-between h-16">
          <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
            {/* This empty div can be used for a logo or left-aligned items in the future */}
          </div>
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center justify-center" aria-label="center">
             <div className="text-center">
                <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white truncate">
                  RBT Notepad
                </h1>
                <p className="hidden sm:block text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  AI-Powered Session Note Assistant
                </p>
              </div>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
