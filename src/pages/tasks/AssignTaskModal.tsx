import React, { useState, useEffect } from 'react';
import { Users, CheckCircle } from 'lucide-react';
import { Modal } from '../../components/Modal';

interface AssignTaskModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  idleAgents: { id: string; name: string; role: string; reputation: number }[];
  onAssign: (taskId: string, memberId: string) => void;
}

const AssignTaskModal: React.FC<AssignTaskModalProps> = ({ open, onClose, taskId, idleAgents, onAssign }) => {
  const [selectedAgent, setSelectedAgent] = useState<string>('');

  // 弹窗打开时重置 selectedAgent
  useEffect(() => {
    if (open) {
      setSelectedAgent('');
    }
  }, [open]);

  const handleSubmit = () => {
    if (!selectedAgent) return;
    onAssign(taskId, selectedAgent);
    setSelectedAgent('');
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="分配任务">
      <div className="space-y-5">
        {idleAgents.length === 0 ? (
          <div className="text-center py-6">
            <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">当前没有空闲的 Agent</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {idleAgents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg border transition-all text-left ${
                    selectedAgent === agent.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-2 ring-primary-200 dark:ring-primary-800'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-xs font-bold">
                  {agent.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {agent.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {agent.role} · 声誉 {agent.reputation}
                  </p>
                </div>
                {selectedAgent === agent.id && (
                  <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedAgent || idleAgents.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认分配
          </button>
        </div>
      </div>
    </Modal>
  );
};

export { AssignTaskModal };
