import { describe, it, expect } from 'vitest';
import { demoOrganization, demoTasks, evaluation, evaluationScores } from '../data/demo';

describe('Demo Data', () => {
  describe('Organization', () => {
    it('should have valid organization structure', () => {
      expect(demoOrganization.id).toBeDefined();
      expect(demoOrganization.name).toBe('ACP Demo Corp');
      expect(demoOrganization.type).toBe('hybrid');
      expect(demoOrganization.members.length).toBeGreaterThan(0);
      expect(demoOrganization.departments.length).toBeGreaterThan(0);
    });

    it('should have valid members', () => {
      demoOrganization.members.forEach(member => {
        expect(member.id).toBeDefined();
        expect(member.name).toBeDefined();
        expect(member.role).toBeDefined();
        expect(member.level).toBeGreaterThanOrEqual(1);
        expect(member.level).toBeLessThanOrEqual(8);
        expect(member.reputation).toBeGreaterThanOrEqual(0);
        expect(member.reputation).toBeLessThanOrEqual(100);
      });
    });

    it('should have CEO in members', () => {
      const ceo = demoOrganization.members.find(m => m.role === 'ceo');
      expect(ceo).toBeDefined();
      expect(ceo?.level).toBe(8);
    });

    it('should have valid departments', () => {
      demoOrganization.departments.forEach(dept => {
        expect(dept.id).toBeDefined();
        expect(dept.name).toBeDefined();
        expect(dept.head).toBeDefined();
        expect(dept.members.length).toBeGreaterThan(0);
        expect(dept.budget).toBeGreaterThan(0);
      });
    });

    it('should have department heads that are members', () => {
      demoOrganization.departments.forEach(dept => {
        const headExists = demoOrganization.members.some(m => m.id === dept.head);
        expect(headExists).toBe(true);
      });
    });
  });

  describe('Tasks', () => {
    it('should have valid tasks', () => {
      expect(demoTasks.length).toBeGreaterThan(0);
      
      demoTasks.forEach(task => {
        expect(task.id).toBeDefined();
        expect(task.title).toBeDefined();
        expect(task.status).toBeDefined();
        expect(task.priority).toMatch(/^P[0-3]$/);
        expect(task.progress).toBeGreaterThanOrEqual(0);
        expect(task.progress).toBeLessThanOrEqual(100);
        expect(task.estimatedTime).toBeGreaterThan(0);
      });
    });

    it('should have valid task assignees', () => {
      demoTasks.forEach(task => {
        if (task.assignee) {
          const assigneeExists = demoOrganization.members.some(m => m.id === task.assignee);
          expect(assigneeExists).toBe(true);
        }
      });
    });

    it('should have valid task dependencies', () => {
      const taskIds = new Set(demoTasks.map(t => t.id));
      
      demoTasks.forEach(task => {
        task.dependencies.forEach(depId => {
          expect(taskIds.has(depId)).toBe(true);
        });
      });
    });

    it('should have at least one in-progress task', () => {
      const inProgress = demoTasks.filter(t => t.status === 'in_progress');
      expect(inProgress.length).toBeGreaterThan(0);
    });
  });

  describe('Evaluation', () => {
    it('should have valid total score', () => {
      expect(evaluation.totalScore).toBeGreaterThanOrEqual(0);
      expect(evaluation.totalScore).toBeLessThanOrEqual(100);
    });

    it('should have valid rating', () => {
      const validRatings = ['exceptional', 'excellent', 'good', 'acceptable', 'needs_improvement'];
      expect(validRatings).toContain(evaluation.rating);
    });

    it('should have correct score weights', () => {
      const totalWeight = evaluationScores.reduce((sum, s) => sum + s.weight, 0);
      expect(totalWeight).toBeCloseTo(1, 1);
    });

    it('should have scores within valid range', () => {
      evaluationScores.forEach(score => {
        expect(score.value).toBeGreaterThanOrEqual(0);
        expect(score.value).toBeLessThanOrEqual(score.max);
      });
    });

    it('should have non-empty strengths', () => {
      expect(evaluation.strengths.length).toBeGreaterThan(0);
    });

    it('should have non-empty weaknesses', () => {
      expect(evaluation.weaknesses.length).toBeGreaterThan(0);
    });

    it('should have non-empty recommendations', () => {
      expect(evaluation.recommendations.length).toBeGreaterThan(0);
    });
  });
});
