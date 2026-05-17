/**
 * AgentUtilizationChart - Agent 状态分布环形图
 * 展示 idle / busy / offline 的比例
 */
import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import type { Member } from '../../types';

interface AgentUtilizationChartProps {
  members: Member[];
  title?: string;
}

interface SegmentData {
  name: string;
  value: number;
  color: string;
}

const COLORS: Record<string, string> = {
  idle: '#22c55e',
  busy: '#3b82f6',
  offline: '#9ca3af',
};

const LABELS: Record<string, string> = {
  idle: '空闲',
  busy: '忙碌',
  offline: '离线',
};

const CustomTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: SegmentData }>;
}) => {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 text-sm">
      <div className="flex items-center space-x-2">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: item.payload.color }}
        />
        <span className="text-gray-900 dark:text-white font-medium">
          {LABELS[item.name] ?? item.name}
        </span>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mt-1">{item.value} 个 Agent</p>
    </div>
  );
};

export const AgentUtilizationChart: React.FC<AgentUtilizationChartProps> = ({ members, title = 'Agent 状态分布' }) => {
  const data = useMemo<SegmentData[]>(() => {
    const idle = members.filter(m => m.status === 'idle').length;
    const busy = members.filter(m => m.status === 'busy').length;
    const offline = members.filter(m => m.status === 'offline').length;

    const segments: SegmentData[] = [];
    if (idle > 0) segments.push({ name: 'idle', value: idle, color: COLORS.idle });
    if (busy > 0) segments.push({ name: 'busy', value: busy, color: COLORS.busy });
    if (offline > 0) segments.push({ name: 'offline', value: offline, color: COLORS.offline });

    // If no members, show a placeholder
    if (segments.length === 0) {
      segments.push({ name: 'offline', value: 1, color: COLORS.offline });
    }

    return segments;
  }, [members]);

  const total = members.length;

  // Calculate center label
  const centerLabel = useMemo(() => {
    if (total === 0) return '0';
    return String(total);
  }, [total]);

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          {title}
        </h3>
      )}
      <div className="w-full h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center text overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{centerLabel}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">总 Agent</p>
          </div>
        </div>
      </div>
      {/* Custom legend */}
      <div className="flex items-center justify-center space-x-4 mt-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center space-x-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              {LABELS[entry.name] ?? entry.name} ({entry.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
