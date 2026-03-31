import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, AlertCircle, Info, Bell } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'message';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex flex-col gap-3 z-[100] w-full max-w-sm px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="bg-white/90 backdrop-blur-md border border-outline-variant/10 shadow-2xl rounded-2xl p-4 flex gap-4 items-start relative overflow-hidden group"
            >
              {/* Type Indicator */}
              <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                toast.type === 'success' ? 'bg-green-100 text-green-600' :
                toast.type === 'error' ? 'bg-red-100 text-red-600' :
                toast.type === 'info' ? 'bg-blue-100 text-blue-600' : 'bg-primary/10 text-primary'
              }`}>
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
                {toast.type === 'info' && <Info className="w-5 h-5" />}
                {toast.type === 'message' && <Bell className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <h4 className="font-bold text-on-surface text-sm truncate">{toast.title}</h4>
                <p className="text-xs text-secondary mt-0.5 line-clamp-2 leading-relaxed">{toast.message}</p>
              </div>

              <button 
                onClick={() => removeToast(toast.id)}
                className="absolute top-4 right-4 text-secondary hover:text-on-surface transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Progress Bar */}
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-1 ${
                  toast.type === 'success' ? 'bg-green-500' :
                  toast.type === 'error' ? 'bg-red-500' :
                  toast.type === 'info' ? 'bg-blue-500' : 'bg-primary'
                }`}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
