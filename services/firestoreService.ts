import { collection, doc, query, where, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt?: any;
  updatedAt?: any;
}

export async function createNote(userId: string, title: string, content: string): Promise<string> {
  const notesRef = collection(db, 'notes');
  const newNoteRef = doc(notesRef); // auto-generate id
  
  await setDoc(newNoteRef, {
    userId,
    title,
    content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return newNoteRef.id;
}

export async function updateNote(noteId: string, updates: { title?: string; content?: string }): Promise<void> {
  const noteRef = doc(db, 'notes', noteId);
  await updateDoc(noteRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNote(noteId: string): Promise<void> {
  const noteRef = doc(db, 'notes', noteId);
  await deleteDoc(noteRef);
}

export function subscribeToNotes(userId: string, callback: (notes: Note[]) => void) {
  const q = query(
    collection(db, 'notes'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notes = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Note[];
    callback(notes);
  }, (error) => {
    console.error("Error subscribing to notes:", error);
  });
}
