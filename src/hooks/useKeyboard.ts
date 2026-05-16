import { useEffect } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: KeyHandler;
  description: string;
}

export function useKeyboard(shortcuts: KeyboardShortcut[]): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrlKey ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shiftKey ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.altKey ? e.altKey : !e.altKey;

        if (e.key === shortcut.key && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.handler(e);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
