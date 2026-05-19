/**
 * EvaluationRadarChart - 多维度评估雷达图
 * 展示各维度当前得分与满分对比
 */
import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
} from 'recharts';
import type { Score } from '../../types';

interface EvaluationRadarChartProps {
  scores: Score[];
  size?: 'sm' | 'md' | 'lg';
  title?: string;
}

const SIZE_MAP = {
  sm: 220,
  md: 300,
  lg: 400,
};

const CustomTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
}) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 text-sm">
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center space-x-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600 dark:text-gray-300">
            {entry.name === 'current' ? '当前得分' : '满分'}: {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const EvaluationRadarChart: React.FC<EvaluationRadarChartProps> = ({
  scores,
  size = 'md',
  title = '评估雷达图',
}) => {
  const data = useMemo(() => {
    if (!scores || !Array.isArray(scores)) return [];
    return scores.map((score) => ({
      dimension: score.dimension,
      current: score.value,
      max: score.max,
    }));
  }, [scores]);

  const chartSize = SIZE_MAP[size];

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          {title}
        </h3>
      )}
      <div style={{ width: '100%', height: chartSize, minWidth: 200, minHeight: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid
              stroke="#d1d5db"
              className="dark:stroke-gray-600"
            />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              className="dark:text-gray-300"
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 'auto']}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              className="dark:text-gray-400"
            />
            <Radar
              name="max"
              dataKey="max"
              stroke="#9ca3af"
              fill="#9ca3af"
              fillOpacity={0.05}
              strokeDasharray="5 5"
              strokeWidth={1}
            />
            <Radar
              name="current"
              dataKey="current"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.25}
              strokeWidth={2}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value: string) =>
                value === 'current' ? '当前得分' : '满分'
              }
              wrapperStyle={{ fontSize: 12, color: '#6b7280' }}
              className="dark:text-gray-300"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
