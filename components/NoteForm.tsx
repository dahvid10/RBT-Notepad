
import React, { useState, useRef, useEffect } from 'react';
import type { SessionData, Goal } from '../types';
import { PlusIcon, TrashIcon, SparklesIcon, InfoIcon, XIcon, QuestionMarkCircleIcon, ArrowPathIcon, DocumentTextIcon } from './icons';
import { InputField } from './InputField';

interface NoteFormProps {
  sessionData: SessionData;
  setSessionData: React.Dispatch<React.SetStateAction<SessionData>>;
  onGenerateNote: () => void;
  isLoading: boolean;
  onLoadExample: () => void;
  onResetForm: () => void;
}

export const NoteForm: React.FC<NoteFormProps> = ({ sessionData, setSessionData, onGenerateNote, isLoading, onLoadExample, onResetForm }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const goalContainerRef = useRef<HTMLDivElement>(null);
  const newGoalAdded = useRef(false);
  const [isGuideVisible, setIsGuideVisible] = useState(false);

  useEffect(() => {
    if (newGoalAdded.current && goalContainerRef.current) {
        const goalElements = goalContainerRef.current.querySelectorAll('[data-goal-container]');
        const lastGoalElement = goalElements[goalElements.length - 1];
        if (lastGoalElement) {
            const firstInput = lastGoalElement.querySelector('input, textarea');
            if (firstInput instanceof HTMLElement) {
                firstInput.focus();
            }
        }
        newGoalAdded.current = false;
    }
  }, [sessionData.goals.length]);
  
  const toggleGuide = () => {
    setIsGuideVisible(prev => !prev);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSessionData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
        setErrors(prev => {
            const newErrors = {...prev};
            delete newErrors[name];
            return newErrors;
        });
    }
  };
  
  const handleGoalChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Use the functional update form of setSessionData to ensure we are always working with the latest state.
    // This prevents potential issues with stale state if multiple updates are batched together.
    setSessionData(currentData => {
      // Create a new array for the goals to ensure immutability.
      const updatedGoals = currentData.goals.map((goal, i) => {
        // If this is the goal we want to update...
        if (i === index) {
          // ...return a new object with the updated value.
          return { ...goal, [name]: value };
        }
        // Otherwise, return the goal as is.
        return goal;
      });

      // Return the new, updated state object for the entire session.
      return {
        ...currentData,
        goals: updatedGoals,
      };
    });
  };

  const addGoal = () => {
    newGoalAdded.current = true;
    setSessionData(prev => ({
      ...prev,
      goals: [...prev.goals, { name: '', progress: '', methods: '' }]
    }));
  };

  const removeGoal = (index: number) => {
    const newGoals = sessionData.goals.filter((_, i) => i !== index);
    setSessionData(prev => ({ ...prev, goals: newGoals }));
  };
  
  const validateForm = (): boolean => {
      const newErrors: Record<string, string> = {};
      
      if (!sessionData.clientName.trim()) newErrors.clientName = 'Client name is required.';
      if (!sessionData.sessionDate) newErrors.sessionDate = 'Session date is required.';
      if (!sessionData.startTime) newErrors.startTime = 'Start time is required.';
      if (!sessionData.endTime) newErrors.endTime = 'End time is required.';
      if (sessionData.startTime && sessionData.endTime && sessionData.startTime >= sessionData.endTime) {
          newErrors.endTime = 'End time must be after start time.';
      }
      
      sessionData.goals.forEach((goal, index) => {
          if (!goal.name.trim() || !goal.progress.trim() || !goal.methods.trim()) {
              newErrors[`goal_${index}`] = `All fields for Goal ${index + 1} are required.`;
          }
      });
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  }
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (validateForm()) {
          onGenerateNote();
      }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
      <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Session Details</h2>
        <div className="flex items-center gap-2">
             <button
                type="button"
                onClick={toggleGuide}
                className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label={isGuideVisible ? "Hide guide" : "Show guide"}
            >
                <QuestionMarkCircleIcon />
            </button>
        </div>
      </div>

      {isGuideVisible && (
        <div className="mb-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-800 dark:text-indigo-300 p-4 rounded-lg shadow-sm relative transition-opacity duration-300">
            <div className="flex">
                <div className="py-1 shrink-0">
                   <InfoIcon />
                </div>
                <div className="ml-3">
                    <h3 className="text-md font-bold mb-1">How it Works</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li><strong>Fill the Form:</strong> Enter session details, or click 'Load Example' to see a sample.</li>
                        <li><strong>Generate Note:</strong> Click the button to create an AI-powered, professional session note.</li>
                        <li><strong>Review & Explore:</strong> Your note and a chatbot for brainstorming will appear in the "Generated Results" tab. You can edit, download, and share!</li>
                    </ol>
                </div>
            </div>
            <button
                type="button"
                onClick={toggleGuide}
                className="absolute top-2 right-2 p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full transition-colors"
                aria-label="Dismiss guide"
            >
                <XIcon />
            </button>
        </div>
      )}
      
      <InputField label="Client Name" name="clientName" value={sessionData.clientName} onChange={handleChange} placeholder="e.g., John D." required />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputField label="Session Date" name="sessionDate" type="date" value={sessionData.sessionDate} onChange={handleChange} required />
        <InputField label="Start Time" name="startTime" type="time" value={sessionData.startTime} onChange={handleChange} required />
        <InputField label="End Time" name="endTime" type="time" value={sessionData.endTime} onChange={handleChange} error={errors.endTime} required />
      </div>

      <InputField label="Venue" name="venue" value={sessionData.venue} onChange={handleChange} placeholder="e.g., Home, Community Center" required />
      <InputField label="People Present" name="peoplePresent" value={sessionData.peoplePresent} onChange={handleChange} placeholder="e.g., Client, RBT, Mother" required />
      <InputField label="Client Health & Appearance (Objective)" name="clientHealth" type="textarea" value={sessionData.clientHealth} onChange={handleChange} placeholder="e.g., Client appeared well-rested and wore weather-appropriate clothing. No signs of illness observed." required />

      <div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Goals & Interventions</h3>
        <div className="space-y-4" ref={goalContainerRef}>
          {sessionData.goals.map((goal, index) => (
            <div key={index} data-goal-container className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3 relative">
              {errors[`goal_${index}`] && <p className="text-sm text-red-600 mb-2">{errors[`goal_${index}`]}</p>}
              <InputField label={`Goal ${index + 1} Name`} name="name" value={goal.name} onChange={(e) => handleGoalChange(index, e)} placeholder="e.g., Manding for items" required />
              <InputField label="Data / Progress (Measurable & Objective)" name="progress" type="textarea" value={goal.progress} onChange={(e) => handleGoalChange(index, e)} placeholder="e.g., Mand for preferred items independently in 4/5 opportunities." required />
              <InputField label="Instructional Methods Used" name="methods" value={goal.methods} onChange={(e) => handleGoalChange(index, e)} placeholder="e.g., DTT, NET, Positive Reinforcement" required />
              {sessionData.goals.length > 1 && (
                <button 
                    type="button" 
                    onClick={() => removeGoal(index)} 
                    className="absolute top-2 right-2 p-1 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    aria-label={`Remove Goal ${index + 1}`}
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addGoal} className="mt-4 flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
          <PlusIcon />
          Add Another Goal
        </button>
      </div>

      <InputField label="Plan for Next Session" name="nextSessionPlan" type="textarea" value={sessionData.nextSessionPlan} onChange={handleChange} placeholder="e.g., Continue with Manding program, introduce new tacts for community helpers." required />

      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 sm:justify-between items-center">
        {/* Group for secondary actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onLoadExample}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border rounded-md transition-colors duration-200 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 dark:border-slate-600"
            >
              <DocumentTextIcon className="w-5 h-5" />
              Load Example
            </button>
            <button
              type="button"
              onClick={onResetForm}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border rounded-md transition-colors duration-200 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 dark:border-slate-600"
            >
              <ArrowPathIcon />
              Reset Form
            </button>
        </div>
        
        {/* Primary action */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-3 bg-indigo-600 text-white font-bold rounded-md shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed dark:disabled:bg-indigo-800 dark:focus:ring-offset-slate-900 transition-all duration-300 ease-in-out"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <SparklesIcon />
              Generate Note
            </>
          )}
        </button>
      </div>
    </form>
  );
};
