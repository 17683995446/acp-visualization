/**
 * Dashboard 仪表盘 - 升级版
 * 从模拟数据升级为真实 Zustand Store 驱动
 */
import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Square,
  Users,
  ListTodo,
  CheckCircle,
  Activity,
  Clock,
  Zap,
  MessageSquare,
  TrendingUp,
  Download,
  Upload,
} from 'lucide-react';
import { useACPStore } from '../store/acpStore';
import { calculateStats } from '../store/helpers';
import { exportPlatform, importPlatform } from '../utils/export';
import { useToast } from '../components';
import { StatCard, ProgressBar } from '../components/ui';
import { FadeIn } from '../components/animation';
import SchedulerConfigPanel from '../components/SchedulerConfig';
import SimulationPanel from '../components/SimulationPanel';
import DataManagementPanel from '../components/DataManagementPanel';
import ActivityFeed from '../components/ActivityFeed';
import { useSimulation } from '../hooks/useSimulation';
import { TaskCompletionChart, AgentUtilizationChart, MessageStatsChart } from '../components/charts';

const Dashboard: React.FC = () => {
  const organization = useACPStore(s => s.organization);
  const tasks = useACPStore(s => s.tasks);
  const logs = useACPStore(s => s.logs);
  const isSimulating = useACPStore(s => s.isSimulating);
  const toggleSimulation = useACPStore(s => s.toggleSimulation);
  const runSchedulerTick = useACPStore(s => s.runSchedulerTick);
  const simulationInterval = useACPStore(s => s.simulationInterval);
  const lastSchedulerResult = useACPStore(s => s.lastSchedulerResult);
  const messages = useACPStore(s => s.messages);
  const knowledgeNodes = useACPStore(s => s.knowledgeNodes);
  const evaluation = useACPStore(s => s.evaluation);
  const evaluationScores = useACPStore(s => s.evaluationScores);

  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isRunning: isDataSimulating } = useSimulation();

  // 使用 useMemo 缓存 stats 计算结果，避免无限重渲染
  const stats = useMemo(() =>
    calculateStats(organization.members, tasks, messages),
    [organization.members, tasks, messages]
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // 模拟引擎定时器
  useEffect(() => {
    if (isSimulating) {
      intervalRef.current = setInterval(() => {
        runSchedulerTick();
      }, simulationInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSimulating, simulationInterval, runSchedulerTick]);

  // 自动滚动日志
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // 导出数据
  const handleExport = useCallback(() => {
    exportPlatform({
      organization,
      tasks,
      messages,
      knowledgeNodes,
      evaluation,
      evaluationScores,
    });
    toast.success('数据导出成功');
  }, [organization, tasks, messages, knowledgeNodes, evaluation, evaluationScores, toast]);

  // 导入数据
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importPlatform(file);

      // Replace store state with imported data
      useACPStore.setState({
        organization: data.organization,
        tasks: data.tasks,
        messages: data.messages,
        knowledgeNodes: data.knowledgeNodes,
        evaluation: data.evaluation,
        logs: [],
        evaluationScores: [],
        lastSchedulerResult: null,
        isSimulating: false,
        schedulerConfig: { capabilityWeight: 0.3, reputationWeight: 0.25, workloadWeight: 0.25, priorityWeight: 0.2, preferIdleAgents: true },
      });

      toast.success('数据导入成功');
    } catch (err) {
      toast.error(`导入失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [toast]);

  const statCards = useMemo(() => [
    { label: '活跃 Agent', value: stats.activeAgents, icon: Users, color: 'from-blue-500 to-blue-600', sub: `${stats.busyAgents} 忙碌 / ${stats.idleAgents} 空闲` },
    { label: '进行中任务', value: stats.activeTasks, icon: ListTodo, color: 'from-orange-500 to-orange-600', sub: `${stats.pendingTasks} 待处理` },
    { label: '已完成任务', value: stats.completedTasks, icon: CheckCircle, color: 'from-green-500 to-green-600', sub: `平均进度 ${stats.avgProgress.toFixed(1)}%` },
    { label: '消息总量', value: stats.totalMessages, icon: MessageSquare, color: 'from-purple-500 to-purple-600', sub: `实时通信中` },
  ], [stats]);

  const statusColor = (status: string) => {
    switch (status) {
      case 'busy': return 'bg-red-400';
      case 'idle': return 'bg-green-400';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'busy': return '忙碌';
      case 'idle': return '空闲';
      case 'offline': return '离线';
      default: return status;
    }
  };

  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'P0': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      case 'P1': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300';
      case 'P2': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300';
      case 'P3': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const logLevelColor = (level: string) => {
    switch (level) {
      case 'success': return 'text-green-400';
      case 'info': return 'text-blue-400';
      case 'warn': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // 系统指标数据
  const systemMetrics = useMemo(() => [
    { label: 'Agent 利用率', value: stats.activeAgents > 0 ? (stats.busyAgents / stats.activeAgents) * 100 : 0 },
    { label: '任务完成率', value: tasks.length > 0 ? (stats.completedTasks / tasks.length) * 100 : 0 },
    { label: '平均进度', value: stats.avgProgress },
    { label: '在线率', value: organization.members.length > 0 ? (stats.activeAgents / organization.members.length) * 100 : 0 },
  ], [stats, tasks.length, organization.members.length]);

  return (
    <div className="space-y-6">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <FadeIn delay={0}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <span>仪表盘</span>
            {isDataSimulating && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span>模拟</span>
              </span>
            )}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Agent 集群平台实时监控</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Export / Import buttons */}
          <button
            onClick={handleExport}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="导出数据"
          >
            <Download className="w-4 h-4" />
            <span>导出数据</span>
          </button>
          <button
            onClick={handleImportClick}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="导入数据"
          >
            <Upload className="w-4 h-4" />
            <span>导入数据</span>
          </button>

          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium ${isSimulating ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
            <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span>{isSimulating ? '运行中' : '已停止'}</span>
          </div>
          <button
            onClick={toggleSimulation}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-medium transition-all ${
              isSimulating
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isSimulating ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isSimulating ? '停止模拟' : '启动模拟'}</span>
          </button>
        </div>
      </div>
      </FadeIn>

      {/* Stat Cards */}
      <FadeIn delay={0.1}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            gradient={card.color}
            subtitle={card.sub}
          />
        ))}
      </div>
      </FadeIn>

      {/* Main Content Grid */}
      <FadeIn delay={0.2}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Progress */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              <span>任务进度</span>
            </h2>
            <span className="text-sm text-gray-400 dark:text-gray-500">{tasks.filter(t => t.status !== 'completed').length} 个进行中</span>
          </div>
          <div className="space-y-4">
            {tasks.filter(t => t.status !== 'completed').map(task => (
              <div key={task.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {task.assignee && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {organization.members.find(m => m.id === task.assignee)?.name}
                      </span>
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{task.progress.toFixed(0)}%</span>
                  </div>
                </div>
                <ProgressBar
                  value={task.progress}
                  size="sm"
                  showPercentage={false}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Agent Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Users className="w-5 h-5 text-secondary-500" />
            <span>Agent 状态</span>
          </h2>
          <div className="space-y-3">
            {organization.members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${statusColor(member.status)}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{member.role.toUpperCase()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    member.status === 'busy' ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300' :
                    member.status === 'idle' ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300' :
                    'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {statusLabel(member.status)}
                  </span>
                  <div className="flex items-center space-x-1 mt-1">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{member.reputation}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </FadeIn>

      {/* Bottom Section */}
      <FadeIn delay={0.3}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Logs */}
        <div className="bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-green-400" />
              <span>实时日志</span>
            </h2>
            <span className="text-xs text-gray-500">{logs.length} 条记录</span>
          </div>
          <div className="h-64 overflow-y-auto font-mono text-sm space-y-1 scrollbar-thin">
            {logs.length === 0 ? (
              <p className="text-gray-600 text-center mt-8">启动模拟引擎以查看实时日志...</p>
            ) : (
              logs.slice(0, 100).map(log => (
                <div key={log.id} className="flex items-start space-x-2">
                  <span className="text-gray-600 text-xs shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString('zh-CN')}
                  </span>
                  <span className={`shrink-0 ${logLevelColor(log.level)}`}>
                    [{log.level.toUpperCase()}]
                  </span>
                  <span className="text-gray-300">{log.message}</span>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>

        {/* System Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-primary-500" />
            <span>系统指标</span>
          </h2>
          <div className="space-y-4">
            {systemMetrics.map(metric => (
              <ProgressBar
                key={metric.label}
                label={metric.label}
                value={metric.value}
                size="sm"
              />
            ))}

            {/* Last Tick Result */}
            {lastSchedulerResult && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">最近调度结果</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">{lastSchedulerResult.tasksAssigned}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">分配</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{lastSchedulerResult.tasksCompleted}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">完成</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{lastSchedulerResult.messagesSent}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">消息</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Scheduler Config Panel */}
          <SchedulerConfigPanel />

          {/* Simulation Panel */}
          <SimulationPanel />
        </div>
      </div>
      </FadeIn>

      {/* Data Trends Charts */}
      <FadeIn delay={0.4}>
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-primary-500" />
          <span>数据趋势</span>
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
            <TaskCompletionChart tasks={tasks} />
          </div>
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <AgentUtilizationChart members={organization.members} />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <MessageStatsChart messages={messages} />
            </div>
          </div>
        </div>
      </div>
      </FadeIn>

      {/* Data Management & Activity Feed */}
      <FadeIn delay={0.5}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DataManagementPanel />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>
      </FadeIn>
    </div>
  );
};

export default Dashboard;
