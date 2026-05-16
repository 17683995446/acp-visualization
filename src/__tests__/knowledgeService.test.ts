import { describe, it, expect } from 'vitest';
import { KnowledgeService } from '../services/KnowledgeService';
import type { KnowledgeNode } from '../types';

const mockNodes: KnowledgeNode[] = [
  { id: 'k1', type: 'function', name: 'handleAuth', description: '处理用户认证逻辑', connections: ['k2', 'k3'] },
  { id: 'k2', type: 'class', name: 'AuthService', description: '认证服务类', connections: ['k1', 'k4'] },
  { id: 'k3', type: 'concept', name: 'JWT Token', description: 'JSON Web Token 概念', connections: ['k1'] },
  { id: 'k4', type: 'file', name: 'config.ts', description: '配置文件', connections: ['k2'] },
  { id: 'k5', type: 'decision', name: '缓存策略', description: '缓存决策记录', connections: [] },
  { id: 'k6', type: 'function', name: 'validateInput', description: '输入验证函数', connections: [] },
];

describe('KnowledgeService', () => {
  it('should searchByQuery', () => {
    const results = KnowledgeService.searchByQuery(mockNodes, '认证');
    // Only k1 (处理用户认证逻辑) and k2 (认证服务类) contain '认证'
    expect(results).toHaveLength(2);
    expect(results.map(n => n.id)).toEqual(['k1', 'k2']);

    const results2 = KnowledgeService.searchByQuery(mockNodes, 'function');
    expect(results2).toHaveLength(2); // handleAuth, validateInput (type match)
    expect(results2.map(n => n.id)).toEqual(['k1', 'k6']);

    const results3 = KnowledgeService.searchByQuery(mockNodes, '配置');
    expect(results3).toHaveLength(1);
    expect(results3[0].id).toBe('k4');

    const results4 = KnowledgeService.searchByQuery(mockNodes, '不存在的查询');
    expect(results4).toHaveLength(0);

    // Case insensitive search: 'auth' matches k1 (handleAuth) and k2 (AuthService)
    const results5 = KnowledgeService.searchByQuery(mockNodes, 'AUTH');
    expect(results5).toHaveLength(2);
    expect(results5.map(n => n.id)).toEqual(['k1', 'k2']);
  });

  it('should getConnections', () => {
    const connections = KnowledgeService.getConnections(mockNodes, 'k1');
    expect(connections).toHaveLength(2);
    expect(connections.map(n => n.id)).toEqual(['k2', 'k3']);

    const connections2 = KnowledgeService.getConnections(mockNodes, 'k2');
    expect(connections2).toHaveLength(2);
    expect(connections2.map(n => n.id)).toEqual(['k1', 'k4']);

    const connections3 = KnowledgeService.getConnections(mockNodes, 'k5');
    expect(connections3).toHaveLength(0);

    const connections4 = KnowledgeService.getConnections(mockNodes, 'nonexistent');
    expect(connections4).toHaveLength(0);
  });

  it('should getOrphanNodes', () => {
    const orphans = KnowledgeService.getOrphanNodes(mockNodes);
    expect(orphans).toHaveLength(2);
    expect(orphans.map(n => n.id)).toEqual(['k5', 'k6']);
  });

  it('should getMostConnected', () => {
    const mostConnected = KnowledgeService.getMostConnected(mockNodes);
    expect(mostConnected).toHaveLength(5);
    // k1 has 2 connections, k2 has 2 connections, k3 has 1, k4 has 1, k5 has 0, k6 has 0
    expect(mostConnected[0].connectionCount).toBe(2);
    expect(mostConnected[0].node.id).toBe('k1');
    expect(mostConnected[1].connectionCount).toBe(2);
    expect(mostConnected[1].node.id).toBe('k2');

    const top2 = KnowledgeService.getMostConnected(mockNodes, 2);
    expect(top2).toHaveLength(2);
    expect(top2[0].connectionCount).toBeGreaterThanOrEqual(top2[1].connectionCount);

    const top1 = KnowledgeService.getMostConnected(mockNodes, 1);
    expect(top1).toHaveLength(1);
    expect(top1[0].connectionCount).toBe(2);
  });

  it('should getTypeStats', () => {
    const stats = KnowledgeService.getTypeStats(mockNodes);
    expect(stats['function']).toBe(2);
    expect(stats['class']).toBe(1);
    expect(stats['concept']).toBe(1);
    expect(stats['file']).toBe(1);
    expect(stats['decision']).toBe(1);
    expect(Object.keys(stats)).toHaveLength(5);

    const emptyStats = KnowledgeService.getTypeStats([]);
    expect(Object.keys(emptyStats)).toHaveLength(0);
  });
});
