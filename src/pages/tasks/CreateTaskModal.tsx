import React, { useState } from 'react';
import { Modal } from '../../components/Modal';
import type { NewTaskForm } from './constants';
import type { TaskPriority } from '../../types';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: NewTaskForm) => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = useState<NewTaskForm>({
    title: '',
    description: '',
    priority: 'P2',
    estimatedTime: 8,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof NewTaskForm, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof NewTaskForm, string>> = {};
    if (!form.title.trim()) {
      newErrors.title = '任务标题不能为空';
    }
    if (!form.description.trim()) {
      newErrors.description = '任务描述不能为空';
    }
    if (form.estimatedTime <= 0) {
      newErrors.estimatedTime = '预估时间必须大于 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(form);
    setForm({ title: '', description: '', priority: 'P2', estimatedTime: 8 });
    setErrors({});
    onClose();
  };

  const handleCancel = () => {
    setForm({ title: '', description: '', priority: 'P2', estimatedTime: 8 });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={handleCancel} title="新建任务">
      <div className="space-y-5">
        {/* 表单字段 */}
        <div className="space-y-4">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              任务标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="请输入任务标题"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.title ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'
              }`}
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              任务描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="请输入任务描述"
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.description ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'
              }`}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">{errors.description}</p>
            )}
          </div>

          {/* 优先级 + 预估时间 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                优先级
              </label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value as TaskPriority })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="P0">P0 - 紧急</option>
                <option value="P1">P1 - 高</option>
                <option value="P2">P2 - 中</option>
                <option value="P3">P3 - 低</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                预估时间 (小时)
              </label>
              <input
                type="number"
                min={1}
                value={form.estimatedTime}
                onChange={(e) =>
                  setForm({ ...form, estimatedTime: Number(e.target.value) })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm ${
                  errors.estimatedTime ? 'border-red-400' : 'border-gray-200'
                }`}
              />
              {errors.estimatedTime && (
                <p className="text-xs text-red-500 mt-1">{errors.estimatedTime}</p>
              )}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
          >
            创建任务
          </button>
        </div>
      </div>
    </Modal>
  );
};

export { CreateTaskModal };
