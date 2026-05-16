import React, { useState, useMemo } from 'react';
import {
  Users,
  Building2,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Network,
  Plus,
  Shield,
} from 'lucide-react';
import { useACPStore } from '../store/acpStore';
import { calculateStats } from '../store/helpers';
import { RoleBadge, StatusBadge, ConfirmDialog } from '../components/ui';
import { useMemberMap } from '../hooks';
import type { Member } from '../types';

import { orgTypeLabels, orgTypeColors } from './organization/constants';
import { AddMemberModal } from './organization/AddMemberModal';
import { AddDepartmentModal } from './organization/AddDepartmentModal';
import { MemberCard } from './organization/MemberCard';
import { TreeNode } from './organization/TreeNode';
import { OrgStatsCards } from './organization/OrgStatsCards';
import { DepartmentList } from './organization/DepartmentList';

// ============ 主组件 ============

const Organization: React.FC = () => {
  const organization = useACPStore((s) => s.organization);
  const removeMember = useACPStore((s) => s.removeMember);
  const tasks = useACPStore((s) => s.tasks);
  const messages = useACPStore((s) => s.messages);

  // 使用 useMemo 缓存 stats 计算结果
  const stats = useMemo(
    () => calculateStats(organization.members, tasks, messages),
    [organization.members, tasks, messages]
  );

  const [viewMode, setViewMode] = useState<'cards' | 'tree'>('cards');
  const [expandedDepts, setExpandedDepts] = useState<string[]>(() =>
    organization.departments.map((d) => d.id)
  );
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddDept, setShowAddDept] = useState(false);

  // 删除确认状态
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  // 构建 taskId -> title 映射
  const taskTitleMap = useMemo(() => {
    const map: Record<string, string> = {};
    tasks.forEach((t) => {
      map[t.id] = t.title;
    });
    return map;
  }, [tasks]);

  // 使用 useMemberMap hook 替代内联 useMemo
  const memberMap = useMemberMap(organization.members);

  const toggleDept = (deptId: string) => {
    setExpandedDepts((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  const avgReputation =
    organization.members.length > 0
      ? Math.round(
          organization.members.reduce((sum, m) => sum + m.reputation, 0) /
            organization.members.length
        )
      : 0;

  const handleRemoveClick = (memberId: string) => {
    setRemovingMemberId(memberId);
    setRemoveConfirmOpen(true);
  };

  const handleRemoveConfirm = () => {
    if (removingMemberId) {
      removeMember(removingMemberId);
      setRemovingMemberId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* ========== 页面头部 ========== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            组织管理
          </h1>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-gray-500 dark:text-gray-400">
              {organization.name}
            </span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full ${orgTypeColors[organization.type] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
            >
              {orgTypeLabels[organization.type] ?? organization.type}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-wrap">
          {/* 视图切换 */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-gray-600 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>卡片</span>
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'tree'
                  ? 'bg-white dark:bg-gray-600 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Network className="w-4 h-4" />
              <span>组织树</span>
            </button>
          </div>

          {/* 添加成员 */}
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center space-x-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>添加成员</span>
          </button>

          {/* 添加部门 */}
          <button
            onClick={() => setShowAddDept(true)}
            className="flex items-center space-x-1 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Building2 className="w-4 h-4" />
            <span>添加部门</span>
          </button>
        </div>
      </div>

      {/* ========== 组织信息 ========== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {organization.name}
              </h2>
              <span
                className={`px-2.5 py-1 text-xs rounded-full font-medium ${orgTypeColors[organization.type] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
              >
                {orgTypeLabels[organization.type] ?? organization.type}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {organization.mission}
            </p>
          </div>
        </div>
      </div>

      {/* ========== 统计卡片 ========== */}
      <OrgStatsCards
        memberCount={organization.members.length}
        activeAgents={stats.activeAgents}
        deptCount={organization.departments.length}
        avgReputation={avgReputation}
      />

      {/* ========== 部门列表 ========== */}
      <DepartmentList
        departments={organization.departments}
        memberMap={memberMap}
      />

      {/* ========== 成员视图 ========== */}
      {viewMode === 'cards' ? (
        /* ---- 卡片视图 ---- */
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span>全部成员</span>
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
              ({organization.members.length})
            </span>
          </h2>
          {organization.members.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 border border-gray-100 dark:border-gray-700 text-center">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 dark:text-gray-500">
                暂无成员，点击上方"添加成员"按钮开始
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {organization.members.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  taskTitle={
                    member.currentTask
                      ? taskTitleMap[member.currentTask]
                      : undefined
                  }
                  onRemoveClick={handleRemoveClick}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ---- 组织树视图 ---- */
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Network className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span>组织架构</span>
          </h2>

          {organization.members.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 dark:text-gray-500">暂无成员</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* CEO / 高管层 */}
              {organization.members
                .filter((m) =>
                  ['ceo', 'cto', 'coo', 'cqo'].includes(m.role)
                )
                .map((exec) => (
                  <div
                    key={exec.id}
                    className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                      {exec.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {exec.name}
                        </p>
                        <RoleBadge role={exec.role} />
                      </div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                        {exec.capabilities.slice(0, 3).join(' / ')}
                      </p>
                    </div>
                    <StatusBadge type="member" status={exec.status} />
                  </div>
                ))}

              {/* 部门树 */}
              <div className="ml-2 space-y-2">
                {organization.departments.map((dept) => {
                  const head = memberMap.get(dept.head);
                  const deptMembers = dept.members
                    .map((id) => memberMap.get(id))
                    .filter((m): m is Member => m !== undefined);

                  const isExpanded = expandedDepts.includes(dept.id);

                  return (
                    <div
                      key={dept.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleDept(dept.id)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          )}
                          <Building2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {dept.name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({dept.members.length} 人)
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          预算: {dept.budget.toLocaleString()}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="p-2 space-y-1">
                          {head && (
                            <TreeNode
                              member={head}
                              taskTitle={
                                head.currentTask
                                  ? taskTitleMap[head.currentTask]
                                  : undefined
                              }
                              depth={0}
                              isHead
                              onRemoveClick={handleRemoveClick}
                            />
                          )}
                          {deptMembers
                            .filter((m) => m.id !== dept.head)
                            .map((member) => (
                              <TreeNode
                                key={member.id}
                                member={member}
                                taskTitle={
                                  member.currentTask
                                    ? taskTitleMap[member.currentTask]
                                    : undefined
                                }
                                depth={1}
                                onRemoveClick={handleRemoveClick}
                              />
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== 组织使命 ========== */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">组织使命</h3>
        <p className="text-lg opacity-90">{organization.mission}</p>
      </div>

      {/* ========== 弹窗 ========== */}
      <AddMemberModal
        open={showAddMember}
        onClose={() => setShowAddMember(false)}
        departments={organization.departments}
      />
      <AddDepartmentModal
        open={showAddDept}
        onClose={() => setShowAddDept(false)}
        members={organization.members}
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={removeConfirmOpen}
        onClose={() => {
          setRemoveConfirmOpen(false);
          setRemovingMemberId(null);
        }}
        onConfirm={handleRemoveConfirm}
        title="移除成员"
        message="确定要移除该成员吗？此操作无法撤销。"
        confirmText="移除"
        cancelText="取消"
        variant="danger"
      />
    </div>
  );
};

export default Organization;
