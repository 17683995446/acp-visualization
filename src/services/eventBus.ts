/**
 * ACP 事件总线 - 基于 TypeScript 的发布/订阅系统
 * 参考 Claude Code Best 的 coordinator 模式和 MCP 通信机制
 */

type EventCallback = (...args: unknown[]) => void;

export type EventType =
  // 任务事件
  | 'task:created'
  | 'task:updated'
  | 'task:completed'
  | 'task:failed'
  | 'task:deleted'
  | 'task:assigned'
  | 'task:unassigned'
  // Agent 事件
  | 'agent:statusChanged'
  | 'agent:reputationChanged'
  | 'agent:joined'
  | 'agent:left'
  // 组织事件
  | 'org:memberAdded'
  | 'org:memberRemoved'
  | 'org:departmentCreated'
  // 消息事件
  | 'message:sent'
  | 'message:received'
  // 系统事件
  | 'system:tick'
  | 'system:simulationStarted'
  | 'system:simulationStopped'
  | 'system:error'
  // 模拟引擎事件
  | 'simulation:tick';

interface EventMap {
  [key: string]: Set<EventCallback>;
}

class EventBus {
  private listeners: EventMap = {};
  private maxListeners: number = 50;
  private eventLog: Array<{ type: EventType; timestamp: number; data?: unknown }> = [];
  private _emittingTypes: Set<string> = new Set();

  /**
   * 订阅事件
   */
  on(event: EventType, callback: EventCallback): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }

    if (this.listeners[event].size >= this.maxListeners) {
      throw new Error(`[EventBus] Max listeners (${this.maxListeners}) reached for event: ${event}`);
    }

    this.listeners[event].add(callback);

    // 返回取消订阅函数
    return () => this.off(event, callback);
  }

  /**
   * 订阅事件（仅触发一次）
   */
  once(event: EventType, callback: EventCallback): () => void {
    const unsubscribe = this.on(event, (...args) => {
      unsubscribe();
      callback(...args);
    });
    return unsubscribe;
  }

  /**
   * 取消订阅
   */
  off(event: EventType, callback: EventCallback): void {
    if (this.listeners[event]) {
      this.listeners[event].delete(callback);
    }
  }

  /**
   * 发布事件
   */
  emit(event: EventType, data?: unknown): void {
    // 记录事件日志
    this.eventLog.push({ type: event, timestamp: Date.now(), data });
    if (this.eventLog.length > 200) {
      this.eventLog = this.eventLog.slice(-100);
    }

    const callbacks = this.listeners[event];
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(data);
        } catch (error) {
          console.error(`[EventBus] Error in handler for "${event}":`, error);
          // Avoid infinite recursion: don't emit system:error while already emitting the same event type
          if (!this._emittingTypes.has(event) && event !== 'system:error') {
            this._emittingTypes.add(event);
            try {
              this.emit('system:error', { event, error });
            } finally {
              this._emittingTypes.delete(event);
            }
          }
        }
      });
    }
  }

  /**
   * 获取事件日志
   */
  getEventLog(limit: number = 50): Array<{ type: EventType; timestamp: number; data?: unknown }> {
    return this.eventLog.slice(-limit);
  }

  /**
   * 清除所有监听器
   */
  clear(): void {
    this.listeners = {};
    this.eventLog = [];
  }

  /**
   * 获取指定事件的监听器数量
   */
  listenerCount(event: EventType): number {
    return this.listeners[event]?.size ?? 0;
  }
}

// 全局单例
export const eventBus = new EventBus();
export default EventBus;
