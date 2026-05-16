/**
 * Knowledge 知识图谱可视化页面
 * 使用 SVG 实现交互式力导向布局的知识图谱
 */
import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Network, GitBranch } from 'lucide-react';
import { useACPStore } from '../store/acpStore';
import { SearchBar } from '../components/ui';
import { KnowledgeService } from '../services';
import type { KnowledgeNode } from '../types';

import { computeLayout } from './knowledge/computeLayout';
import type { LayoutNode } from './knowledge/computeLayout';
import { TYPE_CONFIG, ALL_TYPES } from './knowledge/constants';
import KnowledgeGraph from './knowledge/KnowledgeGraph';
import { NodeDetailPanel, EmptyNodeDetail } from './knowledge/NodeDetailPanel';
import GraphOverview from './knowledge/GraphOverview';
import AddNodeModal from './knowledge/AddNodeModal';

// ============ 组件 ============

const Knowledge: React.FC = () => {
  const { knowledgeNodes, addKnowledgeNode, deleteKnowledgeNode } = useACPStore();

  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterTypes, setFilterTypes] = useState<Set<KnowledgeNode['type']>>(new Set(ALL_TYPES));
  const [searchText, setSearchText] = useState('');

  // SVG 尺寸
  const svgWidth = 900;
  const svgHeight = 600;

  // 过滤节点 - 使用 KnowledgeService.searchByQuery 进行搜索
  const filteredNodes = useMemo(() => {
    let result = knowledgeNodes.filter((n) => filterTypes.has(n.type));
    if (searchText.trim()) {
      const searched = KnowledgeService.searchByQuery(result, searchText);
      return searched;
    }
    return result;
  }, [knowledgeNodes, filterTypes, searchText]);

  // 计算布局
  const layoutNodes = useMemo(
    () => computeLayout(filteredNodes, svgWidth, svgHeight),
    [filteredNodes, svgWidth, svgHeight]
  );

  const layoutMap = useMemo(
    () => new Map(layoutNodes.map((ln) => [ln.id, ln])),
    [layoutNodes]
  );

  // 统计
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_TYPES.forEach((t) => (counts[t] = 0));
    knowledgeNodes.forEach((n) => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });
    const totalConnections = knowledgeNodes.reduce((sum, n) => sum + n.connections.length, 0);
    return { counts, total: knowledgeNodes.length, totalConnections };
  }, [knowledgeNodes]);

  // 切换类型过滤
  const toggleFilter = useCallback((type: KnowledgeNode['type']) => {
    setFilterTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size > 1) next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  // 提交添加节点
  const handleSubmitAdd = useCallback(
    (data: { type: KnowledgeNode['type']; name: string; description: string; connections: string[] }) => {
      addKnowledgeNode(data);
      setShowAddModal(false);
    },
    [addKnowledgeNode]
  );

  // 删除节点
  const handleDelete = useCallback(
    (id: string) => {
      deleteKnowledgeNode(id);
      if (selectedNode?.id === id) setSelectedNode(null);
    },
    [deleteKnowledgeNode, selectedNode]
  );

  // 连接线（去重，避免双向重复绘制）
  const edges = useMemo(() => {
    const seen = new Set<string>();
    const result: { from: LayoutNode; to: LayoutNode; key: string }[] = [];
    filteredNodes.forEach((node) => {
      node.connections.forEach((connId) => {
        const a = layoutMap.get(node.id);
        const b = layoutMap.get(connId);
        if (!a || !b) return;
        const key = [node.id, connId].sort().join('|');
        if (seen.has(key)) return;
        seen.add(key);
        result.push({ from: a, to: b, key });
      });
    });
    return result;
  }, [filteredNodes, layoutMap]);

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">知识图谱</h1>
          <p className="text-gray-500 mt-1">可视化展示代码库的知识结构与关联关系</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>添加节点</span>
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center space-x-2 mb-1">
            <Network className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">总节点</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        {ALL_TYPES.map((type) => {
          const cfg = TYPE_CONFIG[type];
          return (
            <div
              key={type}
              className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => toggleFilter(type)}
            >
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />
                <span className="text-xs text-gray-500">{cfg.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.counts[type]}</p>
              {!filterTypes.has(type) && (
                <span className="text-xs text-gray-400 line-through">已隐藏</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 主体区域：图谱 + 侧栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 图谱区域 */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* 工具栏 */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <GitBranch className="w-5 h-5 text-primary-500" />
              <span className="text-sm font-semibold text-gray-700">关系图谱</span>
              <span className="text-xs text-gray-400 ml-2">
                {filteredNodes.length} 个节点 / {edges.length} 条连接
              </span>
            </div>
            <div className="w-56">
              <SearchBar
                value={searchText}
                onChange={setSearchText}
                placeholder="搜索节点..."
              />
            </div>
          </div>

          {/* 类型过滤标签 */}
          <div className="flex items-center space-x-2 px-5 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-xs text-gray-500">筛选：</span>
            {ALL_TYPES.map((type) => {
              const cfg = TYPE_CONFIG[type];
              const active = filterTypes.has(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleFilter(type)}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    active
                      ? `${cfg.bg} ${cfg.text} ring-1 ring-current ring-opacity-20`
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: active ? cfg.color : '#9ca3af' }}
                  />
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>

          {/* SVG 图谱 */}
          <KnowledgeGraph
            filteredNodes={filteredNodes}
            layoutNodes={layoutNodes}
            layoutMap={layoutMap}
            selectedNode={selectedNode}
            edges={edges}
            svgWidth={svgWidth}
            svgHeight={svgHeight}
            onNodeClick={setSelectedNode}
          />
        </div>

        {/* 侧栏：节点详情 */}
        <div className="lg:col-span-1 space-y-4">
          {selectedNode ? (
            <NodeDetailPanel
              selectedNode={selectedNode}
              knowledgeNodes={knowledgeNodes}
              onDelete={handleDelete}
              onClose={() => setSelectedNode(null)}
              onNavigate={setSelectedNode}
            />
          ) : (
            <EmptyNodeDetail />
          )}

          {/* 图谱总览统计 */}
          <GraphOverview knowledgeNodes={knowledgeNodes} stats={stats} />
        </div>
      </div>

      {/* 添加节点弹窗 */}
      <AddNodeModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        knowledgeNodes={knowledgeNodes}
        onSubmit={handleSubmitAdd}
      />
    </div>
  );
};

export default Knowledge;
