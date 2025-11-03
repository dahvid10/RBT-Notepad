
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { LightbulbIcon, SparklesIcon, ShareIcon, CheckIcon } from './icons';
import { ErrorDisplay } from './ErrorDisplay';

interface ChatbotProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onStartChat: () => void;
  isLoading: boolean;
  error: string | null;
  onErrorDismiss: () => void;
}

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isModel = message.role === 'model';
    const bubbleClasses = isModel
      ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 self-start'
      : 'bg-indigo-500 dark:bg-indigo-600 text-white self-end';
    
    // Renders a line of text with simple markdown for bolding (**text**).
    const renderMarkdown = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);
      return parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={index}>{part.slice(2, -2)}</strong>;
          }
          return part;
      });
    };
    
    // Improved markdown-like renderer that handles paragraphs, lists, and bold text.
    const renderText = (text: string) => {
        // Trim leading/trailing whitespace to avoid empty paragraphs from bad formatting
        const blocks = text.trim().split('\n\n');
        
        return blocks.map((block, i) => {
            const trimmedBlock = block.trim();
            if (trimmedBlock.startsWith('* ') || trimmedBlock.startsWith('- ')) {
                const items = trimmedBlock.split('\n').map((line, j) => {
                    const lineContent = line.trim().replace(/^[-*]\s*/, '');
                    if (lineContent) {
                        return <li key={j}>{renderMarkdown(lineContent)}</li>;
                    }
                    return null;
                });
                // Let prose handle the list styling (disc, padding, etc.)
                return <ul key={i}>{items}</ul>;
            }
            // Ensure we don't render empty paragraphs
            if (trimmedBlock) {
                 return <p key={i}>{renderMarkdown(trimmedBlock)}</p>;
            }
            return null;
        });
    };

    return (
        <li className={`w-full flex ${isModel ? 'justify-start' : 'justify-end'}`}>
            <div 
                className={`max-w-xl lg:max-w-2xl px-4 py-3 rounded-2xl shadow-sm prose prose-slate dark:prose-invert max-w-none leading-relaxed prose-p:my-3 prose-ul:my-4 prose-li:my-1 ${bubbleClasses}`} 
                style={{overflowWrap: 'break-word'}}
            >
                 {renderText(message.text)}
            </div>
        </li>
    );
};


export const Chatbot: React.FC<ChatbotProps> = ({ messages, onSendMessage, onStartChat, isLoading, error, onErrorDismiss }) => {
  const [input, setInput] = useState('');
  const [justShared, setJustShared] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (container) {
        const isScrolledToBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 1; // +1 for tolerance
        userScrolledUp.current = !isScrolledToBottom;
    }
  }

  const scrollToBottom = () => {
    if (chatContainerRef.current && !userScrolledUp.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
      userScrolledUp.current = false;
    }
  };
  
  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      if (document.execCommand('copy')) {
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
        <p className="mb-6 max-w-md">Start a conversation with an AI assistant to get creative and practical ideas for your next session.</p>
        <button
          type="button"
          onClick={onStartChat}
          disabled={isLoading}
          className="flex justify-center items-center gap-2 px-5 py-3 bg-teal-600 text-white font-bold rounded-md shadow-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-300 disabled:cursor-not-allowed dark:disabled:bg-teal-800 dark:focus:ring-offset-slate-900 transition-all duration-300 ease-in-out"
        >
          <LightbulbIcon />
          Get Session Ideas
        </button>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 flex flex-col max-h-[30rem]">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 p-4 shrink-0">
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

        <div className="flex-grow p-4 overflow-y-auto" ref={chatContainerRef} onScroll={handleScroll}>
            {error && <ErrorDisplay message={error} onDismiss={onErrorDismiss} />}
            <ul className="space-y-4">
                {isLoading && messages.length === 0 && (
                  <li className="flex flex-col items-center justify-center h-full space-y-3">
                    <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 dark:text-slate-400">
                      Generating creative ideas...
                    </p>
                  </li>
                )}
                {messages.length === 0 && !isLoading && !error && <InitialState />}
                {messages.map((msg, index) => (
                    <ChatBubble key={index} message={msg} />
                ))}
                {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                     <li className="w-full flex justify-start">
                        <div className="max-w-sm px-4 py-3 rounded-2xl shadow-sm bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 self-start flex items-center gap-2">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-0"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-300"></div>
                        </div>
                    </li>
                )}
            </ul>
        </div>
        
        { (messages.length > 0 || isLoading) && 
            <div className="border-t border-slate-200 dark:border-slate-700 p-4 shrink-0">
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
