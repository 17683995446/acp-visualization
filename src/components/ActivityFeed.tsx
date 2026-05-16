/**
 * ActivityFeed 活动动态组件
 * 订阅 EventBus 事件，展示最近的活动记录
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Activity,
  Trash2,
  PlusCircle,
  CheckCircle,
  UserPlus,
  MessageSquare,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { eventBus } from '../services/eventBus';
import type { EventType } from '../services/eventBus';

export interface ActivityItem {
  id: string;
  type: 'task_created' | 'task_completed' | 'task_assigned' | 'member_joined' | 'message_sent' | 'status_changed';
  message: string;
  timestamp: number;
  icon: string;
}

// 事件类型到活动类型的映射
const EVENT_TO_ACTIVITY: Partial<Record<EventType, { type: ActivityItem['type']; icon: string; buildMessage: (data: unknown) => string }>> = {
  'task:created': {
    type: 'task_created',
    icon: 'PlusCircle',
    buildMessage: (data) => {
      const task = data as { title?: string };
      return `新任务创建: ${task.title ?? '未知任务'}`;
    },
  },
  'task:completed': {
    type: 'task_completed',
    icon: 'CheckCircle',
    buildMessage: (data) => {
      const task = data as { title?: string };
      return `任务完成: ${task.title ?? '未知任务'}`;
    },
  },
  'task:assigned': {
    type: 'task_assigned',
    icon: 'UserPlus',
    buildMessage: (data) => {
      const info = data as { taskId?: string; memberId?: string };
      return `任务已分配 (ID: ${info.taskId ?? '?'})`;
    },
  },
  'org:memberAdded': {
    type: 'member_joined',
    icon: 'UserPlus',
    buildMessage: (data) => {
      const member = data as { name?: string; role?: string };
      return `新成员加入: ${member.name ?? '未知'} (${member.role ?? '?'})`;
    },
  },
  'message:sent': {
    type: 'message_sent',
    icon: 'MessageSquare',
    buildMessage: () => '发送了一条消息',
  },
  'agent:statusChanged': {
    type: 'status_changed',
    icon: 'RefreshCw',
    buildMessage: (data) => {
      const info = data as { id?: string; status?: string };
      return `Agent 状态变更: ${info.status ?? '未知'}`;
    },
  },
};

// 图标名称到组件的映射
const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  PlusCircle,
  CheckCircle,
  UserPlus,
  MessageSquare,
  RefreshCw,
  AlertCircle,
};

// 活动类型对应的颜色
const ACTIVITY_COLORS: Record<ActivityItem['type'], string> = {
  task_created: 'text-blue-500',
  task_completed: 'text-green-500',
  task_assigned: 'text-purple-500',
  member_joined: 'text-cyan-500',
  message_sent: 'text-orange-500',
  status_changed: 'text-yellow-500',
};

// 格式化相对时间
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 5) return '刚刚';
  if (seconds < 60) return `${seconds}秒前`;
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return `${days}天前`;
}

const MAX_ACTIVITIES = 20;

const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const feedEndRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);

  // 自动滚动到最新
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activities]);

  // 订阅所有事件
  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    const eventTypes: EventType[] = [
      'task:created',
      'task:completed',
      'task:assigned',
      'org:memberAdded',
      'message:sent',
      'agent:statusChanged',
    ];

    eventTypes.forEach((eventType) => {
      const unsub = eventBus.on(eventType, (data) => {
        const mapping = EVENT_TO_ACTIVITY[eventType];
        if (!mapping) return;

        const item: ActivityItem = {
          id: `activity-${++idCounter.current}-${Date.now()}`,
          type: mapping.type,
          message: mapping.buildMessage(data),
          timestamp: Date.now(),
          icon: mapping.icon,
        };

        setActivities((prev) => [...prev, item].slice(-MAX_ACTIVITIES));
      });
      unsubscribers.push(unsub);
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  const handleClear = useCallback(() => {
    setActivities([]);
  }, []);

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            活动动态
          </span>
          {activities.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 rounded-full">
              {activities.length}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {!isCollapsed && activities.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title="清除"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Collapsible content */}
      {!isCollapsed && (
        <div className="bg-white dark:bg-gray-800">
          {activities.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Activity className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">暂无活动记录</p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">启动模拟引擎以查看实时动态</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {activities.map((item) => {
                  const IconComponent = ICON_MAP[item.icon] ?? AlertCircle;
                  const colorClass = ACTIVITY_COLORS[item.type] ?? 'text-gray-500';

                  return (
                    <div
                      key={item.id}
                      className="flex items-start space-x-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <IconComponent className={`w-4 h-4 mt-0.5 shrink-0 ${colorClass}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {item.message}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 whitespace-nowrap">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div ref={feedEndRef} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
