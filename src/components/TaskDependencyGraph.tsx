import React, { useMemo, useState, useCallback } from 'react';
import type { Task, TaskStatus, TaskPriority } from '../types';

interface TaskNode {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  assignee?: string;
  dependencies: string[];
  x: number;
  y: number;
}

interface TaskDependencyGraphProps {
  tasks: Task[];
  onTaskClick?: (taskId: string) => void;
  selectedTaskId?: string;
  width?: number;
  height?: number;
}

// 状态颜色配置
const statusColors: Record<TaskStatus, string> = {
  pending: '#9CA3AF',      // gray-400
  scheduled: '#60A5FA',    // blue-400
  in_progress: '#3B82F6',  // blue-500
  completed: '#22C55E',    // green-500
  failed: '#EF4444',       // red-500
  blocked: '#F97316',      // orange-500
};

const statusLabels: Record<TaskStatus, string> = {
  pending: '待处理',
  scheduled: '已调度',
  in_progress: '进行中',
  completed: '已完成',
  failed: '失败',
  blocked: '阻塞',
};

const priorityLabels: Record<TaskPriority, string> = {
  P0: '紧急',
  P1: '高',
  P2: '中',
  P3: '低',
};

// 优先级边框颜色
const priorityBorderColors: Record<TaskPriority, string> = {
  P0: '#EF4444', // red-500
  P1: '#F97316', // orange-500
  P2: '#9CA3AF', // gray-400
  P3: '#D1D5DB', // gray-300
};

// 优先级节点大小
const prioritySizes: Record<TaskPriority, number> = {
  P0: 24,
  P1: 20,
  P2: 16,
  P3: 12,
};

// 状态排序权重（用于列布局）
const statusWeights: Record<TaskStatus, number> = {
  pending: 0,
  scheduled: 1,
  in_progress: 2,
  blocked: 3,
  completed: 4,
  failed: 5,
};

// 优先级排序权重
const priorityWeights: Record<TaskPriority, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
};

// Deterministic hash function for stable jitter
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

export const TaskDependencyGraph: React.FC<TaskDependencyGraphProps> = ({
  tasks,
  onTaskClick,
  selectedTaskId,
  width = 800,
  height = 400,
}) => {
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // 计算节点位置
  const nodes = useMemo((): TaskNode[] => {
    if (tasks.length === 0) return [];

    // 按状态分组
    const tasksByStatus = tasks.reduce((acc, task) => {
      if (!acc[task.status]) acc[task.status] = [];
      acc[task.status].push(task);
      return acc;
    }, {} as Record<TaskStatus, Task[]>);

    // 计算列宽
    const margin = { top: 60, right: 40, bottom: 60, left: 40 };
    const availableWidth = width - margin.left - margin.right;
    const availableHeight = height - margin.top - margin.bottom;

    // 获取所有存在的状态并按权重排序
    const existingStatuses = (Object.keys(tasksByStatus) as TaskStatus[])
      .sort((a, b) => statusWeights[a] - statusWeights[b]);

    const columnCount = existingStatuses.length || 1;
    const columnWidth = availableWidth / columnCount;

    const nodeMap = new Map<string, TaskNode>();

    existingStatuses.forEach((status, colIndex) => {
      const statusTasks = tasksByStatus[status];
      // 按优先级排序
      const sortedTasks = [...statusTasks].sort(
        (a, b) => priorityWeights[a.priority] - priorityWeights[b.priority]
      );

      const rowHeight = availableHeight / (sortedTasks.length + 1);

      sortedTasks.forEach((task, rowIndex) => {
        const baseX = margin.left + columnWidth * colIndex + columnWidth / 2;
        const baseY = margin.top + rowHeight * (rowIndex + 1);

        // 添加确定性抖动避免重叠
        const jitter = (Math.abs(hashCode(task.id)) % 40) - 20;

        nodeMap.set(task.id, {
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          progress: task.progress,
          assignee: task.assignee,
          dependencies: task.dependencies,
          x: baseX,
          y: baseY + jitter,
        });
      });
    });

    return Array.from(nodeMap.values());
  }, [tasks, width, height]);

  // 构建边（依赖关系）
  const edges = useMemo(() => {
    const edgeList: { from: TaskNode; to: TaskNode }[] = [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    nodes.forEach((node) => {
      node.dependencies.forEach((depId) => {
        const fromNode = nodeMap.get(depId);
        if (fromNode) {
          edgeList.push({ from: fromNode, to: node });
        }
      });
    });

    return edgeList;
  }, [nodes]);

  // 处理鼠标移动
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left + 10,
      y: e.clientY - rect.top - 10,
    });
  }, []);

  // 空状态
  if (tasks.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200"
        style={{ width, height }}
      >
        <svg
          className="w-16 h-16 text-gray-300 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="text-gray-500 text-lg font-medium">暂无任务</p>
        <p className="text-gray-400 text-sm mt-1">创建任务后将在此显示依赖关系图</p>
      </div>
    );
  }

  const hoveredNode = hoveredTaskId
    ? nodes.find((n) => n.id === hoveredTaskId)
    : null;

  return (
    <div className="relative">
      <svg
        width={width}
        height={height}
        className="bg-gray-50 rounded-lg border border-gray-200"
        onMouseMove={handleMouseMove}
      >
        <defs>
          {/* 箭头标记 */}
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#9CA3AF" />
          </marker>
          <marker
            id="arrowhead-highlighted"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#3B82F6" />
          </marker>

          {/* 选中状态的滤镜 */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 列标签 */}
        {(['pending', 'scheduled', 'in_progress', 'blocked', 'completed', 'failed'] as TaskStatus[])
          .filter((status) => nodes.some((n) => n.status === status))
          .map((status, index, arr) => {
            const margin = { top: 60, right: 40, bottom: 60, left: 40 };
            const availableWidth = width - margin.left - margin.right;
            const columnWidth = availableWidth / arr.length;
            const x = margin.left + columnWidth * index + columnWidth / 2;

            return (
              <g key={status}>
                <text
                  x={x}
                  y={30}
                  textAnchor="middle"
                  className="text-xs font-medium fill-gray-500"
                >
                  {statusLabels[status]}
                </text>
                {/* 列分隔线（虚线） */}
                {index > 0 && (
                  <line
                    x1={margin.left + columnWidth * index}
                    y1={40}
                    x2={margin.left + columnWidth * index}
                    y2={height - 40}
                    stroke="#E5E7EB"
                    strokeDasharray="4 4"
                  />
                )}
              </g>
            );
          })}

        {/* 边（依赖线） */}
        {edges.map((edge, index) => {
          const isHighlighted =
            hoveredTaskId === edge.from.id ||
            hoveredTaskId === edge.to.id ||
            selectedTaskId === edge.from.id ||
            selectedTaskId === edge.to.id;

          // 计算箭头起点和终点（考虑节点半径）
          const fromRadius = prioritySizes[edge.from.priority];
          const nodeRadius = prioritySizes[edge.to.priority];
          const dx = edge.to.x - edge.from.x;
          const dy = edge.to.y - edge.from.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const offsetX = (dx / distance) * (nodeRadius + 5);
          const offsetY = (dy / distance) * (nodeRadius + 5);
          const fromOffsetX = (dx / distance) * (fromRadius + 5);
          const fromOffsetY = (dy / distance) * (fromRadius + 5);

          return (
            <line
              key={`edge-${index}`}
              x1={edge.from.x + fromOffsetX}
              y1={edge.from.y + fromOffsetY}
              x2={edge.to.x - offsetX}
              y2={edge.to.y - offsetY}
              stroke={isHighlighted ? '#3B82F6' : '#9CA3AF'}
              strokeWidth={isHighlighted ? 2 : 1}
              markerEnd={isHighlighted ? 'url(#arrowhead-highlighted)' : 'url(#arrowhead)'}
              opacity={hoveredTaskId && !isHighlighted ? 0.3 : 1}
              style={{ transition: 'all 0.2s ease' }}
            />
          );
        })}

        {/* 节点 */}
        {nodes.map((node) => {
          const isSelected = selectedTaskId === node.id;
          const isHovered = hoveredTaskId === node.id;
          const size = prioritySizes[node.priority];
          const borderColor = priorityBorderColors[node.priority];
          const fillColor = statusColors[node.status];

          return (
            <g
              key={node.id}
              className="cursor-pointer"
              onClick={() => onTaskClick?.(node.id)}
              onMouseEnter={() => setHoveredTaskId(node.id)}
              onMouseLeave={() => setHoveredTaskId(null)}
            >
              {/* 选中状态的光环 */}
              {isSelected && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={size + 8}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  opacity={0.6}
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from={`0 ${node.x} ${node.y}`}
                    to={`360 ${node.x} ${node.y}`}
                    dur="8s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* 悬停状态背景 */}
              {isHovered && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={size + 6}
                  fill="#EFF6FF"
                  opacity={0.5}
                />
              )}

              {/* 节点圆形 */}
              <circle
                cx={node.x}
                cy={node.y}
                r={size}
                fill={fillColor}
                stroke={borderColor}
                strokeWidth={node.priority === 'P0' || node.priority === 'P1' ? 3 : 2}
                opacity={hoveredTaskId && !isHovered && !isSelected ? 0.5 : 1}
                style={{ transition: 'all 0.2s ease' }}
                filter={isSelected ? 'url(#glow)' : undefined}
              />

              {/* 进度指示器（内圈） */}
              {node.progress > 0 && node.progress < 100 && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={size * 0.6}
                  fill="none"
                  stroke="white"
                  strokeWidth={2}
                  strokeDasharray={`${(node.progress / 100) * 2 * Math.PI * size * 0.6} ${2 * Math.PI * size * 0.6}`}
                  transform={`rotate(-90 ${node.x} ${node.y})`}
                  opacity={0.8}
                />
              )}

              {/* 任务标题 */}
              <text
                x={node.x}
                y={node.y + size + 18}
                textAnchor="middle"
                className="text-xs fill-gray-700"
                style={{ fontSize: '11px' }}
              >
                {node.title.length > 8
                  ? node.title.slice(0, 8) + '...'
                  : node.title}
              </text>

              {/* 优先级标记（小圆点） */}
              {node.priority === 'P0' && (
                <circle
                  cx={node.x + size * 0.7}
                  cy={node.y - size * 0.7}
                  r={4}
                  fill="#EF4444"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* 悬停提示框 */}
      {hoveredNode && (
        <div
          className="absolute z-10 bg-white rounded-lg shadow-lg border border-gray-200 p-3 pointer-events-none"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            minWidth: '200px',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-900 text-sm">
              {hoveredNode.title}
            </span>
            <span
              className="px-1.5 py-0.5 text-xs rounded font-medium"
              style={{
                backgroundColor: statusColors[hoveredNode.status] + '20',
                color: statusColors[hoveredNode.status],
              }}
            >
              {statusLabels[hoveredNode.status]}
            </span>
          </div>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <span>优先级:</span>
              <span
                className="font-medium"
                style={{ color: priorityBorderColors[hoveredNode.priority] }}
              >
                {hoveredNode.priority} ({priorityLabels[hoveredNode.priority]})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>进度:</span>
              <span className="font-medium">{Math.round(hoveredNode.progress)}%</span>
            </div>
            {hoveredNode.assignee && (
              <div className="flex items-center justify-between">
                <span>负责人:</span>
                <span className="font-medium">{hoveredNode.assignee}</span>
              </div>
            )}
            {hoveredNode.dependencies.length > 0 && (
              <div className="flex items-center justify-between">
                <span>依赖任务:</span>
                <span className="font-medium">{hoveredNode.dependencies.length} 个</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 图例 */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 p-3 shadow-sm">
        <div className="text-xs font-medium text-gray-700 mb-2">状态</div>
        <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
          {(Object.keys(statusColors) as TaskStatus[]).map((status) => (
            <div key={status} className="flex items-center space-x-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: statusColors[status] }}
              />
              <span className="text-xs text-gray-600">{statusLabels[status]}</span>
            </div>
          ))}
        </div>
        <div className="text-xs font-medium text-gray-700 mt-3 mb-2">优先级</div>
        <div className="flex items-center space-x-4">
          {(Object.keys(prioritySizes) as TaskPriority[]).map((priority) => (
            <div key={priority} className="flex items-center space-x-1.5">
              <div
                className="rounded-full border-2"
                style={{
                  width: prioritySizes[priority] / 2,
                  height: prioritySizes[priority] / 2,
                  borderColor: priorityBorderColors[priority],
                  backgroundColor: '#F3F4F6',
                }}
              />
              <span className="text-xs text-gray-600">
                {priority} {priorityLabels[priority]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskDependencyGraph;
