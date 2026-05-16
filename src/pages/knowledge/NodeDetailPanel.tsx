import React from 'react';
import { Trash2, GitBranch } from 'lucide-react';
import type { KnowledgeNode } from '../../types';
import { TYPE_CONFIG } from './constants';

interface NodeDetailPanelProps {
  selectedNode: KnowledgeNode;
  knowledgeNodes: KnowledgeNode[];
  onDelete: (id: string) => void;
  onClose: () => void;
  onNavigate: (node: KnowledgeNode) => void;
}

const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  selectedNode,
  knowledgeNodes,
  onDelete,
  onClose,
  onNavigate,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* 侧栏头部 */}
      <div
        className="px-5 py-4"
        style={{
          background: `linear-gradient(135deg, ${TYPE_CONFIG[selectedNode.type].color}15, ${TYPE_CONFIG[selectedNode.type].color}08)`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: TYPE_CONFIG[selectedNode.type].color }}
            />
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_CONFIG[selectedNode.type].bg} ${TYPE_CONFIG[selectedNode.type].text}`}
            >
              {TYPE_CONFIG[selectedNode.type].label}
            </span>
          </div>
          <button
            onClick={() => onDelete(selectedNode.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="删除节点"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mt-2">{selectedNode.name}</h3>
        <p className="text-xs text-gray-400 mt-0.5 font-mono">{selectedNode.id}</p>
      </div>

      {/* 描述 */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          描述
        </h4>
        <p className="text-sm text-gray-700 leading-relaxed">
          {selectedNode.description || '暂无描述'}
        </p>
      </div>

      {/* 连接 */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          关联节点 ({selectedNode.connections.length})
        </h4>
        {selectedNode.connections.length === 0 ? (
          <p className="text-sm text-gray-400">暂无关联</p>
        ) : (
          <div className="space-y-1.5">
            {selectedNode.connections.map((connId) => {
              const connNode = knowledgeNodes.find((n) => n.id === connId);
              if (!connNode) {
                return (
                  <div
                    key={connId}
                    className="flex items-center space-x-2 px-2 py-1.5 rounded-lg bg-gray-50 text-xs text-gray-400"
                  >
                    <span className="font-mono">{connId}</span>
                    <span>(已删除)</span>
                  </div>
                );
              }
              const cfg = TYPE_CONFIG[connNode.type];
              return (
                <button
                  key={connId}
                  onClick={() => onNavigate(connNode)}
                  className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors w-full text-left"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span className="text-sm text-gray-700 font-medium truncate">
                    {connNode.name}
                  </span>
                  <span className={`text-xs ml-auto shrink-0 ${cfg.text}`}>
                    {cfg.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div className="px-5 py-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          统计
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-gray-900">
              {selectedNode.connections.length}
            </p>
            <p className="text-xs text-gray-500">出站连接</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-gray-900">
              {
                knowledgeNodes.filter((n) =>
                  n.connections.includes(selectedNode.id)
                ).length
              }
            </p>
            <p className="text-xs text-gray-500">入站连接</p>
          </div>
        </div>
      </div>

      {/* 关闭按钮 */}
      <div className="px-5 pb-4">
        <button
          onClick={onClose}
          className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          关闭详情
        </button>
      </div>
    </div>
  );
};

interface EmptyNodeDetailProps {
  children?: React.ReactNode;
}

const EmptyNodeDetail: React.FC<EmptyNodeDetailProps> = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col items-center text-center text-gray-400">
        <GitBranch className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm font-medium">点击节点查看详情</p>
        <p className="text-xs mt-1">选择图谱中的任意节点以查看其详细信息、描述和关联关系</p>
      </div>
    </div>
  );
};

export { NodeDetailPanel, EmptyNodeDetail };
export default NodeDetailPanel;
