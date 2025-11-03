
import React, { useState, useEffect, useRef } from 'react';
import * as docx from 'docx';
import { jsPDF } from 'jspdf';
import { CopyIcon, CheckIcon, DownloadIcon, EditIcon, ShareIcon, EllipsisVerticalIcon, DocumentTextIcon } from './icons';
import type { SessionData } from '../types';

interface GeneratedNoteProps {
  note: string;
  isLoading: boolean;
  sessionData: SessionData;
  onNoteUpdate: (newNote: string) => void;
  hasError: boolean;
}

export const GeneratedNote: React.FC<GeneratedNoteProps> = ({ note, isLoading, sessionData, onNoteUpdate, hasError }) => {
  const [actionFeedback, setActionFeedback] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNote, setEditedNote] = useState(note);
  
  useEffect(() => {
    setEditedNote(note);
    setIsEditing(false);
  }, [note]);

  const showFeedback = (message: string) => {
    setActionFeedback(message);
    setTimeout(() => {
        setActionFeedback('');
        // Close menu after feedback is shown and cleared for a better UX
        setIsActionsMenuOpen(false);
    }, 2000);
  }

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
        showFeedback('Copied!');
      }
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textArea);
  };

  const handleCopy = () => {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(editedNote).then(() => showFeedback('Copied!')).catch(() => {
            fallbackCopyTextToClipboard(editedNote);
        });
    } else {
        fallbackCopyTextToClipboard(editedNote);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: `RBT Session Note for ${sessionData.clientName}`,
                text: editedNote,
            });
             setIsActionsMenuOpen(false);
        } catch (error) {
            if (!(error instanceof DOMException && error.name === 'AbortError')) {
                console.error('Error sharing:', error);
            }
        }
    } else {
        // Fallback to copy for browsers that don't support Web Share API
        handleCopy();
    }
  };
  
  const getSafeFileName = () => {
      const safeClientName = (sessionData.clientName || 'Client').replace(/[^a-z0-9]/gi, '_');
      const safeDate = sessionData.sessionDate || new Date().toISOString().split('T')[0];
      return `RBT_Note_${safeClientName}_${safeDate}`;
  }
  
  const handleSaveChanges = () => {
    onNoteUpdate(editedNote);
    setIsEditing(false);
  };

  const handleDownload = async (format: 'docx' | 'pdf' | 'txt') => {
    if (!editedNote || isDownloading) return;
    setIsDownloading(true);
    
    try {
      switch(format) {
          case 'docx':
              await handleDownloadDocx();
              break;
          case 'pdf':
              handleDownloadPdf();
              break;
          case 'txt':
              handleDownloadTxt();
              break;
      }
    } catch (error) {
      console.error(`Failed to download as ${format}`, error);
      // Here you could set an error state to show a message to the user
    } finally {
        setIsDownloading(false);
        setIsActionsMenuOpen(false);
    }
  };

  const handleDownloadDocx = async () => {
    const doc = new docx.Document({
      sections: [{
        properties: {},
        children: [
          new docx.Paragraph({
            children: [ new docx.TextRun({ text: `Client: ${sessionData.clientName}`, bold: true, size: 28 }) ],
            spacing: { after: 200 },
          }),
          new docx.Paragraph({
            children: [ new docx.TextRun({ text: `Date: ${sessionData.sessionDate || 'N/A'}`, size: 24 }) ],
          }),
          new docx.Paragraph({
            children: [ new docx.TextRun({ text: `Time: ${sessionData.startTime || 'N/A'} - ${sessionData.endTime || 'N/A'}`, size: 24 }) ],
            spacing: { after: 400 },
          }),
          ...editedNote.split('\n').filter(p => p.trim() !== '').map(paragraph =>
            new docx.Paragraph({ text: paragraph, spacing: { after: 150 } })
          ),
        ],
      }],
    });
    const blob = await docx.Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getSafeFileName()}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Client: ${sessionData.clientName}`, 15, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${sessionData.sessionDate || 'N/A'}`, 15, 30);
    doc.text(`Time: ${sessionData.startTime || 'N/A'} - ${sessionData.endTime || 'N/A'}`, 15, 38);
    const splitText = doc.splitTextToSize(editedNote, 180);
    doc.text(splitText, 15, 50);
    doc.save(`${getSafeFileName()}.pdf`);
  };

  const handleDownloadTxt = () => {
    const header = `Client: ${sessionData.clientName}\nDate: ${sessionData.sessionDate || 'N/A'}\nTime: ${sessionData.startTime || 'N/A'} - ${sessionData.endTime || 'N/A'}\n\n`;
    const content = header + editedNote;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getSafeFileName()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsActionsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const NoteContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-3 h-full">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400">Generating your note...</p>
        </div>
      );
    }
    if (!note && !hasError) {
      return (
        <div className="text-center text-slate-500 dark:text-slate-400 p-4 flex flex-col items-center justify-center h-full">
          <DocumentTextIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">Note Not Generated Yet</h3>
          <p>Fill out the session details and click "Generate Note" to see the AI-powered result here.</p>
        </div>
      );
    }
    if (hasError) return null;

    if (isEditing) {
        return (
            <textarea
                value={editedNote}
                onChange={(e) => setEditedNote(e.target.value)}
                className="w-full h-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-mono text-sm"
                rows={15}
                aria-label="Editable note content"
            />
        )
    }

    // Renders text with simple markdown for bolding (**text**).
    const renderMarkdown = (text: string) => {
        return text.split('\n').map((paragraph, pIndex) => {
            if (!paragraph.trim()) return null;
            // Split paragraph by bold markdown (**...**), keeping the delimiters
            const parts = paragraph.split(/(\*\*.*?\*\*)/g).filter(Boolean);
            return (
                <p key={pIndex}>
                    {parts.map((part, partIndex) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            // Render as bold
                            return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
                        }
                        // Render as plain text
                        return part;
                    })}
                </p>
            );
        });
    };

    return (
        <div className="prose prose-slate dark:prose-invert max-w-none">
            {renderMarkdown(editedNote)}
        </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 max-h-[30rem] flex flex-col ${hasError ? 'mt-4' : ''}`}>
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Generated Note</h2>
        {note && !isLoading && (
          <div className="flex items-center gap-2">
            {isEditing ? (
                 <>
                    <button
                        onClick={handleSaveChanges}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-md transition-colors duration-200 bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700"
                    >
                        Save Changes
                    </button>
                    <button
                        onClick={() => {
                            setIsEditing(false);
                            setEditedNote(note);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-md transition-colors duration-200 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 dark:border-slate-600"
                    >
                        Cancel
                    </button>
                 </>
            ) : (
                <>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-md transition-colors duration-200
                                bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200
                                dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 dark:border-slate-600"
                    >
                        <EditIcon />
                        Edit
                    </button>
                    
                    <div className="relative" ref={actionsMenuRef}>
                    <button
                        onClick={() => setIsActionsMenuOpen(prev => !prev)}
                        disabled={isDownloading}
                        className="flex items-center p-1.5 text-sm font-medium border rounded-md transition-colors duration-200
                                bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200
                                dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 dark:border-slate-600
                                disabled:opacity-50 disabled:cursor-wait"
                        aria-haspopup="true"
                        aria-expanded={isActionsMenuOpen}
                        aria-label="More actions"
                    >
                        {isDownloading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></div> : <EllipsisVerticalIcon />}
                    </button>
                    {isActionsMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-700 rounded-md shadow-lg border dark:border-slate-600 z-10" role="menu">
                          <ul className="py-1 text-slate-700 dark:text-slate-200">
                             <li className="px-4 py-2 text-xs text-slate-400 dark:text-slate-500" role="presentation">Actions</li>
                              <li role="menuitem">
                                  <button onClick={handleCopy} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50" disabled={!!actionFeedback}>
                                       {actionFeedback === 'Copied!' ? <CheckIcon/> : <CopyIcon />}
                                       {actionFeedback === 'Copied!' ? 'Copied!' : 'Copy to Clipboard'}
                                  </button>
                              </li>
                               <li role="menuitem">
                                  <button onClick={handleShare} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50" disabled={!!actionFeedback}>
                                      <ShareIcon />
                                      Share Note
                                  </button>
                              </li>
                              <li className="border-t border-slate-200 dark:border-slate-600 my-1" role="separator"></li>
                              <li className="px-4 py-2 text-xs text-slate-400 dark:text-slate-500" role="presentation">Download</li>
                               <li role="menuitem">
                                  <button onClick={() => handleDownload('docx')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-600">
                                      <DownloadIcon />
                                      as DOCX
                                  </button>
                              </li>
                              <li role="menuitem">
                                  <button onClick={() => handleDownload('pdf')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-600">
                                      <DownloadIcon />
                                      as PDF
                                  </button>
                              </li>
                              <li role="menuitem">
                                  <button onClick={() => handleDownload('txt')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-600">
                                      <DownloadIcon />
                                      as TXT
                                  </button>
                              </li>
                          </ul>
                        </div>
                    )}
                    </div>
              </>
            )}
          </div>
        )}
      </div>
      <div className={`flex-grow ${note && !isEditing ? 'overflow-y-auto' : ''} ${!note && !isLoading && !hasError ? 'flex items-center justify-center' : ''}`}>
        <NoteContent />
      </div>
    </div>
  );
};
