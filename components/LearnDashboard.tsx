'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Note, subscribeToNotes, createNote, deleteNote } from '@/services/firestoreService';
import { runGroundedQA } from '@/services/geminiService';
import { LoadingSpinner, ErrorMessage } from './common/Common';
import { Plus, Trash2, MessageCircle, ArrowLeft, Upload, FileText, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { extractTextFromPDF } from '@/lib/pdfExtractor';

export function LearnDashboard() {
  const { user, signInWithGoogle } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Note State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  
  // QA State
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', content: string}[]>([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of chat when it updates
  useEffect(() => {
    if (isChatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isChatOpen, qaLoading]);

  useEffect(() => {
    // Always load local notes first
    const storedLocal = localStorage.getItem('localNotes');
    const localNotes: Note[] = storedLocal ? JSON.parse(storedLocal) : [];
    
    if (!user) {
      setNotes(localNotes);
      setLoading(false);
      return;
    }
    
    // If user is here, subscribe to remote notes and append any local ones
    const unsubscribe = subscribeToNotes(user.uid, (fetchedNotes) => {
      // Ensure we don't duplicate by checking IDs, though they are stored in different places.
      // Usually, if a user signs in, they'd want their local notes pushed or just to see both.
      // We'll show local notes + remote notes.
      setNotes([...localNotes, ...fetchedNotes]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleCreate = async () => {
    if (!newTitle || !newContent) return;
    
    if (user?.uid) {
      await createNote(user.uid, newTitle, newContent);
    } else {
      // Create local ephemeral note for testing without saving to cloud
      // This will NOT trigger a Google Sign In blocker
      const newLocalNote: Note = {
        id: `local-${Date.now()}`,
        userId: 'guest',
        title: newTitle,
        content: newContent,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const storedLocal = localStorage.getItem('localNotes');
      const existingLocalNotes = storedLocal ? JSON.parse(storedLocal) : [];
      const updatedLocalNotes = [newLocalNote, ...existingLocalNotes];
      localStorage.setItem('localNotes', JSON.stringify(updatedLocalNotes));
      
      setNotes(prev => [newLocalNote, ...prev]);
    }
    
    setNewTitle('');
    setNewContent('');
    setIsCreating(false);
  };

  const handleAskQuestion = async () => {
    if (!selectedNote || !question.trim()) return;
    
    setQaLoading(true);
    const userQ = question.trim();
    setQuestion('');
    
    setChatHistory(prev => {
      const newHistory: {role: 'user' | 'model', content: string}[] = [
        ...prev,
        { role: 'user', content: userQ }
      ];
      
      // Need an IIFE to run async state inside the sync state setter wrapper, 
      // passing the truly resolved recent history array
      (async () => {
        try {
          const response = await runGroundedQA(selectedNote.content, newHistory);
          setChatHistory(curr => [...curr, { role: 'model', content: response }]);
        } catch (err: any) {
          console.error("handleAskQuestion Error:", err);
          setChatHistory(curr => [...curr, { role: 'model', content: `Failed to get an answer: ${err.message}` }]);
        } finally {
          setQaLoading(false);
        }
      })();
      
      return newHistory;
    });
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsExtractingPdf(true);
    try {
      const extractedText = await extractTextFromPDF(file);
      setNewTitle(file.name.replace('.pdf', ''));
      setNewContent(extractedText);
    } catch (err) {
      console.error("Failed to parse PDF:", err);
      // Fallback or error state handling could be added here
    }
    setIsExtractingPdf(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset input
    }
  };

  if (loading) return <LoadingSpinner />;

  if (selectedNote) {
    return (
      <div className="space-y-6">
        <button onClick={() => { setSelectedNote(null); setChatHistory([]); setQuestion(''); }} className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Notes
        </button>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedNote.title}</h2>
          <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
            {selectedNote.content}
          </div>
        </div>

        {/* AI Floating Action Button & Chat Window */}
        <div className="fixed bottom-6 right-6 flex flex-col items-end z-50">
          {/* Chat Window - conditionally rendered */}
          {isChatOpen ? (
            <div className="bg-white rounded-lg shadow-xl border border-blue-200 w-80 sm:w-96 h-[500px] mb-4 overflow-hidden flex flex-col transition-all duration-300 transform origin-bottom-right">
              <div className="bg-blue-600 p-3 text-white flex justify-between items-center z-10 shadow-sm">
                <h3 className="font-semibold flex items-center text-sm">
                  <MessageCircle className="w-4 h-4 mr-2" /> Ask AI
                </h3>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="text-blue-100 hover:text-white"
                >
                  <span className="sr-only">Close</span>
                  &times;
                </button>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto bg-gray-50 flex flex-col space-y-4">
                {chatHistory.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center italic mt-auto mb-auto">
                    Ask a question about this note to get started. Follow up questions are supported!
                  </div>
                ) : (
                  chatHistory.map((msg, idx) => (
                     <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 text-sm shadow-sm leading-relaxed ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-tl-xl rounded-bl-xl rounded-br-xl' 
                            : 'bg-white border border-[#DEE2E6] text-gray-800 rounded-tr-xl rounded-br-xl rounded-bl-xl markdown-body prose-sm font-sans'
                        }`}>
                          {msg.role === 'model' ? <Markdown>{msg.content}</Markdown> : msg.content}
                        </div>
                     </div>
                  ))
                )}
                {qaLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-[#DEE2E6] text-gray-600 rounded-tr-xl rounded-br-xl rounded-bl-xl p-3 shadow-sm text-sm flex items-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2 text-blue-600" />
                      Thinking...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              
              <div className="p-3 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] flex gap-2">
                <input 
                  id="ai-chat-input"
                  type="text" 
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask about this note..."
                  className="flex-1 p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                  autoFocus
                />
                <button 
                  onClick={handleAskQuestion}
                  disabled={qaLoading || !question.trim()}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  aria-label="Send question"
                >
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          ) : null}

          {/* FAB */}
          {!isChatOpen && (
            <button 
              onClick={() => setIsChatOpen(true)}
              className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
              aria-label="Ask AI"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="space-y-6 bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create New Note</h2>
          <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-gray-700">Cancel</button>
        </div>
        
        {!user && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p>You are not signed in. This note will be saved locally to this device.</p>
            <button onClick={signInWithGoogle} className="bg-white px-3 py-1.5 rounded-md border border-yellow-300 font-medium hover:bg-yellow-100 whitespace-nowrap">
              Sign in to Sync
            </button>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center text-blue-800">
            <FileText className="w-5 h-5 mr-3 text-blue-600" />
            <div>
              <p className="font-semibold text-sm">Upload PDF Document</p>
              <p className="text-xs text-blue-600/80">Automatically extract text to create your note</p>
            </div>
          </div>
          <input 
            type="file" 
            accept=".pdf" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handlePdfUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isExtractingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 text-sm font-semibold border border-blue-200 shadow-sm rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
          >
            {isExtractingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isExtractingPdf ? 'Extracting...' : 'Upload PDF'}
          </button>
        </div>
        
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Or enter manually</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Note Title"
          className="w-full p-2 border border-gray-300 rounded"
        />
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Paste or type clinical notes here..."
          rows={10}
          className="w-full p-2 border border-gray-300 rounded whitespace-pre-wrap"
        ></textarea>
        <button 
          onClick={handleCreate}
          disabled={!newTitle || !newContent}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Save Note
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Your Notes</h2>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-1" /> New Note
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200 text-gray-500">
          No notes yet. Create one to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map(note => (
            <div key={note.id} className="bg-white rounded-lg shadow border border-gray-200 p-5 hover:border-blue-300 transition-colors cursor-pointer" onClick={() => setSelectedNote(note)}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-gray-900 truncate pr-4">{note.title}</h3>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (note.id.startsWith('local-')) {
                      // Delete from local storage
                      const storedLocal = localStorage.getItem('localNotes');
                      if (storedLocal) {
                        const existingLocalNotes: Note[] = JSON.parse(storedLocal);
                        const updatedLocalNotes = existingLocalNotes.filter(n => n.id !== note.id);
                        localStorage.setItem('localNotes', JSON.stringify(updatedLocalNotes));
                      }
                      setNotes(notes.filter(n => n.id !== note.id));
                    } else {
                      deleteNote(note.id); 
                    }
                  }}
                  className="text-gray-400 hover:text-red-500"
                  aria-label="Delete note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-gray-600 text-sm line-clamp-3">
                {note.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
