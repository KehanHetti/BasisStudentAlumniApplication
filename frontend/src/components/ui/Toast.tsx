'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastComponent({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);

    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onClose(toast.id), 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const typeStyles = {
    success: {
      bg: 'bg-gradient-to-r from-green-500 to-green-600',
      border: 'border-green-600',
      iconBg: 'bg-green-700',
      text: 'text-white',
    },
    error: {
      bg: 'bg-gradient-to-r from-red-500 to-red-600',
      border: 'border-red-600',
      iconBg: 'bg-red-700',
      text: 'text-white',
    },
    info: {
      bg: 'bg-gradient-to-r from-logo-primary-blue to-logo-secondary-blue',
      border: 'border-logo-secondary-blue',
      iconBg: 'bg-logo-secondary-blue',
      text: 'text-white',
    },
    warning: {
      bg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      border: 'border-orange-600',
      iconBg: 'bg-orange-700',
      text: 'text-white',
    },
  };

  const Icon = icons[toast.type];
  const styles = typeStyles[toast.type];

  return (
    <div
      className={`
        flex items-center gap-3 px-5 py-4 rounded-xl border-2 shadow-2xl
        min-w-[320px] max-w-md backdrop-blur-sm
        transform transition-all duration-300 ease-out
        ${styles.bg} ${styles.border} ${styles.text}
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className={`p-2 rounded-lg ${styles.iconBg} flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="flex-1 text-sm font-semibold leading-relaxed">{toast.message}</p>
      <button
        onClick={() => {
          setIsLeaving(true);
          setTimeout(() => onClose(toast.id), 300);
        }}
        className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors touch-target"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export { ToastComponent };

