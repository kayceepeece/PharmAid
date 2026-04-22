'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Note, subscribeToNotes, createNote, deleteNote } from '@/services/firestoreService';
import { runGroundedQA } from '@/services/geminiService';
import { LoadingSpinner, ErrorMessage } from './common/Common';
import { Plus, Trash2, MessageCircle, ArrowLeft } from 'lucide-react';
import Markdown from 'react-markdown';

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
  const [answer, setAnswer] = useState('');
  const [qaLoading, setQaLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const unsubscribe = subscribeToNotes(user.uid, (fetchedNotes) => {
      setNotes(fetchedNotes);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleCreate = async () => {
    if (!newTitle || !newContent) return;
    
    let targetUid = user?.uid;
    if (!targetUid) {
      try {
        await signInWithGoogle();
        const { auth } = await import('@/lib/firebase');
        targetUid = auth.currentUser?.uid;
      } catch (err) {
        console.error("Sign in aborted or failed:", err);
      }
    }

    if (targetUid) {
      await createNote(targetUid, newTitle, newContent);
    } else {
      // Create local ephemeral note for testing without saving
      const newLocalNote: Note = {
        id: `local-${Date.now()}`,
        userId: 'guest',
        title: newTitle,
        content: newContent,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setNotes([newLocalNote, ...notes]);
    }
    
    setNewTitle('');
    setNewContent('');
    setIsCreating(false);
  };

  const handleAskQuestion = async () => {
    if (!selectedNote || !question) return;
    setQaLoading(true);
    setAnswer('');
    try {
      const response = await runGroundedQA(selectedNote.content, question);
      setAnswer(response);
    } catch (err) {
      setAnswer("Failed to get an answer.");
    }
    setQaLoading(false);
  };

  if (loading) return <LoadingSpinner />;

  if (selectedNote) {
    return (
      <div className="space-y-6">
        <button onClick={() => { setSelectedNote(null); setAnswer(''); setQuestion(''); }} className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Notes
        </button>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedNote.title}</h2>
          <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
            {selectedNote.content}
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-900 flex items-center mb-4">
            <MessageCircle className="w-5 h-5 mr-2" /> Ask AI about this note
          </h3>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What are the key interactions mentioned?"
              className="flex-1 p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
            />
            <button 
              onClick={handleAskQuestion}
              disabled={qaLoading || !question}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {qaLoading ? 'Thinking...' : 'Ask'}
            </button>
          </div>
          {answer && (
            <div className="mt-4 p-4 bg-white rounded border border-blue-200 text-gray-800 markdown-body">
              <Markdown>{answer}</Markdown>
            </div>
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
