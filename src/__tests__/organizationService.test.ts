/**
 * OrganizationService 单元测试
 */
import { describe, it, expect } from 'vitest';
import { OrganizationService } from '../services/OrganizationService';
import type { Organization } from '../types';

const mockOrg: Organization = {
  id: 'org-1',
  name: 'Test Corp',
  type: 'corporate',
  mission: 'Test mission',
  members: [
    { id: 'a1', name: 'Alice', role: 'ceo', level: 8, reputation: 95, capabilities: ['战略'], status: 'idle' },
    { id: 'a2', name: 'Bob', role: 'senior', level: 6, reputation: 88, capabilities: ['开发'], status: 'busy' },
    { id: 'a3', name: 'Carol', role: 'senior', level: 6, reputation: 82, capabilities: ['测试'], status: 'idle' },
    { id: 'a4', name: 'Dave', role: 'mid', level: 5, reputation: 75, capabilities: ['前端'], status: 'idle' },
    { id: 'a5', name: 'Eve', role: 'junior', level: 3, reputation: 60, capabilities: ['文档'], status: 'offline' },
  ],
  departments: [
    { id: 'd1', name: '技术部', head: 'a2', members: ['a2', 'a3', 'a4', 'a5'], budget: 50000 },
    { id: 'd2', name: '管理层', head: 'a1', members: ['a1'], budget: 100000 },
  ],
  performance: { tasksCompleted: 100, avgQuality: 4.5, onTimeRate: 0.95, tokenUsage: 1000000, cost: 50 },
};

describe('OrganizationService', () => {
  describe('getMembersByRole', () => {
    it('should filter members by role', () => {
      expect(OrganizationService.getMembersByRole(mockOrg, 'senior')).toHaveLength(2);
      expect(OrganizationService.getMembersByRole(mockOrg, 'ceo')).toHaveLength(1);
      expect(OrganizationService.getMembersByRole(mockOrg, 'intern')).toHaveLength(0);
    });
  });

  describe('getMembersByDepartment', () => {
    it('should return members in a department', () => {
      const techMembers = OrganizationService.getMembersByDepartment(mockOrg, 'd1');
      expect(techMembers).toHaveLength(4);
      expect(techMembers.map(m => m.id)).toContain('a2');
    });

    it('should return empty for non-existent department', () => {
      expect(OrganizationService.getMembersByDepartment(mockOrg, 'd999')).toHaveLength(0);
    });
  });

  describe('getTopPerformers', () => {
    it('should return members sorted by reputation', () => {
      const top3 = OrganizationService.getTopPerformers(mockOrg.members, 3);
      expect(top3).toHaveLength(3);
      expect(top3[0].id).toBe('a1'); // reputation 95
      expect(top3[1].id).toBe('a2'); // reputation 88
      expect(top3[2].id).toBe('a3'); // reputation 82
    });

    it('should respect limit parameter', () => {
      expect(OrganizationService.getTopPerformers(mockOrg.members, 1)).toHaveLength(1);
    });

    it('should handle empty members', () => {
      expect(OrganizationService.getTopPerformers([], 5)).toHaveLength(0);
    });
  });

  describe('getDepartmentStats', () => {
    it('should calculate department statistics', () => {
      const stats = OrganizationService.getDepartmentStats(mockOrg);
      expect(stats).toHaveLength(2);

      const tech = stats.find(s => s.id === 'd1')!;
      expect(tech.name).toBe('技术部');
      expect(tech.memberCount).toBe(4);
      expect(tech.avgReputation).toBe(Math.round((88 + 82 + 75 + 60) / 4));
      expect(tech.budget).toBe(50000);
    });
  });

  describe('isValidMember', () => {
    it('should return true for existing member', () => {
      expect(OrganizationService.isValidMember(mockOrg, 'a1')).toBe(true);
      expect(OrganizationService.isValidMember(mockOrg, 'a5')).toBe(true);
    });

    it('should return false for non-existent member', () => {
      expect(OrganizationService.isValidMember(mockOrg, 'a999')).toBe(false);
    });
  });
});
