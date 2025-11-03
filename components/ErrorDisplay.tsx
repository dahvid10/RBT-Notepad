

import React from 'react';
import { XCircleIcon } from './icons';

interface ErrorDisplayProps {
  message: string;
  onDismiss?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onDismiss }) => {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300 p-4 rounded-lg shadow-md" role="alert">
      <div className="flex">
        <div className="py-1">
          <svg className="h-6 w-6 text-red-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-grow">
          <p className="font-bold">An Error Occurred</p>
          <p className="text-sm">{message}</p>
        </div>
        {onDismiss && (
            <div className="pl-4">
                <button
                    onClick={onDismiss}
                    className="p-1 rounded-full text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    aria-label="Dismiss error"
                >
                    <XCircleIcon />
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
