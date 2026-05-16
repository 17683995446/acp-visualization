import React, { useState } from 'react';
import { useACPStore } from '../../store/acpStore';
import { Modal } from '../../components/Modal';
import type { Role, Department } from '../../types';

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  departments: Department[];
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  open,
  onClose,
  departments,
}) => {
  const addMember = useACPStore((s) => s.addMember);
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('mid');
  const [capabilitiesText, setCapabilitiesText] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const capabilities = capabilitiesText
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean);

    addMember({
      name: trimmedName,
      role,
      capabilities,
      departmentId: departmentId || undefined,
    });

    // 重置表单
    setName('');
    setRole('mid');
    setCapabilitiesText('');
    setDepartmentId('');
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="添加成员">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 姓名 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            姓名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入成员姓名"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            autoFocus
          />
        </div>

        {/* 角色 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            角色 <span className="text-red-500">*</span>
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {(
              Object.keys({
                ceo: '首席执行官',
                cto: '首席技术官',
                coo: '首席运营官',
                cqo: '首席质量官',
                manager: '经理',
                senior: '高级',
                mid: '中级',
                junior: '初级',
                intern: '实习生',
                maintainer: '维护者',
                collaborator: '协作者',
                contributor: '贡献者',
              }) as Role[]
            ).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* 能力 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            能力 <span className="text-gray-400 font-normal">(逗号分隔)</span>
          </label>
          <input
            type="text"
            value={capabilitiesText}
            onChange={(e) => setCapabilitiesText(e.target.value)}
            placeholder="例如: 前端开发, UI设计, 组件开发"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* 部门 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            部门 <span className="text-gray-400 font-normal">(可选)</span>
          </label>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">-- 不分配部门 --</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
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
            disabled={!name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            确认添加
          </button>
        </div>
      </form>
    </Modal>
  );
};

export { AddMemberModal };
export type { AddMemberModalProps };
