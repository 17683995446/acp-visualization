/**
 * DataManagementPanel 数据管理面板
 * 提供数据导出、导入、重置和数据统计功能
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Download,
  Upload,
  RotateCcw,
  Database,
} from 'lucide-react';
import { useACPStore } from '../store/acpStore';
import { exportPlatform, importPlatform } from '../utils/export';
import { clearPersistedState } from '../store/persistMiddleware';
import { useToast } from './Toast/useToast';
import { ConfirmDialog } from './ui';
import type { ExportData } from '../utils/export';

const DataManagementPanel: React.FC = () => {
  const {
    organization,
    tasks,
    messages,
    knowledgeNodes,
    evaluation,
    evaluationScores,
  } = useACPStore();

  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // 导出相关状态
  const [lastExportTime, setLastExportTime] = useState<number | null>(null);

  // 导入相关状态
  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // 重置确认
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // DM-3: importStatus 5秒后自动清除
  useEffect(() => {
    if (importStatus) {
      const timer = setTimeout(() => setImportStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [importStatus]);

  // ============ 导出处理 ============

  const handleExport = useCallback(() => {
    try {
      exportPlatform({
        organization,
        tasks,
        messages,
        knowledgeNodes,
        evaluation,
        evaluationScores,
      });
      setLastExportTime(Date.now());
      toast.success('数据导出成功');
    } catch {
      toast.error('数据导出失败');
    }
  }, [organization, tasks, messages, knowledgeNodes, evaluation, evaluationScores, toast]);

  // ============ 导入处理 ============

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus(null);

    try {
      const data: ExportData = await importPlatform(file);

      // 验证数据完整性
      if (!data.organization || !data.tasks) {
        setImportStatus({ success: false, message: '数据文件缺少必要字段' });
        return;
      }

      // 写入 store
      useACPStore.setState({
        organization: data.organization,
        tasks: data.tasks,
        messages: data.messages ?? [],
        knowledgeNodes: data.knowledgeNodes ?? [],
        evaluation: data.evaluation,
        logs: [],
        evaluationScores: [],
        lastSchedulerResult: null,
        isSimulating: false,
        schedulerConfig: { capabilityWeight: 0.3, reputationWeight: 0.25, workloadWeight: 0.25, priorityWeight: 0.2, preferIdleAgents: true },
      });

      setImportStatus({ success: true, message: `成功导入 ${data.tasks.length} 个任务、${data.organization.members.length} 个成员` });
      toast.success('数据导入成功');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知错误';
      setImportStatus({ success: false, message: msg });
      toast.error(`导入失败: ${msg}`);
    }

    // 重置 file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [toast]);

  // ============ 重置处理 ============

  const handleReset = useCallback(() => {
    clearPersistedState();
    // 重新加载页面以恢复默认数据
    window.location.reload();
  }, []);

  // ============ 数据统计 ============

  const dataStats = {
    memberCount: organization.members.length,
    taskCount: tasks.length,
    messageCount: messages.length,
    knowledgeNodeCount: knowledgeNodes.length,
  };

  // ============ 格式化时间 ============

  const formatExportTime = (ts: number | null): string => {
    if (!ts) return '尚未导出';
    const d = new Date(ts);
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <>
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              数据管理
            </span>
          </div>
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Collapsible content */}
        {!isCollapsed && (
          <div className="px-4 py-4 space-y-4 bg-white dark:bg-gray-800">
            {/* Stats section */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: '成员数', value: dataStats.memberCount },
                { label: '任务数', value: dataStats.taskCount },
                { label: '消息数', value: dataStats.messageCount },
                { label: '知识节点', value: dataStats.knowledgeNodeCount },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center"
                >
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Export section */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Download className="w-4 h-4 text-primary-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    导出全部数据
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    格式: JSON {lastExportTime && `| 上次导出: ${formatExportTime(lastExportTime)}`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleExport}
                className="px-3 py-1.5 text-xs font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-md transition-colors"
              >
                导出
              </button>
            </div>

            {/* Import section */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Upload className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    导入数据
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    选择 .json 文件导入平台数据
                  </p>
                  {importStatus && (
                    <p className={`text-xs mt-0.5 ${importStatus.success ? 'text-green-500' : 'text-red-500'}`}>
                      {importStatus.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={handleImportClick}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                >
                  导入数据
                </button>
              </div>
            </div>

            {/* Reset section */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <RotateCcw className="w-4 h-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    重置为默认数据
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    清除所有持久化数据并恢复初始状态
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResetConfirmOpen(true)}
                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-md transition-colors"
              >
                重置
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reset confirmation dialog */}
      <ConfirmDialog
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={handleReset}
        title="重置数据"
        message="确定要重置为默认数据吗？所有当前数据将被清除，此操作无法撤销。"
        confirmText="确认重置"
        cancelText="取消"
        variant="danger"
      />
    </>
  );
};

export default DataManagementPanel;
