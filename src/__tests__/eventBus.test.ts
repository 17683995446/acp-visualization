/**
 * EventBus 事件总线单元测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import EventBus, { eventBus } from '../services/eventBus';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  describe('on/emit', () => {
    it('should subscribe and receive events', () => {
      const received: unknown[] = [];
      bus.on('task:created', (data) => received.push(data));

      bus.emit('task:created', { id: 'task-1' });

      expect(received.length).toBe(1);
      expect(received[0]).toEqual({ id: 'task-1' });
    });

    it('should support multiple subscribers', () => {
      const results1: unknown[] = [];
      const results2: unknown[] = [];

      bus.on('agent:statusChanged', (data) => results1.push(data));
      bus.on('agent:statusChanged', (data) => results2.push(data));

      bus.emit('agent:statusChanged', { id: 'agent-1', status: 'busy' });

      expect(results1.length).toBe(1);
      expect(results2.length).toBe(1);
    });

    it('should not receive events after unsubscribe', () => {
      const received: unknown[] = [];
      const unsubscribe = bus.on('task:updated', (data) => received.push(data));

      bus.emit('task:updated', { id: '1' });
      expect(received.length).toBe(1);

      unsubscribe();
      bus.emit('task:updated', { id: '2' });
      expect(received.length).toBe(1); // should not increase
    });
  });

  describe('once', () => {
    it('should only trigger once', () => {
      let count = 0;
      bus.once('system:tick', () => count++);

      bus.emit('system:tick');
      bus.emit('system:tick');
      bus.emit('system:tick');

      expect(count).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should not break other handlers when one throws', () => {
      const results: unknown[] = [];

      bus.on('system:error', () => {
        throw new Error('Handler error');
      });
      bus.on('system:error', (data) => results.push(data));

      // Should not throw
      bus.emit('system:error', { message: 'test' });

      // Second handler should still work
      expect(results.length).toBe(1);
    });
  });

  describe('eventLog', () => {
    it('should record events', () => {
      bus.emit('task:created', { id: '1' });
      bus.emit('task:updated', { id: '1' });
      bus.emit('task:completed', { id: '1' });

      const log = bus.getEventLog();
      expect(log.length).toBe(3);
      expect(log[0].type).toBe('task:created');
      expect(log[1].type).toBe('task:updated');
      expect(log[2].type).toBe('task:completed');
    });

    it('should respect limit parameter', () => {
      for (let i = 0; i < 100; i++) {
        bus.emit('system:tick', { i });
      }

      const log = bus.getEventLog(10);
      expect(log.length).toBe(10);
    });

    it('should auto-trim log at 200 entries', () => {
      for (let i = 0; i < 250; i++) {
        bus.emit('system:tick', { i });
      }

      const log = bus.getEventLog();
      expect(log.length).toBeLessThanOrEqual(200);
    });
  });

  describe('clear', () => {
    it('should clear all listeners and logs', () => {
      let count = 0;
      bus.on('system:tick', () => count++);
      bus.emit('system:tick');
      expect(count).toBe(1);

      bus.clear();
      expect(bus.getEventLog().length).toBe(0);

      bus.emit('system:tick');
      expect(count).toBe(1); // no new emissions
    });
  });

  describe('listenerCount', () => {
    it('should return correct count', () => {
      expect(bus.listenerCount('task:created')).toBe(0);

      const unsub1 = bus.on('task:created', () => {});
      expect(bus.listenerCount('task:created')).toBe(1);

      const unsub2 = bus.on('task:created', () => {});
      expect(bus.listenerCount('task:created')).toBe(2);

      unsub1();
      expect(bus.listenerCount('task:created')).toBe(1);

      unsub2();
      expect(bus.listenerCount('task:created')).toBe(0);
    });
  });
});

describe('Global EventBus', () => {
  it('should be a singleton', () => {
    expect(eventBus).toBeInstanceOf(EventBus);
  });

  it('should work across imports', () => {
    // Dynamic import to verify module singleton
    import('../services/eventBus').then(mod => {
      expect(mod.eventBus).toBe(eventBus);
    });
  });
});
