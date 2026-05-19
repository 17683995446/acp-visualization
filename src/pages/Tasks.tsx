import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Filter,
  Search,
  GitGraph,
  List,
  Trash2,
  CheckSquare,
  Square,
  X,
} from 'lucide-react';
import { useACPStore } from '../store/acpStore';
import { StaggerList, StaggerItem } from '../components/animation';
import { TaskDependencyGraph } from '../components/TaskDependencyGraph';
import { SearchBar, ConfirmDialog } from '../components/ui';
import { useFilteredTasks } from '../hooks';
import type { TaskStatus } from '../types';

import { statusConfig, filterOptions } from './tasks/constants';
import type { NewTaskForm } from './tasks/constants';
import { CreateTaskModal } from './tasks/CreateTaskModal';
import { EditStatusModal } from './tasks/EditStatusModal';
import { AssignTaskModal } from './tasks/AssignTaskModal';
import { TaskCard } from './tasks/TaskCard';
import { TaskDetailPanel } from './tasks/TaskDetailPanel';

// ============ 主组件 ============

type ViewMode = 'list' | 'graph';

const Tasks: React.FC = () => {
  const tasks = useACPStore(s => s.tasks);
  const organization = useACPStore(s => s.organization);
  const addTask = useACPStore(s => s.addTask);
  const updateTask = useACPStore(s => s.updateTask);
  const deleteTask = useACPStore(s => s.deleteTask);
  const assignTask = useACPStore(s => s.assignTask);

  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // 弹窗状态
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editStatusModalOpen, setEditStatusModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);

  // 删除确认状态
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // 批量选择状态
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [batchDeleteConfirmOpen, setBatchDeleteConfirmOpen] = useState(false);
  const [batchStatusDropdownOpen, setBatchStatusDropdownOpen] = useState(false);

  // 成员列表（用于显示分配人名称）
  const members = useMemo(
    () => organization.members.map((m) => ({ id: m.id, name: m.name })),
    [organization.members],
  );

  // 空闲 Agent 列表（用于分配弹窗）
  const idleAgents = useMemo(
    () =>
      organization.members
        .filter((m) => m.status === 'idle')
        .map((m) => ({
          id: m.id,
          name: m.name,
          role: m.role,
          reputation: m.reputation,
        })),
    [organization.members],
  );

  // 使用 useFilteredTasks hook 替代内联 useMemo
  const filteredTasks = useFilteredTasks(tasks, filter, search);

  // T-1: 过滤/搜索变化时，清除不在当前 filteredTasks 中的 selectedTaskIds
  useEffect(() => {
    const filteredIds = new Set(filteredTasks.map(t => t.id));
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      for (const id of next) {
        if (!filteredIds.has(id)) next.delete(id);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [filteredTasks]);

  // 各状态计数
  const statusCounts = useMemo(() => {
    const counts: Record<TaskStatus, number> = {
      pending: 0,
      scheduled: 0,
      in_progress: 0,
      blocked: 0,
      completed: 0,
      failed: 0,
    };
    tasks.forEach((t) => {
      counts[t.status]++;
    });
    return counts;
  }, [tasks]);

  // ============ 事件处理 ============

  const handleCreateTask = (form: NewTaskForm) => {
    addTask({
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      estimatedTime: form.estimatedTime,
    });
  };

  const handleEditStatus = (status: TaskStatus) => {
    if (editingTaskId) {
      updateTask(editingTaskId, { status });
      setEditingTaskId(null);
    }
  };

  const handleOpenEditStatus = (taskId: string, _currentStatus: TaskStatus) => {
    setEditingTaskId(taskId);
    setEditStatusModalOpen(true);
  };

  const handleOpenAssign = (taskId: string) => {
    setAssigningTaskId(taskId);
    setAssignModalOpen(true);
  };

  const handleDeleteClick = (taskId: string) => {
    setDeletingTaskId(taskId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingTaskId) {
      // T-2: 如果删除的是当前选中的任务，清除 selectedTaskId
      if (selectedTaskId === deletingTaskId) setSelectedTaskId(null);
      deleteTask(deletingTaskId);
      setDeletingTaskId(null);
    }
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId === selectedTaskId ? null : taskId);
  };

  // ============ 批量操作处理 ============

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const isAllSelected = filteredTasks.length > 0 && filteredTasks.every((t) => selectedTaskIds.has(t.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredTasks.map((t) => t.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedTaskIds(new Set());
    setBatchStatusDropdownOpen(false);
  };

  const handleBatchDelete = () => {
    selectedTaskIds.forEach((id) => deleteTask(id));
    setSelectedTaskIds(new Set());
    setBatchDeleteConfirmOpen(false);
  };

  const handleBatchStatusChange = (status: TaskStatus) => {
    selectedTaskIds.forEach((id) => updateTask(id, { status }));
    setSelectedTaskIds(new Set());
    setBatchStatusDropdownOpen(false);
  };

  // 获取选中任务的详情
  const selectedTask = useMemo(() => {
    return selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null;
  }, [tasks, selectedTaskId]);

  // ============ 渲染 ============

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">任务中心</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">管理和跟踪所有任务</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>新建任务</span>
        </button>
      </div>

      {/* 搜索 + 筛选 + 视图切换 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="搜索任务..."
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as TaskStatus | 'all')}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {/* 视图切换 */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
                <span>列表视图</span>
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'graph'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <GitGraph className="w-4 h-4" />
            <span>依赖视图</span>
          </button>
        </div>

        {/* 全选 / 取消全选 */}
        {viewMode === 'list' && filteredTasks.length > 0 && (
          <button
            onClick={handleToggleSelectAll}
            className="flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {isAllSelected ? (
              <>
                <CheckSquare className="w-4 h-4 text-primary-500" />
                <span>取消全选</span>
              </>
            ) : (
              <>
                <Square className="w-4 h-4" />
                <span>全选</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 状态统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {(['pending', 'scheduled', 'in_progress', 'completed', 'failed'] as TaskStatus[]).map(
          (status) => {
            const config = statusConfig[status];
            const Icon = config.icon;
            const isActive = filter === status;
            return (
              <button
                key={status}
                onClick={() => setFilter(isActive ? 'all' : status)}
                className={`p-4 rounded-lg border transition-all text-left ${
                  isActive
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{config.label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {statusCounts[status]}
                </p>
              </button>
            );
          },
        )}
      </div>

      {/* 任务列表视图 */}
      {viewMode === 'list' && (
        <>
          <StaggerList>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => (
              <StaggerItem key={task.id}>
              <div className="relative">
                {/* 选择复选框 */}
                <div className="absolute top-3 left-3 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTaskSelection(task.id);
                    }}
                    role="checkbox"
                    aria-checked={selectedTaskIds.has(task.id)}
                    aria-label={`选择任务 ${task.title}`}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedTaskIds.has(task.id)
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800 hover:border-primary-400'
                    }`}
                  >
                    {selectedTaskIds.has(task.id) && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </div>
                <TaskCard
                  task={task}
                  members={members}
                  onAssign={handleOpenAssign}
                  onEditStatus={handleOpenEditStatus}
                  onDelete={handleDeleteClick}
                />
              </div>
              </StaggerItem>
            ))}
          </div>
          </StaggerList>

          {/* 空状态 */}
          {filteredTasks.length === 0 && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">没有找到匹配的任务</p>
              <p className="text-gray-400 text-sm mt-1">
                尝试调整筛选条件或搜索关键词
              </p>
            </div>
          )}
        </>
      )}

      {/* 依赖视图 */}
      {viewMode === 'graph' && (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 依赖图 */}
            <div className="flex-1">
              <TaskDependencyGraph
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
                selectedTaskId={selectedTaskId ?? undefined}
                width={800}
                height={450}
              />
            </div>

            {/* 选中任务详情 */}
            {selectedTask && (
              <TaskDetailPanel
                task={selectedTask}
                members={members}
                tasks={tasks}
                onAssign={handleOpenAssign}
                onEditStatus={handleOpenEditStatus}
                onDelete={handleDeleteClick}
                onClose={() => setSelectedTaskId(null)}
              />
            )}
          </div>

          {/* 依赖视图空状态 */}
          {filteredTasks.length === 0 && (
            <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
              <GitGraph className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">没有可显示的任务</p>
              <p className="text-gray-400 text-sm mt-1">
                尝试调整筛选条件或创建新任务
              </p>
            </div>
          )}
        </div>
      )}

      {/* 弹窗 */}
      <CreateTaskModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateTask}
      />
      <EditStatusModal
        open={editStatusModalOpen}
        onClose={() => {
          setEditStatusModalOpen(false);
          setEditingTaskId(null);
        }}
        currentStatus={
          (editingTaskId
            ? tasks.find((t) => t.id === editingTaskId)?.status
            : undefined) ?? 'pending'
        }
        onSubmit={handleEditStatus}
      />
      <AssignTaskModal
        open={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setAssigningTaskId(null);
        }}
        taskId={assigningTaskId ?? ''}
        idleAgents={idleAgents}
        onAssign={assignTask}
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeletingTaskId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="删除任务"
        message="确定要删除该任务吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />

      {/* 批量删除确认对话框 */}
      <ConfirmDialog
        isOpen={batchDeleteConfirmOpen}
        onClose={() => setBatchDeleteConfirmOpen(false)}
        onConfirm={handleBatchDelete}
        title="批量删除任务"
        message={`确定要删除选中的 ${selectedTaskIds.size} 个任务吗？此操作无法撤销。`}
        confirmText="批量删除"
        cancelText="取消"
        variant="danger"
      />

      {/* 批量操作栏 */}
      {selectedTaskIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                已选择 {selectedTaskIds.size} 个任务
              </span>
              <button
                onClick={() => setBatchDeleteConfirmOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-md transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>批量删除</span>
              </button>
              {/* 批量修改状态下拉 */}
              <div className="relative">
                <button
                  onClick={() => setBatchStatusDropdownOpen(!batchStatusDropdownOpen)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                >
                  <span>批量修改状态</span>
                </button>
                {batchStatusDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setBatchStatusDropdownOpen(false)} />
                    <div className="absolute bottom-full left-0 mb-2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 min-w-[140px]">
                      {(['pending', 'scheduled', 'in_progress', 'blocked', 'completed', 'failed'] as TaskStatus[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleBatchStatusChange(status)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          {statusConfig[status].label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={handleClearSelection}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>取消选择</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
