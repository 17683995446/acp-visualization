import React from 'react';
import { Network } from 'lucide-react';
import type { KnowledgeNode } from '../../types';

interface GraphOverviewProps {
  knowledgeNodes: KnowledgeNode[];
  stats: {
    counts: Record<string, number>;
    total: number;
    totalConnections: number;
  };
}

const GraphOverview: React.FC<GraphOverviewProps> = ({ knowledgeNodes, stats }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
        <Network className="w-4 h-4 text-secondary-500" />
        <span>图谱概览</span>
      </h4>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">总连接数</span>
          <span className="text-sm font-semibold text-gray-900">{stats.totalConnections}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">平均连接</span>
          <span className="text-sm font-semibold text-gray-900">
            {stats.total > 0 ? (stats.totalConnections / stats.total).toFixed(1) : '0'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">最密集节点</span>
          <span className="text-sm font-semibold text-gray-900 truncate ml-2">
            {knowledgeNodes.length > 0
              ? knowledgeNodes.reduce((a, b) =>
                  a.connections.length >= b.connections.length ? a : b
                ).name
              : '-'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">孤立节点</span>
          <span className="text-sm font-semibold text-gray-900">
            {knowledgeNodes.filter(
              (n) => n.connections.length === 0 && !knowledgeNodes.some((o) => o.connections.includes(n.id))
            ).length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GraphOverview;
