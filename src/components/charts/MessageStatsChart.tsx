/**
 * MessageStatsChart - 消息类型统计柱状图
 * 按消息类型(task/notification/request/response)分组展示数量
 */
import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import type { Message } from '../../types';

interface MessageStatsChartProps {
  messages: Message[];
  title?: string;
}

interface BarDataPoint {
  type: string;
  label: string;
  count: number;
  fill: string;
}

const TYPE_CONFIG: Record<string, { label: string; fill: string }> = {
  task: { label: '任务', fill: '#3b82f6' },
  notification: { label: '通知', fill: '#8b5cf6' },
  request: { label: '请求', fill: '#f59e0b' },
  response: { label: '响应', fill: '#22c55e' },
};

const CustomTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: BarDataPoint }>;
}) => {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-900 dark:text-white">{item.payload.label}</p>
      <p className="text-gray-600 dark:text-gray-300 mt-1">{item.payload.count} 条消息</p>
    </div>
  );
};

export const MessageStatsChart: React.FC<MessageStatsChartProps> = ({ messages, title = '消息类型统计' }) => {
  const data = useMemo<BarDataPoint[]>(() => {
    const counts: Record<string, number> = {
      task: 0,
      notification: 0,
      request: 0,
      response: 0,
    };

    for (const msg of (messages ?? [])) {
      if (counts[msg.type] !== undefined) {
        counts[msg.type]++;
      }
    }

    return Object.entries(TYPE_CONFIG).map(([type, config]) => ({
      type,
      label: config.label,
      count: counts[type],
      fill: config.fill,
    }));
  }, [messages]);

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          {title}
        </h3>
      )}
      <div style={{ width: '100%', height: 256, minWidth: 200, minHeight: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-gray-200 dark:stroke-gray-600"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              className="text-gray-500 dark:text-gray-400"
              stroke="currentColor"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-gray-500 dark:text-gray-400"
              stroke="currentColor"
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(156, 163, 175, 0.1)' }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {data.map((entry) => (
                <Cell key={entry.type} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
