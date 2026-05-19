/**
 * TaskService 单元测试
 */
import { describe, it, expect } from 'vitest';
import { TaskService } from '../services/TaskService';
import type { Task } from '../types';

const mockTasks: Task[] = [
  { id: 't1', title: '任务A', description: '描述A', status: 'pending', priority: 'P0', dependencies: [], progress: 0, estimatedTime: 100, createdAt: Date.now() },
  { id: 't2', title: '任务B', description: '描述B', status: 'in_progress', priority: 'P1', dependencies: ['t1'], progress: 50, estimatedTime: 200, createdAt: Date.now() },
  { id: 't3', title: '任务C', description: '描述C', status: 'completed', priority: 'P2', dependencies: ['t1'], progress: 100, estimatedTime: 150, createdAt: Date.now(), actualTime: 120 },
  { id: 't4', title: '任务D', description: '描述D', status: 'pending', priority: 'P1', dependencies: ['t2', 't3'], progress: 0, estimatedTime: 180, createdAt: Date.now() },
  { id: 't5', title: '任务E', description: '描述E', status: 'failed', priority: 'P3', dependencies: [], progress: 30, estimatedTime: 90, createdAt: Date.now() },
  { id: 't6', title: '任务F', description: '描述F', status: 'blocked', priority: 'P2', dependencies: ['t5'], progress: 0, estimatedTime: 60, createdAt: Date.now() },
];

describe('TaskService', () => {
  describe('filterByStatus', () => {
    it('should filter tasks by status', () => {
      expect(TaskService.filterByStatus(mockTasks, 'pending')).toHaveLength(2);
      expect(TaskService.filterByStatus(mockTasks, 'in_progress')).toHaveLength(1);
      expect(TaskService.filterByStatus(mockTasks, 'completed')).toHaveLength(1);
      expect(TaskService.filterByStatus(mockTasks, 'failed')).toHaveLength(1);
      expect(TaskService.filterByStatus(mockTasks, 'blocked')).toHaveLength(1);
    });

    it('should return empty array for non-existent status', () => {
      expect(TaskService.filterByStatus(mockTasks, 'scheduled' as any)).toHaveLength(0);
    });
  });

  describe('getAssignableTasks', () => {
    it('should return tasks with no unmet dependencies', () => {
      const assignable = TaskService.getAssignableTasks(mockTasks);
      // t1 has no deps (pending), t5 has no deps (failed - not pending)
      expect(assignable).toHaveLength(1);
      expect(assignable[0].id).toBe('t1');
    });

    it('should include tasks whose dependencies are all completed', () => {
      const tasks: Task[] = [
        { id: 'a', title: 'A', description: '', status: 'completed', priority: 'P1', dependencies: [], progress: 100, estimatedTime: 10, createdAt: Date.now() },
        { id: 'b', title: 'B', description: '', status: 'pending', priority: 'P1', dependencies: ['a'], progress: 0, estimatedTime: 10, createdAt: Date.now() },
      ];
      expect(TaskService.getAssignableTasks(tasks)).toHaveLength(1);
      expect(TaskService.getAssignableTasks(tasks)[0].id).toBe('b');
    });

    it('should treat missing dependencies as blocking', () => {
      const tasks: Task[] = [
        { id: 'a', title: 'A', description: '', status: 'pending', priority: 'P1', dependencies: ['x'], progress: 0, estimatedTime: 10, createdAt: Date.now() },
      ];
      // Missing dependency 'x' should block the task, so no tasks are assignable
      expect(TaskService.getAssignableTasks(tasks)).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should calculate correct statistics', () => {
      const stats = TaskService.getStats(mockTasks);
      expect(stats.total).toBe(6);
      expect(stats.pending).toBe(2);
      expect(stats.inProgress).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.blocked).toBe(1);
      expect(stats.avgProgress).toBeCloseTo((0 + 50 + 100 + 0 + 30 + 0) / 6, 1);
      expect(stats.totalEstimatedTime).toBe(100 + 200 + 150 + 180 + 90 + 60);
      expect(stats.totalActualTime).toBe(120); // only t3 has actualTime
    });

    it('should handle empty task list', () => {
      const stats = TaskService.getStats([]);
      expect(stats.total).toBe(0);
      expect(stats.avgProgress).toBe(0);
    });
  });

  describe('sortByPriority', () => {
    it('should sort P0 first, P3 last', () => {
      const sorted = TaskService.sortByPriority(mockTasks);
      expect(sorted[0].priority).toBe('P0');
      expect(sorted[sorted.length - 1].priority).toBe('P3');
    });

    it('should not mutate original array', () => {
      const original = [...mockTasks];
      TaskService.sortByPriority(mockTasks);
      expect(mockTasks).toEqual(original);
    });
  });

  describe('hasCircularDependency', () => {
    it('should detect circular dependencies', () => {
      const circular: Task[] = [
        { id: 'a', title: 'A', description: '', status: 'pending', priority: 'P1', dependencies: ['b'], progress: 0, estimatedTime: 10, createdAt: Date.now() },
        { id: 'b', title: 'B', description: '', status: 'pending', priority: 'P1', dependencies: ['a'], progress: 0, estimatedTime: 10, createdAt: Date.now() },
      ];
      expect(TaskService.hasCircularDependency('a', circular)).toBe(true);
    });

    it('should return false for no circular dependencies', () => {
      expect(TaskService.hasCircularDependency('t1', mockTasks)).toBe(false);
    });

    it('should handle self-referencing', () => {
      const selfRef: Task[] = [
        { id: 'a', title: 'A', description: '', status: 'pending', priority: 'P1', dependencies: ['a'], progress: 0, estimatedTime: 10, createdAt: Date.now() },
      ];
      expect(TaskService.hasCircularDependency('a', selfRef)).toBe(true);
    });
  });

  describe('getCriticalPath', () => {
    it('should return a path of task IDs', () => {
      const path = TaskService.getCriticalPath(mockTasks);
      expect(path.length).toBeGreaterThan(0);
      expect(path).toContain('t1'); // P0, no deps, should be first
    });

    it('should respect dependency ordering', () => {
      const path = TaskService.getCriticalPath(mockTasks);
      const t1Index = path.indexOf('t1');
      const t2Index = path.indexOf('t2');
      const t4Index = path.indexOf('t4');
      // t2 depends on t1, so t1 should come before t2
      if (t1Index >= 0 && t2Index >= 0) {
        expect(t1Index).toBeLessThan(t2Index);
      }
      // t4 depends on t2 and t3
      if (t2Index >= 0 && t4Index >= 0) {
        expect(t2Index).toBeLessThan(t4Index);
      }
    });
  });
});
