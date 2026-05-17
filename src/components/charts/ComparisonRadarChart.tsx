/**
 * ComparisonRadarChart - 多方案对比雷达图
 * 在同一雷达图上叠加多个方案的评分数据
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

interface ComparisonRadarChartProps {
  solutions: Array<{
    name: string;
    color: string;
    scores: Array<{ dimension: string; value: number; max: number }>;
  }>;
  title?: string;
}

interface RadarDataPoint {
  dimension: string;
  max: number;
  [key: string]: string | number;
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-900 dark:text-white mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center space-x-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600 dark:text-gray-300">
            {entry.name}: {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const ComparisonRadarChart: React.FC<ComparisonRadarChartProps> = ({
  solutions,
  title = '方案对比雷达图',
}) => {
  const data = useMemo<RadarDataPoint[]>(() => {
    if (solutions.length === 0) return [];

    // Use the first solution's scores to determine dimensions
    const dimensions = solutions[0].scores.map((s) => s.dimension);

    return dimensions.map((dim) => {
      const point: RadarDataPoint = {
        dimension: dim,
        max: 0,
      };

      for (const solution of solutions) {
        const score = solution.scores.find((s) => s.dimension === dim);
        if (score) {
          point[solution.name] = score.value;
          if (score.max > point.max) {
            point.max = score.max;
          }
        }
      }

      return point;
    });
  }, [solutions]);

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          {title}
        </h3>
      )}
      <div className="w-full h-80">
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
            {solutions.map((solution) => (
              <Radar
                key={solution.name}
                name={solution.name}
                dataKey={solution.name}
                stroke={solution.color}
                fill={solution.color}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            ))}
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: '#6b7280' }}
              className="dark:text-gray-300"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
