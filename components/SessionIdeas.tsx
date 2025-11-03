import React from 'react';
import { LightbulbIcon } from './icons';

interface SessionIdeasProps {
  ideas: string;
  isLoading: boolean;
}

export const SessionIdeas: React.FC<SessionIdeasProps> = ({ ideas, isLoading }) => {
  const IdeasContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400">Generating creative ideas...</p>
        </div>
      );
    }
    if (!ideas) {
      return (
        <div className="text-center text-slate-500 dark:text-slate-400">
            <LightbulbIcon />
            <p>Click "Get Session Ideas" to brainstorm ways to enhance your next session.</p>
        </div>
      );
    }
    return (
        <div className="prose prose-slate dark:prose-invert max-w-none text-left">
            {ideas.split('\n').map((idea, index) => {
                const trimmedIdea = idea.trim();
                if (!trimmedIdea) return null;
                // Basic formatting for lists and bold text
                if (trimmedIdea.startsWith('* ') || trimmedIdea.startsWith('- ')) {
                    return <li key={index}>{trimmedIdea.substring(2)}</li>;
                }
                if (trimmedIdea.includes('**')) {
                    const parts = trimmedIdea.split('**');
                    return <p key={index}>{parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}</p>;
                }
                return <p key={index}>{trimmedIdea}</p>;
            })}
        </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 min-h-[200px] flex flex-col">
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
        <LightbulbIcon />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Session Enhancement Ideas</h2>
      </div>
      <div className="flex-grow flex items-center justify-center">
        <IdeasContent />
      </div>
    </div>
  );
};