import React, { createContext, useState, useCallback, useRef, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  createdAt: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const MAX_TOASTS = 5;
const DEFAULT_DURATION = 5000;

const typeStyles: Record<ToastType, { bg: string; border: string; icon: string; progress: string }> = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-500',
    progress: 'bg-green-500',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-500',
    progress: 'bg-red-500',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-500',
    progress: 'bg-yellow-500',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-500',
    progress: 'bg-blue-500',
  },
};

const typeIcons: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const styles = typeStyles[toast.type];
  const startTimeRef = useRef(Date.now());
  const rafRef = useRef<number | undefined>(undefined);

  const handleRemove = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [toast.id, onRemove]);

  useEffect(() => {
    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, toast.duration - elapsed);
      const newProgress = (remaining / toast.duration) * 100;
      
      setProgress(newProgress);
      
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(updateProgress);
      } else {
        handleRemove();
      }
    };

    rafRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [toast.duration, handleRemove]);

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg shadow-lg border
        ${styles.bg} ${styles.border}
        transform transition-all duration-300 ease-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        min-w-[300px] max-w-[400px]
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start p-4">
        <div className={`flex-shrink-0 ${styles.icon}`}>
          {typeIcons[toast.type]}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900">{toast.message}</p>
        </div>
        <button
          onClick={handleRemove}
          className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="关闭通知"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
        <div
          className={`h-full ${styles.progress} transition-all duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType, duration: number = DEFAULT_DURATION) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setToasts((prev) => {
      // 限制最大数量，移除最早的 toast
      const newToasts = prev.length >= MAX_TOASTS ? prev.slice(1) : prev;
      
      return [
        ...newToasts,
        {
          id,
          message,
          type,
          duration,
          createdAt: Date.now(),
        },
      ];
    });
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const contextValue: ToastContextValue = {
    toasts,
    showToast,
    hideToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Toast container - positioned top-right */}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={hideToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
