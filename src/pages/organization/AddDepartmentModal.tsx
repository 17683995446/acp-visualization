import React, { useState } from 'react';
import { useACPStore } from '../../store/acpStore';
import { Modal } from '../../components/Modal';
import type { Member } from '../../types';

interface AddDepartmentModalProps {
  open: boolean;
  onClose: () => void;
  members: Member[];
}

const AddDepartmentModal: React.FC<AddDepartmentModalProps> = ({
  open,
  onClose,
  members,
}) => {
  const addDepartment = useACPStore((s) => s.addDepartment);
  const [name, setName] = useState('');
  const [headId, setHeadId] = useState('');
  const [budget, setBudget] = useState('10000');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || !headId) return;

    addDepartment({
      name: trimmedName,
      headId,
      budget: Number(budget) || 10000,
    });

    setName('');
    setHeadId('');
    setBudget('10000');
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="添加部门">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 部门名称 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            部门名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入部门名称"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            autoFocus
          />
        </div>

        {/* 部门负责人 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            部门负责人 <span className="text-red-500">*</span>
          </label>
          <select
            value={headId}
            onChange={(e) => setHeadId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">-- 选择负责人 --</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.role})
              </option>
            ))}
          </select>
        </div>

        {/* 预算 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            预算 <span className="text-gray-400 font-normal">(可选, 默认 10000)</span>
          </label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            min={0}
            placeholder="10000"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={!name.trim() || !headId}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            确认添加
          </button>
        </div>
      </form>
    </Modal>
  );
};

export { AddDepartmentModal };
export type { AddDepartmentModalProps };
