'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import SuccessToast from '@/components/common/SuccessToast';
import { AlertTriangle, XCircle } from 'lucide-react';

interface Toast {
  message: string;
  type?: 'success' | 'error' | 'warning';
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const WarningToast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
  <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right duration-300">
    <div className="bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-500 dark:border-amber-400 rounded-lg shadow-lg p-4 flex items-center gap-3 max-w-md">
      <AlertTriangle className="text-amber-600 dark:text-amber-400 flex-shrink-0" size={24} />
      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{message}</p>
      <button onClick={onClose} className="ml-auto text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200">
        <XCircle size={20} />
      </button>
    </div>
  </div>
);

const ErrorToast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
  <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right duration-300">
    <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 rounded-lg shadow-lg p-4 flex items-center gap-3 max-w-md">
      <XCircle className="text-red-600 dark:text-red-400 flex-shrink-0" size={24} />
      <p className="text-sm font-medium text-red-800 dark:text-red-200">{message}</p>
      <button onClick={onClose} className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200">
        <XCircle size={20} />
      </button>
    </div>
  </div>
);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<Toast | null>(null);
  const [visible, setVisible] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setVisible(true);
    setTimeout(() => setVisible(false), 4000);
  };

  const handleClose = () => setVisible(false);

  return (
    <ToastContext.Provider value={{
      showToast,
      success: (msg) => showToast(msg, 'success'),
      error: (msg) => showToast(msg, 'error'),
      warning: (msg) => showToast(msg, 'warning')
    }}>
      {children}
      {visible && toast && toast.type === 'success' && (
        <SuccessToast message={toast.message} onClose={handleClose} />
      )}
      {visible && toast && toast.type === 'warning' && (
        <WarningToast message={toast.message} onClose={handleClose} />
      )}
      {visible && toast && toast.type === 'error' && (
        <ErrorToast message={toast.message} onClose={handleClose} />
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return context;
};
