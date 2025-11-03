import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { LightbulbIcon, SparklesIcon, ShareIcon, CheckIcon } from './icons';

interface ChatbotProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onStartChat: () => void;
  isLoading: boolean;
  error: string | null;
}

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isModel = message.role === 'model';
    const bubbleClasses = isModel
      ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 self-start'
      : 'bg-indigo-500 dark:bg-indigo-600 text-white self-end';
    
    // A simple markdown-like renderer
    const renderText = (text: string) => {
        return text.split('\n').map((line, index) => {
            if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
                return <li key={index} className="ml-4 list-disc">{line.substring(line.indexOf(' ') + 1)}</li>;
            }
            if (line.includes('**')) {
                const parts = line.split('**');
                return <p key={index}>{parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}</p>;
            }
            if (line.trim() === '') return null;
            return <p key={index}>{line}</p>;
        });
    };

    return (
        <div className={`w-full flex ${isModel ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-xl lg:max-w-2xl px-4 py-3 rounded-2xl shadow-sm ${bubbleClasses}`}>
                 <div className="prose prose-slate dark:prose-invert max-w-none">
                    {renderText(message.text)}
                 </div>
            </div>
        </div>
    );
};


export const Chatbot: React.FC<ChatbotProps> = ({ messages, onSendMessage, onStartChat, isLoading, error }) => {
  const [input, setInput] = useState('');
  const [justShared, setJustShared] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  useEffect(() => {
    if (justShared) {
        const timer = setTimeout(() => setJustShared(false), 2500);
        return () => clearTimeout(timer);
    }
  }, [justShared]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };
  
  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setJustShared(true);
      }
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textArea);
  };

  const handleShareConversation = async () => {
    const formattedConversation = messages.map(msg => 
        `${msg.role === 'model' ? 'AI Assistant' : 'You'}:\n${msg.text}`
    ).join('\n\n---\n\n');

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'RBT Session Enhancement Ideas',
                text: formattedConversation,
            });
        } catch (error) {
             // This error is thrown when the user cancels the share dialog.
            // We can safely ignore it and not log it as an error.
            if (!(error instanceof DOMException && error.name === 'AbortError')) {
                console.error('Error sharing conversation:', error);
            }
        }
    } else {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(formattedConversation).then(() => {
                setJustShared(true);
            }).catch(() => {
                fallbackCopyTextToClipboard(formattedConversation);
            });
        } else {
            fallbackCopyTextToClipboard(formattedConversation);
        }
    }
  };

  const InitialState = () => (
    <div className="text-center text-slate-500 dark:text-slate-400 p-4 flex flex-col items-center justify-center h-full">
        <div className="bg-teal-100 dark:bg-teal-900/50 p-4 rounded-full mb-4">
            <LightbulbIcon />
        </div>
        <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300 mb-2">Ready to Brainstorm?</h3>
        <p className="mb-6">Start a conversation with an AI assistant to get creative and practical ideas for your next session.</p>
        <button
          type="button"
          onClick={onStartChat}
          disabled={isLoading}
          className="flex justify-center items-center gap-2 px-5 py-3 bg-teal-600 text-white font-bold rounded-md shadow-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-300 disabled:cursor-not-allowed dark:disabled:bg-teal-800 dark:focus:ring-offset-slate-900 transition-all duration-300 ease-in-out"
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
              <LightbulbIcon />
              Get Session Ideas
            </>
          )}
        </button>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 flex flex-col max-h-[30rem]">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
                <SparklesIcon />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Enhancement Ideas Chat</h2>
            </div>
            {messages.length > 0 && (
                <button 
                    onClick={handleShareConversation}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-md transition-colors duration-200 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 dark:border-slate-600"
                    title="Share Conversation"
                >
                    {justShared ? <CheckIcon /> : <ShareIcon />}
                    {justShared ? 'Copied!' : 'Share'}
                </button>
            )}
        </div>

        <div className="flex-grow p-4 space-y-4 overflow-y-auto">
            {isLoading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full space-y-3">
                <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 dark:text-slate-400">
                  Generating creative ideas...
                </p>
              </div>
            )}
            {messages.length === 0 && !isLoading && !error && <InitialState />}
            {messages.map((msg, index) => (
                <ChatBubble key={index} message={msg} />
            ))}
            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                 <div className="w-full flex justify-start">
                    <div className="max-w-sm px-4 py-3 rounded-2xl shadow-sm bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 self-start flex items-center gap-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-0"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-300"></div>
                    </div>
                </div>
            )}
             <div ref={messagesEndRef} />
        </div>
        
        {error && <p className="p-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
        
        { (messages.length > 0 || isLoading) && 
            <div className="border-t border-slate-200 dark:border-slate-700 p-4">
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
                <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a follow-up question..."
                disabled={isLoading}
                className="flex-grow px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 transition disabled:opacity-50"
                />
                <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-full shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed dark:disabled:bg-indigo-800 dark:focus:ring-offset-slate-900 transition"
                aria-label="Send message"
                >
                Send
                </button>
            </form>
            </div>
        }
    </div>
  );
};
