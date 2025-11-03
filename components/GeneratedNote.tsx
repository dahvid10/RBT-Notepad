import React, { useState, useEffect, useRef } from 'react';
import * as docx from 'docx';
import { jsPDF } from 'jspdf';
import { CopyIcon, CheckIcon, DownloadIcon, EditIcon, ShareIcon, EllipsisVerticalIcon } from './icons';
import type { SessionData } from '../types';

interface GeneratedNoteProps {
  note: string;
  isLoading: boolean;
  sessionData: SessionData;
  onNoteUpdate: (newNote: string) => void;
}

export const GeneratedNote: React.FC<GeneratedNoteProps> = ({ note, isLoading, sessionData, onNoteUpdate }) => {
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

  const fallbackCopyTextToClipboard = (text: string, callback: () => void) => {
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
        callback();
      }
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textArea);
  };

  const handleCopy = () => {
    const onCopySuccess = () => {
        setActionFeedback('Copied!');
        setIsActionsMenuOpen(false);
    };
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(editedNote).then(onCopySuccess).catch(() => {
            fallbackCopyTextToClipboard(editedNote, onCopySuccess);
        });
    } else {
        fallbackCopyTextToClipboard(editedNote, onCopySuccess);
    }
  };

  const handleShare = async () => {
    const onShareSuccess = () => {
      setActionFeedback('Copied!');
      setIsActionsMenuOpen(false);
    };
    if (navigator.share) {
        try {
            await navigator.share({
                title: `RBT Session Note for ${sessionData.clientName}`,
                text: editedNote,
            });
             setIsActionsMenuOpen(false);
        } catch (error) {
            // This error is thrown when the user cancels the share dialog.
            // We can safely ignore it and not log it as an error.
            if (!(error instanceof DOMException && error.name === 'AbortError')) {
                console.error('Error sharing:', error);
            }
        }
    } else {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(editedNote).then(onShareSuccess).catch(() => {
                fallbackCopyTextToClipboard(editedNote, onShareSuccess);
            });
        } else {
            fallbackCopyTextToClipboard(editedNote, onShareSuccess);
        }
    }
  };

   useEffect(() => {
    if (actionFeedback) {
        const timer = setTimeout(() => setActionFeedback(''), 2500);
        return () => clearTimeout(timer);
    }
  }, [actionFeedback]);
  
  const getSafeFileName = () => {
      const safeClientName = sessionData.clientName.replace(/[^a-z0-9]/gi, '_');
      return `RBT_Note_${safeClientName}_${sessionData.sessionDate}`;
  }
  
  const handleSaveChanges = () => {
    onNoteUpdate(editedNote);
    setIsEditing(false);
  };

  const handleDownload = (format: 'docx' | 'pdf' | 'txt') => {
    if (!editedNote || !sessionData.clientName) return;
    setIsDownloading(true);
    setIsActionsMenuOpen(false);

    const finishDownload = () => setIsDownloading(false);

    switch(format) {
        case 'docx':
            handleDownloadDocx().finally(finishDownload);
            break;
        case 'pdf':
            handleDownloadPdf();
            finishDownload();
            break;
        case 'txt':
            handleDownloadTxt();
            finishDownload();
            break;
    }
  };

  const handleDownloadDocx = async () => {
    const doc = new docx.Document({
      sections: [{
        children: [
          new docx.Paragraph({
            children: [
              new docx.TextRun({ text: `Client: ${sessionData.clientName}`, bold: true, size: 28 }),
            ],
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

    try {
        const blob = await docx.Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${getSafeFileName()}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Error generating DOCX file:", err);
    }
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

    const splitText = doc.splitTextToSize(editedNote, 180); // 180mm width
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
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const NoteContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400">Generating your note...</p>
        </div>
      );
    }
    if (!note) {
      return <p className="text-slate-500 dark:text-slate-400 text-center">Your generated note will appear here.</p>;
    }

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

    return (
        <div className="prose prose-slate dark:prose-invert max-w-none">
            {editedNote.split('\n').map((paragraph, index) => (
                paragraph.trim() && <p key={index}>{paragraph}</p>
            ))}
        </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 max-h-[30rem] flex flex-col">
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
                            setEditedNote(note); // Reset changes
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
                        aria-label="More actions"
                    >
                        <EllipsisVerticalIcon />
                    </button>
                    {isActionsMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-700 rounded-md shadow-lg border dark:border-slate-600 z-10">
                        <ul className="py-1 text-slate-700 dark:text-slate-200">
                           <li className="px-4 py-2 text-xs text-slate-400 dark:text-slate-500">Actions</li>
                            <li>
                                <button onClick={handleCopy} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-600">
                                     {actionFeedback === 'Copied!' ? <CheckIcon/> : <CopyIcon />}
                                     {actionFeedback === 'Copied!' ? 'Copied!' : 'Copy to Clipboard'}
                                </button>
                            </li>
                             <li>
                                <button onClick={handleShare} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-600">
                                    <ShareIcon />
                                    Share Note
                                </button>
                            </li>
                            <li className="border-t border-slate-200 dark:border-slate-600 my-1"></li>
                            <li className="px-4 py-2 text-xs text-slate-400 dark:text-slate-500">Download</li>
                             <li>
                                <button onClick={() => handleDownload('docx')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-600">
                                    <DownloadIcon />
                                    as DOCX
                                </button>
                            </li>
                            <li>
                                <button onClick={() => handleDownload('pdf')} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-600">
                                    <DownloadIcon />
                                    as PDF
                                </button>
                            </li>
                            <li>
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
      <div className={`flex-grow ${note && !isEditing ? 'overflow-y-auto' : ''} ${!note && !isLoading ? 'flex items-center justify-center' : ''}`}>
        <NoteContent />
      </div>
    </div>
  );
};
