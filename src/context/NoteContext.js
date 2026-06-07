import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NoteContext = createContext();

const STORAGE_KEYS = {
  CATEGORIES: '@notebook_categories',
  NOTES: '@notebook_notes',
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function NoteProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [catData, noteData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES),
        AsyncStorage.getItem(STORAGE_KEYS.NOTES),
      ]);
      if (catData) setCategories(JSON.parse(catData));
      if (noteData) setNotes(JSON.parse(noteData));
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  }

  async function persistCategories(newCategories) {
    setCategories(newCategories);
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(newCategories));
  }

  async function persistNotes(newNotes) {
    setNotes(newNotes);
    await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(newNotes));
  }

  // ── Category operations ──────────────────────────────────────────────────

  async function addCategory(name) {
    const newCat = { id: generateId(), name: name.trim(), createdAt: new Date().toISOString() };
    await persistCategories([...categories, newCat]);
    return newCat;
  }

  async function updateCategory(categoryId, name) {
    await persistCategories(categories.map(c => c.id === categoryId ? { ...c, name: name.trim() } : c));
  }

  async function deleteCategory(categoryId) {
    await persistCategories(categories.filter(c => c.id !== categoryId));
    await persistNotes(notes.filter(n => n.categoryId !== categoryId));
  }

  // ── Note operations ──────────────────────────────────────────────────────

  async function addNote(categoryId, { title, content, color, pinned }) {
    const now = new Date().toISOString();
    const newNote = {
      id: generateId(),
      categoryId,
      title: title.trim(),
      content,
      color,
      pinned: pinned || false,
      createdAt: now,
      updatedAt: now,
    };
    await persistNotes([newNote, ...notes]);
    return newNote;
  }

  async function updateNote(noteId, { title, content, color, pinned }) {
    await persistNotes(
      notes.map(n =>
        n.id === noteId
          ? {
              ...n,
              title: title.trim(),
              content,
              color,
              pinned: pinned !== undefined ? pinned : n.pinned,
              updatedAt: new Date().toISOString(),
            }
          : n
      )
    );
  }

  async function togglePin(noteId) {
    await persistNotes(
      notes.map(n => n.id === noteId ? { ...n, pinned: !n.pinned } : n)
    );
  }

  async function deleteNote(noteId) {
    await persistNotes(notes.filter(n => n.id !== noteId));
  }

  function getNotesByCategory(categoryId) {
    return notes.filter(n => n.categoryId === categoryId);
  }

  // Global search across all notes
  function searchNotes(query) {
    if (!query || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    return notes.filter(n =>
      n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }

  function getCategoryById(categoryId) {
    return categories.find(c => c.id === categoryId);
  }

  return (
    <NoteContext.Provider
      value={{
        categories,
        notes,
        loading,
        addCategory,
        updateCategory,
        deleteCategory,
        addNote,
        updateNote,
        togglePin,
        deleteNote,
        getNotesByCategory,
        searchNotes,
        getCategoryById,
      }}
    >
      {children}
    </NoteContext.Provider>
  );
}

export function useNotes() {
  const ctx = useContext(NoteContext);
  if (!ctx) throw new Error('useNotes must be used inside NoteProvider');
  return ctx;
}
