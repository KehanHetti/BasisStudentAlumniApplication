'use client';

import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'warning',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-logo-secondary-blue hover:bg-logo-primary-blue',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-ui-border">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 ${variant === 'danger' ? 'text-red-600' : 'text-yellow-600'}`} />
            <h3 className="text-lg font-semibold text-ui-text-dark">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-ui-text-light hover:text-ui-text-dark transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-ui-text-dark">{message}</p>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-ui-border">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-ui-text-light hover:text-ui-text-dark transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white font-semibold rounded-lg transition-colors ${variantStyles[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

