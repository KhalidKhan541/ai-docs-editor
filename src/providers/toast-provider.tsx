"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ToastVariant = "default" | "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">): string => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const newToast: Toast = { ...toast, id };

      setToasts((prev) => [...prev, newToast]);

      const duration = toast.duration ?? 5000;
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }

      return id;
    },
    [removeToast]
  );

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const success = useCallback(
    (title: string, description?: string): string => {
      return addToast({ title, description, variant: "success" });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string): string => {
      return addToast({ title, description, variant: "error", duration: 8000 });
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, description?: string): string => {
      return addToast({ title, description, variant: "warning", duration: 6000 });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string): string => {
      return addToast({ title, description, variant: "info" });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        clearToasts,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}

      {/* Toast container - positioned fixed bottom-right */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2 sm:max-w-sm"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`
              pointer-events-auto animate-in slide-in-from-right-5
              rounded-lg border p-4 shadow-lg backdrop-blur
              transition-all duration-300
              ${
                toast.variant === "success"
                  ? "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100"
                  : toast.variant === "error"
                    ? "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
                    : toast.variant === "warning"
                      ? "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100"
                      : toast.variant === "info"
                        ? "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100"
                        : "border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              }
            `}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description && (
                  <p className="mt-1 text-sm opacity-80">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 rounded p-1 opacity-50 hover:opacity-100"
                aria-label="Dismiss"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 1L13 13M1 13L13 1"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action!.onClick();
                  removeToast(toast.id);
                }}
                className="mt-2 text-sm font-medium underline hover:no-underline"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
