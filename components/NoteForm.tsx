import React from 'react';
import type { SessionData, Goal } from '../types';
import { PlusIcon, TrashIcon, SparklesIcon, ClipboardDocumentIcon } from './icons';

interface NoteFormProps {
  sessionData: SessionData;
  setSessionData: React.Dispatch<React.SetStateAction<SessionData>>;
  onGenerateNote: () => void;
  isLoading: boolean;
}

const exampleSessionData: SessionData = {
  clientName: 'Alex P.',
  sessionDate: new Date().toISOString().split('T')[0], // Default to today
  startTime: '09:00',
  endTime: '11:00',
  venue: "Client's home",
  peoplePresent: 'Client, RBT, Mother',
  clientHealth: 'Client was energetic and appeared healthy. No signs of illness or distress were observed.',
  goals: [
    {
      name: 'Manding for preferred items',
      progress: 'Alex independently manded for his toy car 3 out of 5 opportunities presented. He required a verbal prompt ("What do you want?") for the remaining 2 opportunities.',
      methods: 'Natural Environment Teaching (NET), Verbal prompting, Positive reinforcement (access to item).',
    },
    {
      name: 'Following 2-step instructions',
      progress: 'Alex correctly followed 2-step novel instructions (e.g., "Get the book and sit down") with 80% accuracy across 10 trials.',
      methods: 'Discrete Trial Training (DTT), Errorless learning, Token economy.',
    },
  ],
  nextSessionPlan: 'Continue with manding program, focusing on fading verbal prompts. Introduce new tacts related to household objects. Generalize 2-step instructions to the community setting during next week\'s outing.',
};


const InputField: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; type?: string; placeholder?: string, required?: boolean }> = ({ label, name, value, onChange, type = 'text', placeholder, required = false }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
    {type === 'textarea' ? (
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={3}
        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
      />
    ) : (
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
      />
    )}
  </div>
);

export const NoteForm: React.FC<NoteFormProps> = ({ sessionData, setSessionData, onGenerateNote, isLoading }) => {

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSessionData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleGoalChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newGoals = [...sessionData.goals];
    newGoals[index] = { ...newGoals[index], [name]: value };
    setSessionData(prev => ({ ...prev, goals: newGoals }));
  };

  const addGoal = () => {
    setSessionData(prev => ({
      ...prev,
      goals: [...prev.goals, { name: '', progress: '', methods: '' }]
    }));
  };

  const removeGoal = (index: number) => {
    const newGoals = sessionData.goals.filter((_, i) => i !== index);
    setSessionData(prev => ({ ...prev, goals: newGoals }));
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      onGenerateNote();
  }
  
  const loadExampleData = () => {
      setSessionData(exampleSessionData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Session Details</h2>
        <button
          type="button"
          onClick={loadExampleData}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
          title="Load example data into the form"
        >
          <ClipboardDocumentIcon />
          Load Example
        </button>
      </div>
      
      <InputField label="Client Name" name="clientName" value={sessionData.clientName} onChange={handleChange} placeholder="e.g., John D." required />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputField label="Session Date" name="sessionDate" type="date" value={sessionData.sessionDate} onChange={handleChange} required />
        <InputField label="Start Time" name="startTime" type="time" value={sessionData.startTime} onChange={handleChange} required />
        <InputField label="End Time" name="endTime" type="time" value={sessionData.endTime} onChange={handleChange} required />
      </div>

      <InputField label="Venue" name="venue" value={sessionData.venue} onChange={handleChange} placeholder="e.g., Home, Community Center" required />
      <InputField label="People Present" name="peoplePresent" value={sessionData.peoplePresent} onChange={handleChange} placeholder="e.g., Client, RBT, Mother" required />
      <InputField label="Client Health & Appearance (Objective)" name="clientHealth" type="textarea" value={sessionData.clientHealth} onChange={handleChange} placeholder="e.g., Client appeared well-rested and wore weather-appropriate clothing. No signs of illness observed." required />

      <div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Goals & Interventions</h3>
        <div className="space-y-4">
          {sessionData.goals.map((goal, index) => (
            <div key={index} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3 relative">
              <InputField label={`Goal ${index + 1} Name`} name="name" value={goal.name} onChange={(e) => handleGoalChange(index, e)} placeholder="e.g., Manding for items" required />
              <InputField label="Data / Progress (Measurable & Objective)" name="progress" type="textarea" value={goal.progress} onChange={(e) => handleGoalChange(index, e)} placeholder="e.g., Mand for preferred items independently in 4/5 opportunities." required />
              <InputField label="Instructional Methods Used" name="methods" value={goal.methods} onChange={(e) => handleGoalChange(index, e)} placeholder="e.g., DTT, NET, Positive Reinforcement" required />
              {sessionData.goals.length > 1 && (
                <button type="button" onClick={() => removeGoal(index)} className="absolute top-2 right-2 p-1 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
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

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-indigo-600 text-white font-bold rounded-md shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed dark:disabled:bg-indigo-800 dark:focus:ring-offset-slate-900 transition-all duration-300 ease-in-out"
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