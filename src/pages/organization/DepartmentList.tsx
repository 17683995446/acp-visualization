import React from 'react';
import { Briefcase, Building2 } from 'lucide-react';
import type { Department, Member } from '../../types';

interface DepartmentListProps {
  departments: Department[];
  memberMap: Map<string, Member>;
}

const DepartmentList: React.FC<DepartmentListProps> = ({
  departments,
  memberMap,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <Briefcase className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <span>部门概览</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {departments.map((dept) => {
          const head = memberMap.get(dept.head);
          return (
            <div
              key={dept.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {dept.name}
                  </h3>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {dept.members.length} 人
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                负责人: {head ? head.name : '未指定'}
              </div>
              <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                预算: {dept.budget.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { DepartmentList };
export type { DepartmentListProps };
