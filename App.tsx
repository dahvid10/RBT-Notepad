import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { NoteForm } from './components/NoteForm';
import { GeneratedNote } from './components/GeneratedNote';
import { Header } from './components/Header';
import { ErrorDisplay } from './components/ErrorDisplay';
import { Chatbot } from './components/Chatbot';
import { Tabs } from './components/Tabs';
import type { SessionData, ChatMessage } from './types';
import { generateRbtNote } from './services/geminiService';

const App: React.FC = () => {
  const [sessionData, setSessionData] = useState<SessionData>({
    clientName: '',
    sessionDate: '',
    startTime: '',
    endTime: '',
    venue: '',
    peoplePresent: '',
    clientHealth: '',
    goals: [{ name: '', progress: '', methods: '' }],
    nextSessionPlan: '',
  });

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


  const handleGenerateNote = useCallback(async () => {
    setIsNoteLoading(true);
    setNoteError(null);
    setGeneratedNote('');
    try {
      const note = await generateRbtNote(sessionData);
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

  const buildIdeasPrompt = (data: SessionData): string => {
    const goalsText = data.goals
      .map(
        (goal) => `
  - **Goal:** "${goal.name}"
    - **Client's Progress:** ${goal.progress}
    - **Methods Used:** ${goal.methods}`
      )
      .join('');
  
    return `
      As an expert Board Certified Behavior Analyst (BCBA) supervising an RBT, your task is to generate creative and actionable ideas to enhance the next therapy session's effectiveness. Based on the session summary below, provide 3-5 concrete suggestions.
  
      **Guiding Principles for Your Suggestions:**
      1.  **Enhance Engagement:** Propose novel materials, activities, or ways to incorporate the client's interests.
      2.  **Promote Generalization:** Suggest how to practice skills in different settings or with different people/materials.
      3.  **Increase Skill Acquisition:** Recommend slight modifications to teaching procedures (e.g., changing prompting, reinforcement schedules).
      4.  **Be Practical:** Ideas should be feasible for an RBT to implement in a typical session setting (${data.venue}).
  
      **Session Summary:**
      - **Client:** ${data.clientName}
      - **Goals Worked On:** ${goalsText}
      - **Venue:** ${data.venue}
      - **Plan for Next Session:** ${data.nextSessionPlan}
  
      Now, provide a list of creative and practical ideas to enhance the next session. After you provide the ideas, ask me a follow-up question to keep the conversation going.
    `;
  }

  const handleStartChat = useCallback(async () => {
    setIsChatLoading(true);
    setChatError(null);
    setChatHistory([]);
    setActiveTab('ideas');
    setMainTab('results');
    setResultsAvailable(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const newChat = ai.chats.create({
        model: 'gemini-2.5-pro',
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <Header />
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
            />
          </div>
        )}

        {mainTab === 'results' && (
           <div className="max-w-4xl mx-auto">
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <div className={`mt-6 ${activeTab === 'note' ? 'block' : 'hidden'}`}>
              <GeneratedNote note={generatedNote} isLoading={isNoteLoading} sessionData={sessionData} />
              {noteError && <ErrorDisplay message={noteError} />}
            </div>

            <div className={`mt-6 ${activeTab === 'ideas' ? 'block' : 'hidden'}`}>
              <Chatbot 
                messages={chatHistory}
                onSendMessage={handleSendChatMessage}
                onStartChat={handleStartChat}
                isLoading={isChatLoading}
                error={chatError}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;