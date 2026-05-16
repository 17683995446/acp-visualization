import React from 'react';
import { Users, UserCheck, Building2, TrendingUp } from 'lucide-react';

interface OrgStatsCardsProps {
  memberCount: number;
  activeAgents: number;
  deptCount: number;
  avgReputation: number;
}

const OrgStatsCards: React.FC<OrgStatsCardsProps> = ({
  memberCount,
  activeAgents,
  deptCount,
  avgReputation,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">总成员</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {memberCount}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">活跃</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {activeAgents}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">部门</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {deptCount}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">平均声誉</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {avgReputation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { OrgStatsCards };
export type { OrgStatsCardsProps };
