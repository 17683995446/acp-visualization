import { useMemo } from 'react';
import type { Task, TaskStatus } from '../types';

export function useFilteredTasks(tasks: Task[], statusFilter: TaskStatus | 'all', searchQuery: string) {
  return useMemo(() => {
    let filtered = tasks;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [tasks, statusFilter, searchQuery]);
}
