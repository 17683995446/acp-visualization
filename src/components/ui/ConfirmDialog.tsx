import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, onClose, onConfirm, title, message,
  confirmText = '确认', cancelText = '取消', variant = 'warning',
}) => {
  const variantStyles = {
    danger: 'bg-red-500 hover:bg-red-600',
    warning: 'bg-orange-500 hover:bg-orange-600',
    info: 'bg-blue-500 hover:bg-blue-600',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex items-start space-x-3 mb-6">
        <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${variant === 'danger' ? 'text-red-500' : 'text-orange-500'}`} />
        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
      </div>
      <div className="flex justify-end space-x-3">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          {cancelText}
        </button>
        <button onClick={() => { onConfirm(); onClose(); }} className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${variantStyles[variant]}`}>
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};
