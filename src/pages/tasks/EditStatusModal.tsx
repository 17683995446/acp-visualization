import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { statusConfig, statusEditOptions } from './constants';
import type { TaskStatus } from '../../types';

interface EditStatusModalProps {
  open: boolean;
  onClose: () => void;
  currentStatus: TaskStatus;
  onSubmit: (status: TaskStatus) => void;
}

const EditStatusModal: React.FC<EditStatusModalProps> = ({ open, onClose, currentStatus, onSubmit }) => {
  const [selected, setSelected] = useState<TaskStatus>(currentStatus);

  const handleSubmit = () => {
    onSubmit(selected);
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="修改任务状态">
      <div className="space-y-5">
        <div className="space-y-2">
          {statusEditOptions.map((opt) => {
            const cfg = statusConfig[opt.value];
            const Icon = cfg.icon;
            return (
              <button
                key={opt.value}
                onClick={() => setSelected(opt.value)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg border transition-all text-left ${
                  selected === opt.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-2 ring-primary-200 dark:ring-primary-800'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{opt.label}</span>
                {selected === opt.value && (
                  <CheckCircle className="w-4 h-4 text-primary-500 ml-auto" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
          >
            确认修改
          </button>
        </div>
      </div>
    </Modal>
  );
};

export { EditStatusModal };
