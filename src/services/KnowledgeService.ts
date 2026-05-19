import type { KnowledgeNode } from '../types';

export class KnowledgeService {
  static searchByQuery(nodes: KnowledgeNode[], query: string): KnowledgeNode[] {
    if (!query || query.trim() === '') return [];
    const q = query.toLowerCase();
    return nodes.filter(n =>
      n.name.toLowerCase().includes(q) ||
      n.description.toLowerCase().includes(q) ||
      n.type.toLowerCase().includes(q)
    );
  }

  static getConnections(nodes: KnowledgeNode[], nodeId: string): KnowledgeNode[] {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return [];
    const connectionSet = new Set(node.connections);
    return nodes.filter(n => connectionSet.has(n.id));
  }

  static getOrphanNodes(nodes: KnowledgeNode[]): KnowledgeNode[] {
    const connectedIds = new Set<string>();
    nodes.forEach(n => n.connections.forEach(c => connectedIds.add(c)));
    return nodes.filter(n => n.connections.length === 0 && !connectedIds.has(n.id));
  }

  static getMostConnected(nodes: KnowledgeNode[], limit: number = 5): Array<{ node: KnowledgeNode; connectionCount: number }> {
    return nodes
      .map(n => ({ node: n, connectionCount: n.connections.length }))
      .sort((a, b) => b.connectionCount - a.connectionCount)
      .slice(0, limit);
  }

  static getTypeStats(nodes: KnowledgeNode[]) {
    const stats: Record<string, number> = {};
    nodes.forEach(n => { stats[n.type] = (stats[n.type] || 0) + 1; });
    return stats;
  }
}
