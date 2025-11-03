
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { NoteForm } from './components/NoteForm';
import { GeneratedNote } from './components/GeneratedNote';
import { Header } from './components/Header';
import { ErrorDisplay } from './components/ErrorDisplay';
import { Chatbot } from './components/Chatbot';
import { Tabs } from './components/Tabs';
import type { SessionData, ChatMessage } from './types';
import { generateRbtNote, buildIdeasPrompt, AI_MODELS } from './services/geminiService';

// Create a single, reusable AI instance
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const EXAMPLE_SESSION_DATA: SessionData = {
  clientName: 'Alex P.',
  sessionDate: new Date().toISOString().split('T')[0],
  startTime: '09:00',
  endTime: '11:00',
  venue: "Client's home",
  peoplePresent: 'Client, RBT, Mother',
  clientHealth: 'Client was in good health, energetic, and ready to engage in activities.',
  goals: [
    {
      name: 'Manding for preferred items',
      progress: 'Client independently manded for 3 different preferred toys (car, ball, blocks) on 4 out of 5 opportunities presented.',
      methods: 'Natural Environment Teaching (NET), Positive Reinforcement (praise and access to item).',
    },
    {
      name: 'Following 2-step instructions',
      progress: "Client followed 2-step instructions with gestural prompts on 60% of trials. For example, 'Get your shoes and sit down'.",
      methods: 'Discrete Trial Training (DTT), gestural prompting, token economy system.',
    },
  ],
  nextSessionPlan: 'Continue working on manding with new items. Fade gestural prompts for 2-step instructions and introduce social story for sharing.',
};

const RESET_SESSION_DATA: SessionData = {
  clientName: '',
  sessionDate: '',
  startTime: '',
  endTime: '',
  venue: "",
  peoplePresent: '',
  clientHealth: '',
  goals: [
    {
      name: '',
      progress: '',
      methods: '',
    },
  ],
  nextSessionPlan: '',
};


const App: React.FC = () => {
  const [sessionData, setSessionData] = useState<SessionData>(RESET_SESSION_DATA);

  // State for Note Generation
  const [generatedNote, setGeneratedNote] = useState<string>('');
  const [isNoteLoading, setIsNoteLoading] = useState<boolean>(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // State for Ideas Chatbot
  const [chat, setChat] = useState<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  
  // State for sub-tabs (Note vs Ideas)
  const [activeTab, setActiveTab] = useState<'note' | 'ideas'>('note');
  
  // State for main tabs (Form vs Results)
  const [mainTab, setMainTab] = useState<'form' | 'results'>('form');
  const [resultsAvailable, setResultsAvailable] = useState<boolean>(false);

  // State for Theme
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Effect to apply theme class and save to localStorage
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);


  const handleGenerateNote = useCallback(async () => {
    setIsNoteLoading(true);
    setNoteError(null);
    setGeneratedNote('');
    // Clear previous chat history for a clean slate
    setChatHistory([]);
    setChat(null);
    setChatError(null);
    try {
      const note = await generateRbtNote(sessionData, ai);
      setGeneratedNote(note);
      setActiveTab('note');
      setMainTab('results');
      setResultsAvailable(true);
    } catch (e) {
      console.error(e);
      setNoteError(e instanceof Error ? e.message : 'An unknown error occurred.');
      setMainTab('results');
      setActiveTab('note');
      setResultsAvailable(true);
    } finally {
      setIsNoteLoading(false);
    }
  }, [sessionData]);

  const handleStartChat = useCallback(async () => {
    setIsChatLoading(true);
    setChatError(null);
    setChatHistory([]);
    setActiveTab('ideas');
    setMainTab('results');
    setResultsAvailable(true);

    try {
      const newChat = ai.chats.create({
        model: AI_MODELS.PRO,
      });
      setChat(newChat);

      const prompt = buildIdeasPrompt(sessionData);
      const stream = await newChat.sendMessageStream({ message: prompt });
      
      let currentText = '';
      setChatHistory([{ role: 'model', text: '' }]);
      
      for await (const chunk of stream) {
        currentText += chunk.text;
        setChatHistory([{ role: 'model', text: currentText }]);
      }
    } catch (e) {
      console.error(e);
      setChatError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsChatLoading(false);
    }
  }, [sessionData]);

  const handleSendChatMessage = useCallback(async (message: string) => {
    if (!chat) return;

    setIsChatLoading(true);
    setChatError(null);

    const userMessage: ChatMessage = { role: 'user', text: message };
    setChatHistory(prev => [...prev, userMessage]);

    try {
        const stream = await chat.sendMessageStream({ message });
        
        let currentText = '';
        setChatHistory(prev => [...prev, { role: 'model', text: '' }]);

        for await (const chunk of stream) {
            currentText += chunk.text;
            setChatHistory(prev => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1] = { role: 'model', text: currentText };
                return newHistory;
            });
        }
    } catch (e) {
        console.error(e);
        setChatError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
        setIsChatLoading(false);
    }
  }, [chat]);

  const handleLoadExample = () => {
    setSessionData(EXAMPLE_SESSION_DATA);
  };

  const handleResetForm = () => {
    setSessionData(RESET_SESSION_DATA);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <Header theme={theme} setTheme={setTheme} />
      <main className="container mx-auto p-4 md:p-8">
        
        <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
          <nav className="-mb-px flex space-x-8" aria-label="Main Tabs">
            <button
              onClick={() => setMainTab('form')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                mainTab === 'form'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200 dark:hover:border-slate-600'
              }`}
            >
              Session Details
            </button>
            <button
              onClick={() => resultsAvailable && setMainTab('results')}
              disabled={!resultsAvailable}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                mainTab === 'results'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200 dark:hover:border-slate-600'
              } ${!resultsAvailable ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              Generated Results
            </button>
          </nav>
        </div>

        {mainTab === 'form' && (
          <div className="max-w-4xl mx-auto">
            <NoteForm
              sessionData={sessionData}
              setSessionData={setSessionData}
              onGenerateNote={handleGenerateNote}
              isLoading={isNoteLoading}
              onLoadExample={handleLoadExample}
              onResetForm={handleResetForm}
            />
          </div>
        )}

        {mainTab === 'results' && (
           <div className="max-w-4xl mx-auto">
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <div className={`mt-6 ${activeTab === 'note' ? 'block' : 'hidden'}`}>
              {noteError && <ErrorDisplay message={noteError} onDismiss={() => setNoteError(null)} />}
              <GeneratedNote 
                note={generatedNote} 
                isLoading={isNoteLoading} 
                sessionData={sessionData}
                onNoteUpdate={setGeneratedNote}
                hasError={!!noteError}
              />
            </div>

            <div className={`mt-6 ${activeTab === 'ideas' ? 'block' : 'hidden'}`}>
              <Chatbot 
                messages={chatHistory}
                onSendMessage={handleSendChatMessage}
                onStartChat={handleStartChat}
                isLoading={isChatLoading}
                error={chatError}
                onErrorDismiss={() => setChatError(null)}
              />
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
