import type { KnowledgeNode } from '../../types';

// ============ 常量 ============

export const NODE_RADIUS = 32;

// ============ 类型 ============

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  node: KnowledgeNode;
}

// ============ 布局算法 ============

/**
 * 简化的力导向布局算法
 * 使用多次迭代计算节点位置，包含斥力和引力
 */
export function computeLayout(nodes: KnowledgeNode[], width: number, height: number): LayoutNode[] {
  if (nodes.length === 0) return [];

  const centerX = width / 2;
  const centerY = height / 2;
  const padding = NODE_RADIUS + 40;

  // 初始化：圆形布局
  const positions: Map<string, { x: number; y: number }> = new Map();
  const usableRadius = Math.min(width, height) / 2 - padding;

  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    const r = nodes.length === 1 ? 0 : usableRadius * (0.6 + 0.4 * Math.cos(angle * 2));
    positions.set(node.id, {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
    });
  });

  // 力导向迭代 - 根据节点数量动态调整迭代次数
  const iterations = nodes.length > 50 ? 40 : 80;
  const repulsionStrength = 8000;
  const attractionStrength = 0.005;
  const centerStrength = 0.01;
  const damping = 0.85;

  const velocities: Map<string, { vx: number; vy: number }> = new Map();
  nodes.forEach((n) => velocities.set(n.id, { vx: 0, vy: 0 }));

  const idToNode = new Map(nodes.map((n) => [n.id, n]));

  for (let iter = 0; iter < iterations; iter++) {
    const temperature = 1 - iter / iterations;

    // 斥力（所有节点对之间）
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = positions.get(nodes[i].id)!;
        const b = positions.get(nodes[j].id)!;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsionStrength / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        const va = velocities.get(nodes[i].id)!;
        const vb = velocities.get(nodes[j].id)!;
        va.vx += fx * temperature;
        va.vy += fy * temperature;
        vb.vx -= fx * temperature;
        vb.vy -= fy * temperature;
      }
    }

    // 引力（连接的节点之间）
    nodes.forEach((node) => {
      node.connections.forEach((connId) => {
        if (node.id >= connId) return; // Avoid double-counting
        if (!idToNode.has(connId)) return;
        const a = positions.get(node.id)!;
        const b = positions.get(connId)!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = dist * attractionStrength;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        const va = velocities.get(node.id)!;
        const vb = velocities.get(connId)!;
        va.vx += fx * temperature;
        va.vy += fy * temperature;
        vb.vx -= fx * temperature;
        vb.vy -= fy * temperature;
      });
    });

    // 向心力
    nodes.forEach((node) => {
      const p = positions.get(node.id)!;
      const dx = centerX - p.x;
      const dy = centerY - p.y;
      const v = velocities.get(node.id)!;
      v.vx += dx * centerStrength * temperature;
      v.vy += dy * centerStrength * temperature;
    });

    // 应用速度
    nodes.forEach((node) => {
      const p = positions.get(node.id)!;
      const v = velocities.get(node.id)!;
      v.vx *= damping;
      v.vy *= damping;
      p.x += v.vx;
      p.y += v.vy;

      // 边界约束
      p.x = Math.max(padding, Math.min(width - padding, p.x));
      p.y = Math.max(padding, Math.min(height - padding, p.y));
    });
  }

  return nodes.map((node) => ({
    id: node.id,
    x: positions.get(node.id)!.x,
    y: positions.get(node.id)!.y,
    node,
  }));
}
