import React from 'react';
import { Network } from 'lucide-react';
import type { KnowledgeNode } from '../../types';
import type { LayoutNode } from './computeLayout';
import { NODE_RADIUS } from './computeLayout';
import { TYPE_CONFIG, ALL_TYPES } from './constants';

interface KnowledgeGraphProps {
  filteredNodes: KnowledgeNode[];
  layoutNodes: LayoutNode[];
  layoutMap: Map<string, LayoutNode>;
  selectedNode: KnowledgeNode | null;
  edges: { from: LayoutNode; to: LayoutNode; key: string }[];
  svgWidth: number;
  svgHeight: number;
  onNodeClick: (node: KnowledgeNode) => void;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  filteredNodes,
  layoutNodes,
  selectedNode,
  edges,
  svgWidth,
  svgHeight,
  onNodeClick,
}) => {
  return (
    <div className="relative">
      {filteredNodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[600px] text-gray-400">
          <Network className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">暂无节点</p>
          <p className="text-sm mt-1">点击"添加节点"开始构建知识图谱</p>
        </div>
      ) : (
        <svg
          width="100%"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="bg-gradient-to-br from-gray-50 to-gray-100"
        >
          {/* 渐变定义 */}
          <defs>
            {ALL_TYPES.map((type) => {
              const cfg = TYPE_CONFIG[type];
              return (
                <radialGradient key={type} id={`grad-${type}`} cx="40%" cy="35%" r="60%">
                  <stop offset="0%" stopColor={cfg.color} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={cfg.stroke} stopOpacity="1" />
                </radialGradient>
              );
            })}
            {/* 箭头标记 */}
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
            </marker>
            {/* 节点阴影 */}
            <filter id="node-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.12" />
            </filter>
            {/* 选中高亮光晕 */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 网格背景 */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* 连接线 */}
          {edges.map((edge) => {
            const isSelected =
              selectedNode &&
              (edge.from.id === selectedNode.id || edge.to.id === selectedNode.id);
            return (
              <line
                key={edge.key}
                x1={edge.from.x}
                y1={edge.from.y}
                x2={edge.to.x}
                y2={edge.to.y}
                stroke={isSelected ? '#6366f1' : '#cbd5e1'}
                strokeWidth={isSelected ? 2.5 : 1.5}
                strokeDasharray={isSelected ? undefined : '6,4'}
                markerEnd="url(#arrowhead)"
                className="transition-all duration-300"
              />
            );
          })}

          {/* 节点 */}
          {layoutNodes.map((ln) => {
            const cfg = TYPE_CONFIG[ln.node.type];
            const isSelected = selectedNode?.id === ln.id;
            const isConnected =
              selectedNode &&
              selectedNode.id !== ln.id &&
              (selectedNode.connections.includes(ln.id) ||
                ln.node.connections.includes(selectedNode.id));
            const isDimmed = selectedNode && !isSelected && !isConnected;

            return (
              <g
                key={ln.id}
                className="cursor-pointer transition-all duration-200"
                style={{ opacity: isDimmed ? 0.3 : 1 }}
                onClick={() => onNodeClick(ln.node)}
              >
                {/* 选中光晕 */}
                {isSelected && (
                  <circle
                    cx={ln.x}
                    cy={ln.y}
                    r={NODE_RADIUS + 8}
                    fill="none"
                    stroke={cfg.color}
                    strokeWidth="2"
                    strokeDasharray="4,3"
                    opacity="0.6"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from={`0 ${ln.x} ${ln.y}`}
                      to={`360 ${ln.x} ${ln.y}`}
                      dur="8s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* 节点圆 */}
                <circle
                  cx={ln.x}
                  cy={ln.y}
                  r={NODE_RADIUS}
                  fill={cfg.gradient}
                  stroke={isSelected ? '#1e1b4b' : cfg.stroke}
                  strokeWidth={isSelected ? 3 : 1.5}
                  filter={isSelected ? 'url(#glow)' : 'url(#node-shadow)'}
                  className="transition-all duration-200 hover:scale-105"
                  style={{ transformOrigin: `${ln.x}px ${ln.y}px` }}
                />

                {/* 节点图标文字 */}
                <text
                  x={ln.x}
                  y={ln.y - 4}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="Inter, system-ui, sans-serif"
                >
                  {ln.node.type === 'file'
                    ? 'F'
                    : ln.node.type === 'function'
                    ? 'fn'
                    : ln.node.type === 'class'
                    ? 'C'
                    : ln.node.type === 'concept'
                    ? '?'
                    : 'D'}
                </text>

                {/* 节点名称标签 */}
                <text
                  x={ln.x}
                  y={ln.y + NODE_RADIUS + 16}
                  textAnchor="middle"
                  fill={isDimmed ? '#9ca3af' : '#374151'}
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="Inter, system-ui, sans-serif"
                  className="pointer-events-none"
                >
                  {ln.node.name.length > 12
                    ? ln.node.name.slice(0, 11) + '...'
                    : ln.node.name}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};

export default KnowledgeGraph;
