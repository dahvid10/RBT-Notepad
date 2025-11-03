
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-slate-800/50 shadow-sm border-b border-slate-200 dark:border-slate-700">
      <div className="container mx-auto px-4 md:px-8 py-4 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
          RBT Notepad
        </h1>
        <p className="mt-2 text-md text-slate-600 dark:text-slate-300">
          Generate professional, objective, and measurable session notes in seconds.
        </p>
      </div>
    </header>
  );
};
