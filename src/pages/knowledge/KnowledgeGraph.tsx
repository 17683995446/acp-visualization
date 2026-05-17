import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Network, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { KnowledgeNode } from '../../types';
import type { LayoutNode } from './computeLayout';
import { NODE_RADIUS } from './computeLayout';
import { TYPE_CONFIG, ALL_TYPES } from './constants';

// ============ 类型 ============

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

interface Transform {
  x: number;
  y: number;
  scale: number;
}

// ============ 常量 ============

const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;
const ZOOM_STEP = 0.15;
const MINIMAP_WIDTH = 160;
const MINIMAP_HEIGHT = 120;
const MINIMAP_PADDING = 10;

// ============ 工具函数 ============

/** 限制缩放值 */
function clampScale(scale: number): number {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
}

// ============ 组件 ============

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  filteredNodes,
  layoutNodes,
  selectedNode,
  edges,
  svgWidth,
  svgHeight,
  onNodeClick,
}) => {
  // ---- 画布变换状态 ----
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const transformRef = useRef<Transform>(transform);
  transformRef.current = transform;

  // ---- 节点位置（可拖拽修改） ----
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(
    () => new Map(layoutNodes.map((ln) => [ln.id, { x: ln.x, y: ln.y }])),
  );
  const positionsRef = useRef(positions);
  positionsRef.current = positions;

  // 当 layoutNodes 变化时（布局重新计算），同步位置
  useEffect(() => {
    setPositions(new Map(layoutNodes.map((ln) => [ln.id, { x: ln.x, y: ln.y }])));
  }, [layoutNodes]);

  // ---- 悬停状态 ----
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // ---- 拖拽状态（使用 ref 避免拖拽过程中重渲染） ----
  const dragRef = useRef<{
    isDragging: boolean;
    nodeId: string | null;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  }>({
    isDragging: false,
    nodeId: null,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  // ---- 平移状态 ----
  const panRef = useRef<{
    isPanning: boolean;
    startX: number;
    startY: number;
    origTx: number;
    origTy: number;
  }>({
    isPanning: false,
    startX: 0,
    startY: 0,
    origTx: 0,
    origTy: 0,
  });

  // ---- 动画帧引用 ----
  const rafRef = useRef<number | null>(null);

  // ---- SVG ref ----
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ---- 获取节点当前位置 ----
  const getNodePos = useCallback(
    (id: string): { x: number; y: number } => {
      return positionsRef.current.get(id) ?? { x: svgWidth / 2, y: svgHeight / 2 };
    },
    [svgWidth, svgHeight],
  );

  // ---- 缩放处理 ----
  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const prevScale = transformRef.current.scale;
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newScale = clampScale(prevScale + delta);

      // 以鼠标位置为中心缩放
      const newX = mouseX - (mouseX - transformRef.current.x) * (newScale / prevScale);
      const newY = mouseY - (mouseY - transformRef.current.y) * (newScale / prevScale);

      setTransform({ x: newX, y: newY, scale: newScale });
    },
    [],
  );

  // ---- 缩放按钮 ----
  const handleZoomIn = useCallback(() => {
    setTransform((prev) => {
      const newScale = clampScale(prev.scale + ZOOM_STEP);
      const cx = svgWidth / 2;
      const cy = svgHeight / 2;
      return {
        x: cx - (cx - prev.x) * (newScale / prev.scale),
        y: cy - (cy - prev.y) * (newScale / prev.scale),
        scale: newScale,
      };
    });
  }, [svgWidth, svgHeight]);

  const handleZoomOut = useCallback(() => {
    setTransform((prev) => {
      const newScale = clampScale(prev.scale - ZOOM_STEP);
      const cx = svgWidth / 2;
      const cy = svgHeight / 2;
      return {
        x: cx - (cx - prev.x) * (newScale / prev.scale),
        y: cy - (cy - prev.y) * (newScale / prev.scale),
        scale: newScale,
      };
    });
  }, [svgWidth, svgHeight]);

  const handleResetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  // ---- 节点鼠标按下（开始拖拽） ----
  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      e.preventDefault();
      const pos = getNodePos(nodeId);
      dragRef.current = {
        isDragging: true,
        nodeId,
        startX: e.clientX,
        startY: e.clientY,
        origX: pos.x,
        origY: pos.y,
      };
    },
    [getNodePos],
  );

  // ---- SVG 鼠标按下（开始平移） ----
  const handleSvgMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      // 只在空白区域开始平移
      if ((e.target as Element).closest('[data-node]')) return;
      e.preventDefault();
      panRef.current = {
        isPanning: true,
        startX: e.clientX,
        startY: e.clientY,
        origTx: transformRef.current.x,
        origTy: transformRef.current.y,
      };
    },
    [],
  );

  // ---- 全局鼠标移动 ----
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragRef.current.isDragging && dragRef.current.nodeId) {
        const { nodeId, startX, startY, origX, origY } = dragRef.current;
        const dx = (e.clientX - startX) / transformRef.current.scale;
        const dy = (e.clientY - startY) / transformRef.current.scale;
        const padding = NODE_RADIUS + 10;
        const newX = Math.max(padding, Math.min(svgWidth - padding, origX + dx));
        const newY = Math.max(padding, Math.min(svgHeight - padding, origY + dy));

        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          setPositions((prev) => {
            const next = new Map(prev);
            next.set(nodeId, { x: newX, y: newY });
            return next;
          });
        });
      }

      if (panRef.current.isPanning) {
        const dx = e.clientX - panRef.current.startX;
        const dy = e.clientY - panRef.current.startY;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          setTransform((prev) => ({
            ...prev,
            x: panRef.current.origTx + dx,
            y: panRef.current.origTy + dy,
          }));
        });
      }
    };

    const handleMouseUp = () => {
      dragRef.current.isDragging = false;
      dragRef.current.nodeId = null;
      panRef.current.isPanning = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [svgWidth, svgHeight]);

  // ---- 小地图点击平移 ----
  const handleMinimapClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) / rect.width;
      const clickY = (e.clientY - rect.top) / rect.height;

      const containerRect = container.getBoundingClientRect();
      const targetX = containerRect.width / 2 - clickX * svgWidth * transform.scale;
      const targetY = containerRect.height / 2 - clickY * svgHeight * transform.scale;

      setTransform((prev) => ({
        ...prev,
        x: targetX,
        y: targetY,
      }));
    },
    [svgWidth, svgHeight, transform.scale],
  );

  // ---- 计算光标样式 ----
  const isDraggingOrPanning = dragRef.current.isDragging || panRef.current.isPanning;

  // ---- 计算小地图视口矩形 ----
  const minimapViewport = useMemo(() => {
    const container = containerRef.current;
    if (!container) return null;
    const containerRect = container.getBoundingClientRect();
    const scaleX = MINIMAP_WIDTH / svgWidth;
    const scaleY = MINIMAP_HEIGHT / svgHeight;
    const scale = Math.min(scaleX, scaleY);

    const vpX = (-transform.x / transform.scale) * scale + MINIMAP_PADDING;
    const vpY = (-transform.y / transform.scale) * scale + MINIMAP_PADDING;
    const vpW = (containerRect.width / transform.scale) * scale;
    const vpH = (containerRect.height / transform.scale) * scale;

    return { x: vpX, y: vpY, w: vpW, h: vpH, scale };
  }, [transform, svgWidth, svgHeight]);

  // ---- 渲染 ----
  return (
    <div ref={containerRef} className="relative overflow-hidden" style={{ height: 600 }}>
      {filteredNodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <Network className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">暂无节点</p>
          <p className="text-sm mt-1">点击"添加节点"开始构建知识图谱</p>
        </div>
      ) : (
        <>
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
            style={{ cursor: isDraggingOrPanning ? 'grabbing' : 'grab' }}
            onWheel={handleWheel}
            onMouseDown={handleSvgMouseDown}
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
              {/* 悬停光晕 */}
              <filter id="hover-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* 拖拽阴影 */}
              <filter id="drag-shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* 画布变换组 */}
            <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
              {/* 网格背景 */}
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
              </pattern>
              <rect width={svgWidth} height={svgHeight} fill="url(#grid)" />

              {/* 连接线 */}
              {edges.map((edge) => {
                const fromPos = getNodePos(edge.from.id);
                const toPos = getNodePos(edge.to.id);
                const isSelected =
                  selectedNode &&
                  (edge.from.id === selectedNode.id || edge.to.id === selectedNode.id);
                const isHovered =
                  hoveredNodeId &&
                  (edge.from.id === hoveredNodeId || edge.to.id === hoveredNodeId);

                return (
                  <line
                    key={edge.key}
                    x1={fromPos.x}
                    y1={fromPos.y}
                    x2={toPos.x}
                    y2={toPos.y}
                    stroke={
                      isSelected ? '#6366f1' : isHovered ? TYPE_CONFIG[edge.from.node.type]?.color ?? '#6366f1' : '#cbd5e1'
                    }
                    strokeWidth={isSelected ? 2.5 : isHovered ? 2.5 : 1.5}
                    strokeDasharray={isSelected || isHovered ? undefined : '6,4'}
                    strokeOpacity={isHovered ? 1 : undefined}
                    markerEnd="url(#arrowhead)"
                    style={{ transition: 'stroke 0.2s, stroke-width 0.2s, stroke-dasharray 0.2s' }}
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

                const isHovered = hoveredNodeId === ln.id;
                const isDragged = dragRef.current.isDragging && dragRef.current.nodeId === ln.id;

                const pos = getNodePos(ln.id);
                const radius = isHovered ? NODE_RADIUS + 4 : NODE_RADIUS;

                return (
                  <g
                    key={ln.id}
                    data-node="true"
                    className="transition-opacity duration-200"
                    style={{
                      opacity: isDimmed && !hoveredNodeId ? 0.3 : 1,
                      cursor: isDragged ? 'grabbing' : 'pointer',
                    }}
                    onMouseDown={(e) => handleNodeMouseDown(e, ln.id)}
                    onMouseEnter={() => setHoveredNodeId(ln.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNodeClick(ln.node);
                    }}
                  >
                    {/* 选中光晕 */}
                    {isSelected && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius + 8}
                        fill="none"
                        stroke={cfg.color}
                        strokeWidth="2"
                        strokeDasharray="4,3"
                        opacity="0.6"
                      >
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from={`0 ${pos.x} ${pos.y}`}
                          to={`360 ${pos.x} ${pos.y}`}
                          dur="8s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    {/* 悬停光晕 */}
                    {isHovered && !isSelected && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius + 10}
                        fill="none"
                        stroke={cfg.color}
                        strokeWidth="2"
                        opacity="0.4"
                      />
                    )}

                    {/* 节点圆 */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius}
                      fill={cfg.gradient}
                      stroke={isSelected ? '#1e1b4b' : isHovered ? cfg.color : cfg.stroke}
                      strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.5}
                      filter={
                        isDragged
                          ? 'url(#drag-shadow)'
                          : isSelected
                            ? 'url(#glow)'
                            : isHovered
                              ? 'url(#hover-glow)'
                              : 'url(#node-shadow)'
                      }
                      style={{
                        transition: 'r 0.2s ease, stroke 0.2s ease, stroke-width 0.2s ease',
                      }}
                    />

                    {/* 节点图标文字 */}
                    <text
                      x={pos.x}
                      y={pos.y - 4}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="Inter, system-ui, sans-serif"
                      className="pointer-events-none select-none"
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
                      x={pos.x}
                      y={pos.y + radius + 16}
                      textAnchor="middle"
                      fill={isDimmed && !hoveredNodeId ? '#9ca3af' : '#374151'}
                      fontSize="12"
                      fontWeight="600"
                      fontFamily="Inter, system-ui, sans-serif"
                      className="pointer-events-none select-none"
                      style={{ transition: 'fill 0.2s ease' }}
                    >
                      {ln.node.name.length > 12
                        ? ln.node.name.slice(0, 11) + '...'
                        : ln.node.name}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* 悬停工具提示 */}
          {hoveredNodeId && (() => {
            const node = filteredNodes.find((n) => n.id === hoveredNodeId);
            if (!node) return null;
            const cfg = TYPE_CONFIG[node.type];
            return (
              <div
                className="absolute pointer-events-none z-20 px-3 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                style={{
                  left: '50%',
                  top: 12,
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                }}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{node.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* 缩放控制按钮 */}
          <div className="absolute top-3 right-3 flex flex-col space-y-1 z-10">
            <button
              onClick={handleZoomIn}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="放大"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="缩小"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetView}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="重置视图"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* 缩放比例指示 */}
          <div className="absolute bottom-3 left-3 z-10 px-2 py-1 rounded-md bg-white/80 dark:bg-gray-800/80 backdrop-blur text-xs text-gray-500 dark:text-gray-400 font-mono">
            {Math.round(transform.scale * 100)}%
          </div>

          {/* 小地图 */}
          {minimapViewport && (
            <div
              className="absolute bottom-3 right-3 z-10 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md cursor-pointer"
              style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
              onClick={handleMinimapClick}
              title="点击小地图跳转到对应位置"
            >
              <svg
                width={MINIMAP_WIDTH}
                height={MINIMAP_HEIGHT}
                viewBox={`0 0 ${MINIMAP_WIDTH} ${MINIMAP_HEIGHT}`}
              >
                {/* 背景 */}
                <rect
                  width={MINIMAP_WIDTH}
                  height={MINIMAP_HEIGHT}
                  fill="#f9fafb"
                  className="dark:fill-gray-900"
                />

                {/* 节点小点 */}
                {layoutNodes.map((ln) => {
                  const pos = getNodePos(ln.id);
                  const cfg = TYPE_CONFIG[ln.node.type];
                  const mx = pos.x * minimapViewport.scale + MINIMAP_PADDING;
                  const my = pos.y * minimapViewport.scale + MINIMAP_PADDING;
                  const isSelected = selectedNode?.id === ln.id;
                  return (
                    <circle
                      key={ln.id}
                      cx={mx}
                      cy={my}
                      r={isSelected ? 3 : 2}
                      fill={cfg.color}
                      opacity={isSelected ? 1 : 0.7}
                    />
                  );
                })}

                {/* 视口矩形 */}
                <rect
                  x={Math.max(0, minimapViewport.x)}
                  y={Math.max(0, minimapViewport.y)}
                  width={Math.min(
                    MINIMAP_WIDTH - Math.max(0, minimapViewport.x),
                    minimapViewport.w,
                  )}
                  height={Math.min(
                    MINIMAP_HEIGHT - Math.max(0, minimapViewport.y),
                    minimapViewport.h,
                  )}
                  fill="rgba(99, 102, 241, 0.08)"
                  stroke="#6366f1"
                  strokeWidth="1.5"
                  rx="2"
                />
              </svg>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default KnowledgeGraph;
