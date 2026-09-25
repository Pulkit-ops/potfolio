"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toastMessage && (
        <div
          className="fixed bottom-8 right-8 z-[200] max-w-sm px-5 py-3.5 rounded-full bg-[#12151d]/90 backdrop-blur-xl border border-white/15 text-[#f5f6f8] text-sm font-medium shadow-2xl shadow-black/80 flex items-center gap-3 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300"
          role="status"
          aria-live="polite"
        >
          <span className="w-2 h-2 rounded-full bg-[#e51d24] animate-pulse"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
