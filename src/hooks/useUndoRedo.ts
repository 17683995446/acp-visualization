/**
 * useUndoRedo Hook
 *
 * 提供 undo/redo 功能和键盘快捷键（Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y）。
 */

import { useEffect, useCallback, useRef } from 'react';
import { useACPStore } from '../store/acpStore';

export interface UndoRedoReturn {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoDescription: string | null;
  redoDescription: string | null;
  clearHistory: () => void;
  undoCount: number;
  redoCount: number;
}

export function useUndoRedo(): UndoRedoReturn {
  const undo = useACPStore((s) => s.undo);
  const redo = useACPStore((s) => s.redo);
  const canUndo = useACPStore((s) => s.canUndo);
  const canRedo = useACPStore((s) => s.canRedo);
  const getUndoDescription = useACPStore((s) => s.getUndoDescription);
  const getRedoDescription = useACPStore((s) => s.getRedoDescription);
  const clearHistory = useACPStore((s) => s.clearHistory);
  const undoStack = useACPStore((s) => s._undoStack);
  const redoStack = useACPStore((s) => s._redoStack);

  // 使用 ref 存储最新函数引用，避免频繁注册/注销事件监听器
  const undoRef = useRef(undo);
  const redoRef = useRef(redo);
  const canUndoRef = useRef(canUndo);
  const canRedoRef = useRef(canRedo);

  undoRef.current = undo;
  redoRef.current = redo;
  canUndoRef.current = canUndo;
  canRedoRef.current = canRedo;

  // 只注册一次键盘事件监听器
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      if (isCtrlOrMeta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndoRef.current()) undoRef.current();
      }

      if (isCtrlOrMeta && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedoRef.current()) redoRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // 空依赖 — 只注册一次

  const undoDescription = getUndoDescription();
  const redoDescription = getRedoDescription();

  return {
    undo: useCallback(() => undo(), [undo]),
    redo: useCallback(() => redo(), [redo]),
    canUndo: canUndo(),
    canRedo: canRedo(),
    undoDescription,
    redoDescription,
    clearHistory: useCallback(() => clearHistory(), [clearHistory]),
    undoCount: undoStack.length,
    redoCount: redoStack.length,
  };
}
