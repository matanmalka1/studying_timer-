import { useState, useEffect } from 'react';
import type { Session } from '../types';
import { STORAGE_KEYS } from '../constants';

interface UseSessionHistoryReturn {
  sessions: Session[];
  addSession: (session: Session) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useSessionHistory(): UseSessionHistoryReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [history, setHistory] = useState<Session[][]>([]);
  const [redoStack, setRedoStack] = useState<Session[][]>([]);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (s) setSessions(JSON.parse(s));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    }, 1000);
    return () => clearTimeout(id);
  }, [sessions]);

  const addSession = (session: Session) => {
    setHistory(prev => [sessions, ...prev].slice(0, 20));
    setRedoStack([]);
    setSessions(prev => [session, ...prev]);
  };

  const undo = () => {
    if (!history.length) return;
    setRedoStack(prev => [sessions, ...prev]);
    setSessions(history[0]);
    setHistory(prev => prev.slice(1));
  };

  const redo = () => {
    if (!redoStack.length) return;
    setHistory(prev => [sessions, ...prev]);
    setSessions(redoStack[0]);
    setRedoStack(prev => prev.slice(1));
  };

  return {
    sessions,
    addSession,
    undo,
    redo,
    canUndo: history.length > 0,
    canRedo: redoStack.length > 0,
  };
}
