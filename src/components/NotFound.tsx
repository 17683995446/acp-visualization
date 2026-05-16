import React from 'react';
import { NavLink } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

/** 404 页面 */
const NotFound: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-6">
      <AlertTriangle className="w-10 h-10 text-gray-400 dark:text-gray-500" />
    </div>
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">页面未找到</h1>
    <p className="text-gray-500 dark:text-gray-400 mb-6">您访问的页面不存在或已被移除</p>
    <NavLink
      to="/"
      className="px-6 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
    >
      返回仪表盘
    </NavLink>
  </div>
);

export default NotFound;
