import React from 'react';

interface TabsProps {
  activeTab: 'note' | 'ideas';
  setActiveTab: (tab: 'note' | 'ideas') => void;
}

const TabButton: React.FC<{
  isActive: boolean;
  onClick: () => void;
  label: string;
}> = ({ isActive, onClick, label }) => {
  const activeClasses = 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow';
  const inactiveClasses = 'bg-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200';
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${isActive ? activeClasses : inactiveClasses}`}
    >
      {label}
    </button>
  );
};

export const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-lg flex items-center space-x-1" aria-label="Tabs">
      <TabButton
        isActive={activeTab === 'note'}
        onClick={() => setActiveTab('note')}
        label="Generated Note"
      />
      <TabButton
        isActive={activeTab === 'ideas'}
        onClick={() => setActiveTab('ideas')}
        label="Enhancement Ideas"
      />
    </div>
  );
};