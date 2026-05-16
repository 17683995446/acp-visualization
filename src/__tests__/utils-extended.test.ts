/**
 * 工具函数和中间件扩展测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatDateTime, formatDuration, clamp } from '../utils/format';
import { exportData, downloadJSON } from '../utils/export';
import { generateId, calculateStats } from '../store/helpers';
import { persistMiddleware } from '../store/persistMiddleware';
import type { Member, Task, Message } from '../types';

// ============ format.ts 扩展测试 ============

describe('format.ts (Extended)', () => {
  describe('formatDateTime', () => {
    it('should handle different timestamp values', () => {
      // Unix epoch
      expect(formatDateTime(0)).toBe('1970-01-01 00:00');

      // A specific known date
      const ts = new Date(2025, 5, 15, 14, 30).getTime(); // June 15, 2025 14:30
      expect(formatDateTime(ts)).toBe('2025-06-15 14:30');
    });

    it('should zero-pad month, day, hour, and minute', () => {
      // January 1st, midnight
      const ts = new Date(2024, 0, 1, 0, 5).getTime();
      expect(formatDateTime(ts)).toBe('2024-01-01 00:05');
    });

    it('should handle large timestamps (far future)', () => {
      const farFuture = new Date(2099, 11, 31, 23, 59).getTime();
      expect(formatDateTime(farFuture)).toBe('2099-12-31 23:59');
    });
  });

  describe('formatDuration', () => {
    it('should handle edge case of 0 minutes', () => {
      expect(formatDuration(0)).toBe('<1m');
    });

    it('should handle negative values', () => {
      // Negative minutes - function doesn't explicitly handle this,
      // but we test the actual behavior
      expect(formatDuration(-10)).toBe('<1m');
    });

    it('should handle very large values', () => {
      expect(formatDuration(600)).toBe('10h');
      expect(formatDuration(1440)).toBe('24h');
      expect(formatDuration(1500)).toBe('25h');
    });

    it('should format minutes only', () => {
      expect(formatDuration(30)).toBe('30m');
      expect(formatDuration(1)).toBe('1m');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(61)).toBe('1h 1m');
    });
  });

  describe('clamp', () => {
    it('should clamp value below min to min', () => {
      expect(clamp(-5, 0, 100)).toBe(0);
      expect(clamp(-100, -50, 50)).toBe(-50);
    });

    it('should clamp value above max to max', () => {
      expect(clamp(150, 0, 100)).toBe(100);
      expect(clamp(999, 0, 1)).toBe(1);
    });

    it('should return value when within range', () => {
      expect(clamp(50, 0, 100)).toBe(50);
      expect(clamp(0, 0, 100)).toBe(0);
      expect(clamp(100, 0, 100)).toBe(100);
    });

    it('should handle min equal to max', () => {
      expect(clamp(50, 42, 42)).toBe(42);
    });
  });
});

// ============ export.ts 扩展测试 ============

describe('export.ts (Extended)', () => {
  const mockData = {
    organization: {
      id: 'org1',
      name: 'Test Org',
      type: 'corporate' as const,
      mission: 'Test',
      members: [],
      departments: [],
      performance: { tasksCompleted: 0, avgQuality: 0, onTimeRate: 0, tokenUsage: 0, cost: 0 },
    },
    tasks: [],
    messages: [],
    knowledgeNodes: [],
    evaluation: {
      totalScore: 80,
      rating: 'good' as const,
      scores: [],
      strengths: [],
      weaknesses: [],
      recommendations: [],
    },
    evaluationScores: [],
  };

  describe('exportData', () => {
    it('should serialize data to JSON string', () => {
      const result = exportData(mockData);
      const parsed = JSON.parse(result);
      expect(parsed).toBeDefined();
      expect(parsed.organization).toEqual(mockData.organization);
      expect(parsed.tasks).toEqual([]);
      expect(parsed.messages).toEqual([]);
    });

    it('should include version field', () => {
      const result = exportData(mockData);
      const parsed = JSON.parse(result);
      expect(parsed.version).toBe('2.0.0');
    });

    it('should include exportedAt timestamp', () => {
      const before = new Date();
      const result = exportData(mockData);
      const parsed = JSON.parse(result);
      const after = new Date();
      const exportedAt = new Date(parsed.exportedAt);
      expect(exportedAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
      expect(exportedAt.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
    });

    it('should produce pretty-printed JSON', () => {
      const result = exportData(mockData);
      // Pretty-printed JSON has newlines
      expect(result).toContain('\n');
    });
  });

  describe('downloadJSON', () => {
    let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
    let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      // jsdom doesn't implement URL.createObjectURL, so we need to define it first
      if (typeof URL.createObjectURL !== 'function') {
        URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      }
      if (typeof URL.revokeObjectURL !== 'function') {
        URL.revokeObjectURL = vi.fn();
      }
      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL' as any).mockReturnValue('blob:mock-url');
      revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL' as any).mockImplementation(() => {});
    });

    afterEach(() => {
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });

    it('should create a blob with correct content type', () => {
      const OriginalBlob = globalThis.Blob;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blobSpy = vi.fn(function(this: Blob, parts: any[], options?: any) {
        return new OriginalBlob(parts, options);
      });
      globalThis.Blob = blobSpy as any;

      downloadJSON('{"test": true}', 'test.json');

      expect(blobSpy).toHaveBeenCalledWith(
        ['{"test": true}'],
        { type: 'application/json' }
      );
      globalThis.Blob = OriginalBlob;
    });

    it('should create an anchor element and trigger click', () => {
      const clickSpy = vi.fn();
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
        if (node instanceof HTMLAnchorElement) {
          node.click = clickSpy;
        }
        return node;
      });
      const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

      downloadJSON('{}', 'export.json');

      expect(clickSpy).toHaveBeenCalled();
      expect(appendSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();

      appendSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it('should set the download filename', () => {
      let capturedAnchor: HTMLAnchorElement | null = null;
      const origCreateElement = document.createElement.bind(document);
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = origCreateElement(tag);
        if (tag === 'a') {
          capturedAnchor = el as HTMLAnchorElement;
          // Override click to prevent jsdom navigation error
          el.click = vi.fn();
        }
        return el;
      });

      downloadJSON('{}', 'my-export.json');

      expect(capturedAnchor).not.toBeNull();
      expect(capturedAnchor!.download).toBe('my-export.json');
      expect(capturedAnchor!.href).toBe('blob:mock-url');

      createElementSpy.mockRestore();
    });
  });
});

// ============ persistMiddleware 扩展测试 ============

describe('persistMiddleware (Extended)', () => {
  const STORAGE_KEY = 'acp-store-v1';

  beforeEach(() => {
    localStorage.clear();
  });

  it('should call localStorage.setItem on state change', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    // Create a minimal mock store
    const initialState: any = {
      organization: { id: 'o1', name: 'Org', type: 'corporate', mission: '', members: [], departments: [], performance: { tasksCompleted: 0, avgQuality: 0, onTimeRate: 0, tokenUsage: 0, cost: 0 } },
      tasks: [],
      messages: [],
      knowledgeNodes: [],
      evaluation: { totalScore: 0, rating: 'needs_improvement', scores: [], strengths: [], weaknesses: [], recommendations: [] },
      evaluationScores: [],
    };

    const mockSet = vi.fn();
    const mockGet = vi.fn(() => initialState);
    const mockApi = {
      subscribe: vi.fn((cb: any) => {
        // Immediately trigger the callback to simulate state change
        cb(initialState);
      }),
      getState: mockGet,
    };

    const config = vi.fn(() => ({})) as any;

    // Activate fake timers before calling middleware (it schedules setTimeout internally)
    vi.useFakeTimers();
    persistMiddleware(config)(mockSet as any, mockGet as any, mockApi as any);

    // persistMiddleware now debounces localStorage writes (500ms)
    vi.advanceTimersByTime(600);
    vi.useRealTimers();

    expect(setItemSpy).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.any(String)
    );

    setItemSpy.mockRestore();
  });

  it('should read from localStorage on initialization', () => {
    const storedState = {
      organization: { id: 'o2', name: 'Stored Org', type: 'corporate', mission: '', members: [], departments: [], performance: { tasksCompleted: 5, avgQuality: 90, onTimeRate: 95, tokenUsage: 500, cost: 50 } },
      tasks: [{ id: 't1' }],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedState));

    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

    const mockSet = vi.fn();
    const mockGet = vi.fn(() => ({
      organization: { id: 'o1', name: 'Default', type: 'corporate', mission: '', members: [], departments: [], performance: { tasksCompleted: 0, avgQuality: 0, onTimeRate: 0, tokenUsage: 0, cost: 0 } },
      tasks: [],
      messages: [],
      knowledgeNodes: [],
      evaluation: { totalScore: 0, rating: 'needs_improvement', scores: [], strengths: [], weaknesses: [], recommendations: [] },
      evaluationScores: [],
    }));
    const mockApi = {
      subscribe: vi.fn(),
      getState: mockGet,
    };

    const config = vi.fn(() => ({})) as any;

    // Activate fake timers before calling middleware (it schedules setTimeout internally)
    vi.useFakeTimers();
    persistMiddleware(config)(mockSet as any, mockGet as any, mockApi as any);

    // persistMiddleware loads persisted data in a setTimeout(0)
    vi.advanceTimersByTime(0);
    vi.useRealTimers();

    expect(getItemSpy).toHaveBeenCalledWith(STORAGE_KEY);
    // Now uses api.setState() instead of set()
    expect(mockApi.getState).toHaveBeenCalled();

    getItemSpy.mockRestore();
  });

  it('should handle corrupted localStorage data gracefully', () => {
    localStorage.setItem(STORAGE_KEY, 'this is not valid json {{{');

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockSet = vi.fn();
    const mockGet = vi.fn(() => ({
      organization: { id: 'o1', name: 'Default', type: 'corporate', mission: '', members: [], departments: [], performance: { tasksCompleted: 0, avgQuality: 0, onTimeRate: 0, tokenUsage: 0, cost: 0 } },
      tasks: [],
      messages: [],
      knowledgeNodes: [],
      evaluation: { totalScore: 0, rating: 'needs_improvement', scores: [], strengths: [], weaknesses: [], recommendations: [] },
      evaluationScores: [],
    }));
    const mockApi = {
      subscribe: vi.fn(),
      getState: mockGet,
    };

    const config = vi.fn(() => ({})) as any;

    // Activate fake timers before calling middleware (it schedules setTimeout internally)
    vi.useFakeTimers();

    // Should not throw
    expect(() => {
      persistMiddleware(config)(mockSet as any, mockGet as any, mockApi as any);
    }).not.toThrow();

    // persistMiddleware loads persisted data in a setTimeout(0)
    vi.advanceTimersByTime(0);
    vi.useRealTimers();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

// ============ helpers.ts 扩展测试 ============

describe('helpers.ts (Extended)', () => {
  describe('calculateStats', () => {
    it('should return correct activeAgents count', () => {
      const members: Member[] = [
        { id: 'm1', name: 'A', role: 'senior', level: 5, reputation: 80, capabilities: [], status: 'idle' },
        { id: 'm2', name: 'B', role: 'mid', level: 3, reputation: 70, capabilities: [], status: 'busy' },
        { id: 'm3', name: 'C', role: 'junior', level: 1, reputation: 60, capabilities: [], status: 'offline' },
        { id: 'm4', name: 'D', role: 'senior', level: 4, reputation: 90, capabilities: [], status: 'idle' },
      ];
      const tasks: Task[] = [];
      const messages: Message[] = [];

      const stats = calculateStats(members, tasks, messages);
      // activeAgents = members not offline = 3 (idle + busy)
      expect(stats.activeAgents).toBe(3);
      expect(stats.busyAgents).toBe(1);
      expect(stats.idleAgents).toBe(2);
      expect(stats.offlineAgents).toBe(1);
    });

    it('should handle empty arrays', () => {
      const stats = calculateStats([], [], []);
      expect(stats.activeAgents).toBe(0);
      expect(stats.busyAgents).toBe(0);
      expect(stats.idleAgents).toBe(0);
      expect(stats.offlineAgents).toBe(0);
      expect(stats.activeTasks).toBe(0);
      expect(stats.completedTasks).toBe(0);
      expect(stats.pendingTasks).toBe(0);
      expect(stats.failedTasks).toBe(0);
      expect(stats.avgProgress).toBe(0);
      expect(stats.totalMessages).toBe(0);
    });

    it('should calculate correct task counts', () => {
      const members: Member[] = [];
      const tasks: Task[] = [
        { id: 't1', title: 'A', description: '', status: 'in_progress', priority: 'P1', dependencies: [], progress: 50, estimatedTime: 100, createdAt: Date.now() },
        { id: 't2', title: 'B', description: '', status: 'completed', priority: 'P1', dependencies: [], progress: 100, estimatedTime: 100, createdAt: Date.now() },
        { id: 't3', title: 'C', description: '', status: 'pending', priority: 'P1', dependencies: [], progress: 0, estimatedTime: 100, createdAt: Date.now() },
        { id: 't4', title: 'D', description: '', status: 'failed', priority: 'P1', dependencies: [], progress: 30, estimatedTime: 100, createdAt: Date.now() },
        { id: 't5', title: 'E', description: '', status: 'in_progress', priority: 'P1', dependencies: [], progress: 70, estimatedTime: 100, createdAt: Date.now() },
      ];
      const messages: Message[] = [];

      const stats = calculateStats(members, tasks, messages);
      expect(stats.activeTasks).toBe(2);
      expect(stats.completedTasks).toBe(1);
      expect(stats.pendingTasks).toBe(1);
      expect(stats.failedTasks).toBe(1);
      expect(stats.avgProgress).toBeCloseTo((50 + 100 + 0 + 30 + 70) / 5, 1);
    });
  });

  describe('generateId', () => {
    it('should produce unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId('test'));
      }
      expect(ids.size).toBe(100);
    });

    it('should include the prefix', () => {
      const id = generateId('agent');
      expect(id.startsWith('agent-')).toBe(true);
    });

    it('should produce IDs with consistent format', () => {
      const id = generateId('task');
      // Format: prefix-XXXXXXXX (8 hex chars from uuid slice)
      expect(id).toMatch(/^task-[a-f0-9]{8}$/);
    });
  });
});
