import type { Task, TaskStatus } from '../types';
import type { TaskStats } from './interfaces';

export class TaskService {
  /**
   * Get all tasks filtered by status
   */
  static filterByStatus(tasks: Task[], status: TaskStatus): Task[] {
    return tasks.filter(t => t.status === status);
  }

  /**
   * Get tasks that can be assigned (pending + dependencies met)
   */
  static getAssignableTasks(tasks: Task[]): Task[] {
    return tasks.filter(t =>
      t.status === 'pending' &&
      t.dependencies.every(depId => {
        const dep = tasks.find(dt => dt.id === depId);
        return dep && dep.status === 'completed';
      })
    );
  }

  /**
   * Calculate task statistics
   */
  static getStats(tasks: Task[]): TaskStats {
    const total = tasks.length;
    if (total === 0) {
      return { total: 0, pending: 0, inProgress: 0, completed: 0, failed: 0, blocked: 0, avgProgress: 0, totalEstimatedTime: 0, totalActualTime: 0 };
    }
    const acc = tasks.reduce((a, t) => {
      const statusKey = t.status as keyof typeof a;
      if (statusKey in a && typeof a[statusKey] === 'number') {
        (a as Record<string, number>)[statusKey]++;
      }
      a.progressSum += t.progress;
      a.estimatedTimeSum += t.estimatedTime;
      a.actualTimeSum += t.actualTime ?? 0;
      return a;
    }, { pending: 0, in_progress: 0, completed: 0, failed: 0, blocked: 0, scheduled: 0, progressSum: 0, estimatedTimeSum: 0, actualTimeSum: 0 } as Record<string, number>);
    return {
      total,
      pending: acc.pending,
      inProgress: acc.in_progress,
      completed: acc.completed,
      failed: acc.failed,
      blocked: acc.blocked,
      avgProgress: acc.progressSum / total,
      totalEstimatedTime: acc.estimatedTimeSum,
      totalActualTime: acc.actualTimeSum,
    };
  }

  /**
   * Sort tasks by priority
   */
  static sortByPriority(tasks: Task[]): Task[] {
    const order: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
    return [...tasks].sort((a, b) => (order[a.priority] ?? 4) - (order[b.priority] ?? 4));
  }

  /**
   * Check if a task has circular dependencies
   */
  static hasCircularDependency(taskId: string, tasks: Task[]): boolean {
    const visited = new Set<string>();
    const stack = new Set<string>();

    const dfs = (id: string): boolean => {
      if (stack.has(id)) return true;
      if (visited.has(id)) return false;
      visited.add(id);
      stack.add(id);

      const task = tasks.find(t => t.id === id);
      if (task) {
        for (const dep of task.dependencies) {
          if (dfs(dep)) return true;
        }
      }
      stack.delete(id);
      return false;
    };

    return dfs(taskId);
  }

  /**
   * Get the critical path (longest chain of dependent tasks)
   */
  static getCriticalPath(tasks: Task[]): string[] {
    const completedIds = new Set(tasks.filter(t => t.status === 'completed').map(t => t.id));
    const pending = tasks.filter(t => t.status !== 'completed');

    // Topological sort
    const inDegree = new Map<string, number>();
    pending.forEach(t => inDegree.set(t.id, t.dependencies.filter(d => !completedIds.has(d)).length));

    const queue = pending.filter(t => (inDegree.get(t.id) ?? 0) === 0);
    const path: string[] = [];

    while (queue.length > 0) {
      queue.sort((a, b) => b.estimatedTime - a.estimatedTime);
      const task = queue.shift()!;
      path.push(task.id);

      pending.filter(t => t.dependencies.includes(task.id)).forEach(t => {
        const deg = (inDegree.get(t.id) ?? 1) - 1;
        inDegree.set(t.id, deg);
        if (deg === 0) queue.push(t);
      });
    }

    return path;
  }
}
