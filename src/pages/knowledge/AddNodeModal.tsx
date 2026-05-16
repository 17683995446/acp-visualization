import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { KnowledgeNode } from '../../types';
import { TYPE_CONFIG, ALL_TYPES } from './constants';

interface AddNodeModalProps {
  open: boolean;
  onClose: () => void;
  knowledgeNodes: KnowledgeNode[];
  onSubmit: (data: { type: KnowledgeNode['type']; name: string; description: string; connections: string[] }) => void;
}

const AddNodeModal: React.FC<AddNodeModalProps> = ({ open, onClose, knowledgeNodes, onSubmit }) => {
  const [formType, setFormType] = useState<KnowledgeNode['type']>('concept');
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formConnections, setFormConnections] = useState('');

  // N-2: 弹窗打开时重置表单
  useEffect(() => {
    if (open) {
      setFormType('concept');
      setFormName('');
      setFormDesc('');
      setFormConnections('');
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!formName.trim()) return;
    const connections = formConnections
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    // N-1: 过滤掉不存在的连接 ID
    const validConnections = connections.filter(id => knowledgeNodes.some(n => n.id === id));
    onSubmit({
      type: formType,
      name: formName.trim(),
      description: formDesc.trim(),
      connections: validConnections,
    });
    // 重置表单
    setFormType('concept');
    setFormName('');
    setFormDesc('');
    setFormConnections('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* 弹窗头部 */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">添加知识节点</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">向知识图谱中添加新的节点</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 表单 */}
        <div className="px-6 py-5 space-y-5">
          {/* 节点类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">节点类型</label>
            <div className="grid grid-cols-5 gap-2">
              {ALL_TYPES.map((type) => {
                const cfg = TYPE_CONFIG[type];
                const isSelected = formType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormType(type)}
                    className={`flex flex-col items-center space-y-1 py-2.5 px-1 rounded-lg border-2 transition-all text-xs font-medium ${
                      isSelected
                        ? 'border-current shadow-sm'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-500 dark:text-gray-400'
                    }`}
                    style={{
                      borderColor: isSelected ? cfg.color : undefined,
                      color: isSelected ? cfg.color : undefined,
                      backgroundColor: isSelected ? cfg.color + '10' : undefined,
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: cfg.color }}
                    />
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 节点名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">节点名称</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="输入节点名称..."
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 dark:focus:ring-primary-400 focus:border-primary-300 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">描述</label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="输入节点描述..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 dark:focus:ring-primary-400 focus:border-primary-300 text-sm resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* 关联节点 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              关联节点
              <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-2">
                输入已有节点 ID，用逗号分隔
              </span>
            </label>
            <input
              type="text"
              value={formConnections}
              onChange={(e) => setFormConnections(e.target.value)}
              placeholder="例如: kn-001, kn-002"
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 dark:focus:ring-primary-400 focus:border-primary-300 text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            {/* 已有节点快速选择 */}
            {knowledgeNodes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {knowledgeNodes.map((n) => {
                  const isSelected = formConnections
                    .split(',')
                    .map((s) => s.trim())
                    .includes(n.id);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        const currentIds = formConnections
                          .split(',')
                          .map((s) => s.trim())
                          .filter((s) => s.length > 0);
                        if (isSelected) {
                          setFormConnections(
                            currentIds.filter((id) => id !== n.id).join(', ')
                          );
                        } else {
                          setFormConnections([...currentIds, n.id].join(', '));
                        }
                      }}
                      className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs transition-colors ${
                        isSelected
                          ? `${TYPE_CONFIG[n.type].bg} ${TYPE_CONFIG[n.type].text} ring-1 ring-current ring-opacity-20`
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: TYPE_CONFIG[n.type].color }}
                      />
                      <span>{n.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 弹窗底部 */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formName.trim()}
            className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              formName.trim()
                ? 'bg-primary-500 hover:bg-primary-600 shadow-sm'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            添加节点
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddNodeModal;
