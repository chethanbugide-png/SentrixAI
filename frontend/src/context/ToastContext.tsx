import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = {
    success: (title: string, message?: string) => addToast('success', title, message),
    error: (title: string, message?: string) => addToast('error', title, message),
    info: (title: string, message?: string) => addToast('info', title, message),
    warning: (title: string, message?: string) => addToast('warning', title, message),
    dismiss,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Monochromatic Pro Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none font-mono">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border border-charcoal-700 bg-stark-950 text-white shadow-2xl transition-all duration-200"
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' && <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_#fff]" />}
              {toast.type === 'error' && <div className="w-2 h-2 rounded-full bg-white animate-ping" />}
              {toast.type === 'warning' && <div className="w-2 h-2 rounded-full bg-charcoal-400" />}
              {toast.type === 'info' && <div className="w-2 h-2 rounded-full bg-charcoal-300" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white uppercase tracking-wider">{toast.title}</p>
              {toast.message && (
                <p className="text-[11px] text-charcoal-300 mt-0.5 leading-relaxed font-sans">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-charcoal-500 hover:text-white transition-colors p-0.5 -mr-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
