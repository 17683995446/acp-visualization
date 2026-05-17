import React, { useState, useMemo } from 'react';
import {
  Box,
  Layers,
  Database,
  Activity,
  Server,
  ArrowRight,
  Users,
  ListTodo,
  Building2,
} from 'lucide-react';
import { useACPStore } from '../store/acpStore';
import { StatCard, StatusBadge, RoleBadge, Badge } from '../components/ui';
import { FadeIn } from '../components/animation';
import { calculateStats } from '../store/helpers';
import type { TaskStatus } from '../types';

const architectureLayers = [
  {
    name: '应用层',
    icon: Box,
    color: 'from-blue-500 to-blue-600',
    components: ['CLI', 'Web UI', 'REST API', 'SDK'],
  },
  {
    name: '服务层',
    icon: Layers,
    color: 'from-purple-500 to-purple-600',
    components: ['Org Service', 'Task Service', 'Agent Service', 'Knowledge Service'],
  },
  {
    name: '核心层',
    icon: Activity,
    color: 'from-orange-500 to-orange-600',
    components: ['Intent Engine', 'Workflow Engine', 'Reputation Engine', 'Bidding Engine'],
  },
  {
    name: '适配层',
    icon: Server,
    color: 'from-green-500 to-green-600',
    components: ['Kafka Adapter', 'Temporal Adapter', 'Neo4j Adapter', 'Milvus Adapter'],
  },
  {
    name: '基础设施',
    icon: Database,
    color: 'from-gray-500 to-gray-600',
    components: ['PostgreSQL', 'Redis', 'Kafka', 'Neo4j', 'Milvus'],
  },
];

const TASK_STATUS_ORDER: TaskStatus[] = ['in_progress', 'pending', 'scheduled', 'blocked', 'completed', 'failed'];

const Architecture: React.FC = () => {
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  const organization = useACPStore((s) => s.organization);
  const tasks = useACPStore((s) => s.tasks);
  const messages = useACPStore((s) => s.messages);

  const stats = useMemo(
    () => calculateStats(organization.members, tasks, messages),
    [organization.members, tasks, messages]
  );

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, typeof tasks> = {};
    for (const status of TASK_STATUS_ORDER) {
      grouped[status] = tasks.filter((t) => t.status === status);
    }
    return grouped;
  }, [tasks]);

  // Group members by department
  const membersByDepartment = useMemo(() => {
    const grouped: Record<string, typeof organization.members> = {};
    for (const dept of organization.departments) {
      grouped[dept.id] = dept.members
        .map((mid) => organization.members.find((m) => m.id === mid))
        .filter((m): m is NonNullable<typeof m> => !!m);
    }
    // Members not in any department
    const assignedIds = new Set(organization.departments.flatMap((d) => d.members));
    const unassigned = organization.members.filter((m) => !assignedIds.has(m.id));
    if (unassigned.length > 0) {
      grouped['__unassigned__'] = unassigned;
    }
    return grouped;
  }, [organization.members, organization.departments]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">架构设计</h1>
          <p className="text-gray-500 mt-1">高度模块化、产品化的 Agent 集群平台架构</p>
        </div>
      </FadeIn>

      {/* Header Stat Bar */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="团队成员"
            value={organization.members.length}
            icon={Users}
            gradient="from-blue-500 to-blue-600"
            subtitle={`${stats.activeAgents} 在线 / ${stats.busyAgents} 忙碌`}
          />
          <StatCard
            label="活跃任务"
            value={stats.activeTasks}
            icon={ListTodo}
            gradient="from-purple-500 to-purple-600"
            subtitle={`${stats.completedTasks} 已完成 / ${stats.pendingTasks} 待处理`}
          />
          <StatCard
            label="部门数量"
            value={organization.departments.length}
            icon={Building2}
            gradient="from-green-500 to-green-600"
            subtitle={organization.departments.map((d) => d.name).join('、') || '暂无部门'}
          />
        </div>
      </FadeIn>

      {/* Architecture Diagram */}
      <FadeIn delay={0.2}>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">分层架构</h2>

          <div className="space-y-4">
            {architectureLayers.map((layer, index) => {
              const Icon = layer.icon;
              const isSelected = selectedLayer === index;

              return (
                <div key={layer.name}>
                  <button
                    onClick={() => setSelectedLayer(isSelected ? null : index)}
                    className={`w-full p-4 rounded-lg bg-gradient-to-r ${layer.color} text-white text-left transition-all ${
                      isSelected ? 'ring-4 ring-offset-2 ring-gray-300' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className="w-6 h-6" />
                        <span className="font-semibold text-lg">{layer.name}</span>
                      </div>
                      <ArrowRight className={`w-5 h-5 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  {isSelected && (
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {layer.components.map((comp) => (
                          <div
                            key={comp}
                            className="p-3 bg-white rounded-lg border border-gray-200 text-center"
                          >
                            <p className="text-sm font-medium text-gray-700">{comp}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {index < architectureLayers.length - 1 && (
                    <div className="flex justify-center py-2">
                      <div className="w-0.5 h-4 bg-gray-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </FadeIn>

      {/* Team Members by Department */}
      <FadeIn delay={0.3}>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">团队成员</h2>
          <div className="space-y-3">
            {organization.departments.map((dept) => {
              const isExpanded = expandedDept === dept.id;
              const deptMembers = membersByDepartment[dept.id] || [];

              return (
                <div key={dept.id}>
                  <button
                    onClick={() => setExpandedDept(isExpanded ? null : dept.id)}
                    className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-left hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Building2 className="w-5 h-5 text-gray-500" />
                        <span className="font-medium text-gray-900">{dept.name}</span>
                        <Badge variant="info">{deptMembers.length} 人</Badge>
                      </div>
                      <ArrowRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-2 ml-4 space-y-2">
                      {deptMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{member.name}</p>
                              <p className="text-xs text-gray-500">
                                声誉: {member.reputation} | 等级: {member.level}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RoleBadge role={member.role} />
                            <StatusBadge status={member.status} type="member" />
                          </div>
                        </div>
                      ))}
                      {deptMembers.length === 0 && (
                        <p className="text-sm text-gray-400 ml-2">该部门暂无成员</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unassigned members */}
            {membersByDepartment['__unassigned__'] && (
              <div>
                <button
                  onClick={() => setExpandedDept(expandedDept === '__unassigned__' ? null : '__unassigned__')}
                  className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-left hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-gray-900">未分配部门</span>
                      <Badge variant="default">{membersByDepartment['__unassigned__']!.length} 人</Badge>
                    </div>
                    <ArrowRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedDept === '__unassigned__' ? 'rotate-90' : ''}`} />
                  </div>
                </button>
                {expandedDept === '__unassigned__' && (
                  <div className="mt-2 ml-4 space-y-2">
                    {membersByDepartment['__unassigned__']!.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">
                            声誉: {member.reputation} | 等级: {member.level}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RoleBadge role={member.role} />
                          <StatusBadge status={member.status} type="member" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </FadeIn>

      {/* Tasks by Status (replaces hardcoded tech stack) */}
      <FadeIn delay={0.4}>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">任务概览</h2>
          <div className="space-y-4">
            {TASK_STATUS_ORDER.map((status) => {
              const statusTasks = tasksByStatus[status];
              if (!statusTasks || statusTasks.length === 0) return null;
              return (
                <div key={status}>
                  <div className="flex items-center space-x-2 mb-2">
                    <StatusBadge status={status} type="task" size="md" />
                    <span className="text-sm text-gray-500">{statusTasks.length} 个任务</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-2">
                    {statusTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        <div className="mt-1 flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            进度: {task.progress}%
                          </span>
                          {task.assignee && (
                            <span className="text-xs text-gray-400">
                              | {organization.members.find((m) => m.id === task.assignee)?.name || task.assignee}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {tasks.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">暂无任务</p>
            )}
          </div>
        </div>
      </FadeIn>

      {/* Module Interfaces */}
      <FadeIn delay={0.5}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">核心接口</h2>
            <div className="space-y-3">
              {[
                { name: 'IOrganizationService', methods: ['create', 'addMember', 'checkPermission', 'getPerformance'] },
                { name: 'ITaskService', methods: ['create', 'schedule', 'assign', 'getStatus'] },
                { name: 'ICommunicationService', methods: ['send', 'publish', 'subscribe', 'request'] },
                { name: 'IKnowledgeService', methods: ['addEntity', 'addRelation', 'search', 'traverse'] },
              ].map((iface) => (
                <div key={iface.name} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-mono text-sm font-medium text-primary-600">{iface.name}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {iface.methods.map((m) => (
                      <span key={m} className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                        {m}()
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">设计原则</h2>
            <div className="space-y-3">
              {[
                { title: '单一职责 (SRP)', desc: '每个模块只做一件事，做好一件事' },
                { title: '接口隔离 (ISP)', desc: '模块间通过定义良好的接口通信' },
                { title: '依赖倒置 (DIP)', desc: '高层模块不依赖低层模块，都依赖抽象' },
                { title: '可替换性', desc: '任何模块都可以被同等接口的实现替换' },
                { title: '可测试性', desc: '每个模块都有独立的单元测试' },
                { title: '可观测性', desc: '每个模块暴露健康检查、指标、日志' },
              ].map((principle) => (
                <div key={principle.title} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-600 text-xs font-bold">&#10003;</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{principle.title}</p>
                    <p className="text-sm text-gray-500">{principle.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Data Flow */}
      <FadeIn delay={0.6}>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">数据流</h2>
          <div className="flex items-center justify-center space-x-4 overflow-x-auto py-4">
            {['用户输入', 'CLI/API', '服务层', '核心引擎', '适配层', '基础设施'].map((step, i, arr) => (
              <React.Fragment key={step}>
                <div className="flex-shrink-0 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg font-medium">
                  {step}
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </FadeIn>
    </div>
  );
};

export default Architecture;
