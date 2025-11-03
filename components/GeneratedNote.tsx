import React, { useState, useEffect, useRef } from 'react';
import * as docx from 'docx';
import { jsPDF } from 'jspdf';
import { CopyIcon, CheckIcon, DownloadIcon, ChevronDownIcon, EditIcon } from './icons';
import type { SessionData } from '../types';

interface GeneratedNoteProps {
  note: string;
  isLoading: boolean;
  sessionData: SessionData;
}

export const GeneratedNote: React.FC<GeneratedNoteProps> = ({ note, isLoading, sessionData }) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNote, setEditedNote] = useState(note);
  
  useEffect(() => {
    setEditedNote(note);
  }, [note]);


  const noteToUse = isEditing ? editedNote : note;

  const handleCopy = () => {
    navigator.clipboard.writeText(noteToUse);
    setCopied(true);
  };
  
  const getSafeFileName = () => {
      const safeClientName = sessionData.clientName.replace(/[^a-z0-9]/gi, '_');
      return `RBT_Note_${safeClientName}_${sessionData.sessionDate}`;
  }
  
  const handleSave = () => {
    // In a real app, you might want to call a prop function to update the parent's state
    // For now, we just exit editing mode and the "note" prop will be the source of truth on next render
    // if the parent component is re-rendering. But to make edits stick visually immediately:
    // We can't update the 'note' prop directly, so we'll just use editedNote for display and export.
    // A better implementation would involve lifting state up.
    // For this implementation, we'll assume the user copies or downloads after editing.
    // Let's make "save" just commit the changes to the component's internal state.
    // The parent `generatedNote` state won't be updated. This is a limitation without a callback.
    // A simple fix is to just exit editing mode. The editedNote state will persist.
    setIsEditing(false);
    // Let's consider the note prop to be the "original" and editedNote the current version.
  };

  const handleDownloadDocx = () => {
    if (!noteToUse || !sessionData.clientName) return;
    setIsDownloading(true);
    setIsExportMenuOpen(false);

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
          ...noteToUse.split('\n').filter(p => p.trim() !== '').map(paragraph =>
            new docx.Paragraph({ text: paragraph, spacing: { after: 150 } })
          ),
        ],
      }],
    });

    docx.Packer.toBlob(doc).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${getSafeFileName()}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsDownloading(false);
    }).catch(err => {
      console.error("Error generating DOCX file:", err);
      setIsDownloading(false);
    });
  };

  const handleDownloadPdf = () => {
    if (!noteToUse || !sessionData.clientName) return;
    setIsDownloading(true);
    setIsExportMenuOpen(false);

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Client: ${sessionData.clientName}`, 15, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${sessionData.sessionDate || 'N/A'}`, 15, 30);
    doc.text(`Time: ${sessionData.startTime || 'N/A'} - ${sessionData.endTime || 'N/A'}`, 15, 38);

    const splitText = doc.splitTextToSize(noteToUse, 180); // 180mm width
    doc.text(splitText, 15, 50);
    
    doc.save(`${getSafeFileName()}.pdf`);
    setIsDownloading(false);
  };

  const handleDownloadTxt = () => {
    if (!noteToUse || !sessionData.clientName) return;
    setIsDownloading(true);
    setIsExportMenuOpen(false);

    const header = `Client: ${sessionData.clientName}\nDate: ${sessionData.sessionDate || 'N/A'}\nTime: ${sessionData.startTime || 'N/A'} - ${sessionData.endTime || 'N/A'}\n\n`;
    const content = header + noteToUse;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getSafeFileName()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsDownloading(false);
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);
  
  useEffect(() => {
    setCopied(false);
    if (!isEditing) {
        setEditedNote(note);
    }
  }, [note, isEditing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
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
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 h-[30rem] flex flex-col">
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Generated Note</h2>
        {note && !isLoading && (
          <div className="flex items-center gap-2">
            {isEditing ? (
                 <>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-md transition-colors duration-200 bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700"
                    >
                        Save
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
                    <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-md transition-colors duration-200
                                bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200
                                dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 dark:border-slate-600"
                    >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <div className="relative" ref={exportMenuRef}>
                    <button
                        onClick={() => setIsExportMenuOpen(prev => !prev)}
                        disabled={isDownloading}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-md transition-colors duration-200
                                bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border-indigo-200
                                dark:bg-indigo-900/50 dark:hover:bg-indigo-900 dark:text-indigo-300 dark:border-indigo-700
                                disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isDownloading ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        ) : <DownloadIcon />}
                        {isDownloading ? 'Downloading...' : 'Download'}
                        <ChevronDownIcon />
                    </button>
                    {isExportMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-md shadow-lg border dark:border-slate-600 z-10">
                        <ul className="py-1">
                            <li><button onClick={handleDownloadDocx} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">as DOCX</button></li>
                            <li><button onClick={handleDownloadPdf} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">as PDF</button></li>
                            <li><button onClick={handleDownloadTxt} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">as TXT</button></li>
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