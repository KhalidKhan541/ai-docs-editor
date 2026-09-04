"use client";

import * as React from "react";
import { ToastProvider, ToastViewport } from "@/components/ui/toast";

type ToastVariant = "default" | "destructive" | "success" | "warning" | "info";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: React.ReactNode;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

let toastId = 0;

function ToastProviderInner({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${++toastId}`;
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration || 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = React.useCallback(
    (message: string, title?: string) => {
      addToast({ title, description: message, variant: "success" });
    },
    [addToast]
  );

  const error = React.useCallback(
    (message: string, title?: string) => {
      addToast({ title, description: message, variant: "destructive", duration: 8000 });
    },
    [addToast]
  );

  const warning = React.useCallback(
    (message: string, title?: string) => {
      addToast({ title, description: message, variant: "warning" });
    },
    [addToast]
  );

  const info = React.useCallback(
    (message: string, title?: string) => {
      addToast({ title, description: message, variant: "info" });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      <ToastProvider>
        {children}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
}

function ToastContextProvider({ children }: { children: React.ReactNode }) {
  return <ToastProviderInner>{children}</ToastProviderInner>;
}

function useToast() {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export { ToastContextProvider, useToast };
export type { Toast, ToastVariant };
