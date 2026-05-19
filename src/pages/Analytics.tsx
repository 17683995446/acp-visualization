/**
 * Analytics - 高级分析仪表盘页面
 * 展示系统瓶颈、资源利用率、任务健康度、协作分析和趋势预测
 */
import React from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  Shield,
  TrendingUp,
  Users,
  Zap,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { useACPStore } from '../store/acpStore';
import { useAnalytics } from '../hooks/useAnalytics';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard, ProgressBar, Badge } from '../components/ui';
import { FadeIn } from '../components/animation';
import { AgentUtilizationChart } from '../components/charts';
import type { Bottleneck } from '../services/AnalyticsService';

// ============ 辅助组件 ============

/** 综合健康度评分圆环 */
const HealthScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? '健康' : score >= 60 ? '良好' : score >= 40 ? '警告' : '危险';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-200 dark:text-gray-700" />
          <circle
            cx="80" cy="80" r={radius} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-900 dark:text-white">{score}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">综合健康度</p>
    </div>
  );
};

/** 瓶颈严重程度颜色映射 */
const severityConfig: Record<Bottleneck['severity'], { color: string; label: string; variant: 'danger' | 'warning' | 'info' }> = {
  critical: { color: 'text-red-600 dark:text-red-400', label: '严重', variant: 'danger' },
  warning: { color: 'text-orange-600 dark:text-orange-400', label: '警告', variant: 'warning' },
  info: { color: 'text-blue-600 dark:text-blue-400', label: '提示', variant: 'info' },
};

/** 风险等级颜色 */
const riskColors: Record<string, string> = {
  low: 'text-green-600 dark:text-green-400',
  medium: 'text-orange-600 dark:text-orange-400',
  high: 'text-red-600 dark:text-red-400',
};

const riskLabels: Record<string, string> = {
  low: '低风险',
  medium: '中等风险',
  high: '高风险',
};

// ============ 页面组件 ============

const Analytics: React.FC = () => {
  const report = useAnalytics();
  const members = useACPStore(state => state.organization.members);

  return (
    <div className="space-y-8">
      <PageHeader
        title="高级分析"
        description="智能分析系统运行状态，提供优化建议"
        badges={[
          { label: `${report.bottlenecks.length} 个瓶颈`, variant: report.bottlenecks.length > 0 ? 'warning' : 'success' },
          { label: `${report.recommendations.length} 条建议`, variant: 'info' },
        ]}
      />

      {/* 第一行：综合健康度评分 */}
      <FadeIn>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <HealthScoreRing score={report.overallScore} />
            <div className="flex-1 max-w-md space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">系统概览</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                综合健康度评分基于资源利用率、任务健康度、团队协作、评估得分和系统瓶颈五个维度计算。
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-gray-600 dark:text-gray-300">资源: {report.resourceUtilization.utilizationRate}%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-gray-600 dark:text-gray-300">任务: {report.taskHealth.healthScore}分</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-gray-600 dark:text-gray-300">协作: {report.collaboration.responseRate}%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-gray-600 dark:text-gray-300">风险: {riskLabels[report.trend.riskLevel]}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* 第二行：4 个 StatCard */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="资源利用率"
            value={`${report.resourceUtilization.utilizationRate}%`}
            icon={Users}
            gradient="from-blue-500 to-blue-600"
            subtitle={`${report.resourceUtilization.busyAgents}/${report.resourceUtilization.totalAgents} 个 Agent 工作中`}
          />
          <StatCard
            label="任务健康度"
            value={report.taskHealth.healthScore}
            icon={CheckCircle}
            gradient="from-green-500 to-green-600"
            subtitle={`${report.taskHealth.healthyTasks}/${report.taskHealth.totalTasks} 个任务正常`}
          />
          <StatCard
            label="协作活跃度"
            value={report.collaboration.totalMessages}
            icon={MessageSquare}
            gradient="from-purple-500 to-purple-600"
            subtitle={`回复率 ${report.collaboration.responseRate}%`}
          />
          <StatCard
            label="风险等级"
            value={riskLabels[report.trend.riskLevel]}
            icon={Shield}
            gradient={report.trend.riskLevel === 'high' ? 'from-red-500 to-red-600' : report.trend.riskLevel === 'medium' ? 'from-orange-500 to-orange-600' : 'from-green-500 to-green-600'}
            subtitle={report.trend.prediction}
          />
        </div>
      </FadeIn>

      {/* 第三行：瓶颈列表 */}
      <FadeIn delay={0.2}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">系统瓶颈</h3>
            {report.bottlenecks.length === 0 && (
              <Badge variant="success" dot>无瓶颈</Badge>
            )}
          </div>

          {report.bottlenecks.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
              <p>当前系统运行良好，未检测到瓶颈</p>
            </div>
          ) : (
            <div className="space-y-3">
              {report.bottlenecks.map((bottleneck, index) => {
                const config = severityConfig[bottleneck.severity];
                return (
                  <div
                    key={`${bottleneck.type}-${bottleneck.affectedIds.join('-')}-${index}`}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600"
                  >
                    <Badge variant={config.variant} dot className="mt-0.5 shrink-0">
                      {config.label}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {bottleneck.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                        <Lightbulb className="w-3 h-3 mr-1 shrink-0" />
                        {bottleneck.suggestion}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </FadeIn>

      {/* 第四行：资源利用率图表 */}
      <FadeIn delay={0.3}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <AgentUtilizationChart members={members} title="Agent 状态分布" />
          </div>

          {/* 任务状态分布 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">任务状态分布</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-300">正常任务</span>
                  <span className="font-medium text-gray-900 dark:text-white">{report.taskHealth.healthyTasks}</span>
                </div>
                <ProgressBar value={report.taskHealth.totalTasks > 0 ? report.taskHealth.healthyTasks : 0} max={report.taskHealth.totalTasks || 1} showPercentage={false} colorFn={() => 'bg-green-500'} />
              </div>
              {report.taskHealth.atRiskTasks.length > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-300">风险任务</span>
                    <span className="font-medium text-gray-900 dark:text-white">{report.taskHealth.atRiskTasks.length}</span>
                  </div>
                  <ProgressBar value={report.taskHealth.atRiskTasks.length} max={report.taskHealth.totalTasks || 1} showPercentage={false} colorFn={() => 'bg-orange-500'} />
                </div>
              )}
              {report.taskHealth.stalledTasks.length > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-300">停滞任务</span>
                    <span className="font-medium text-gray-900 dark:text-white">{report.taskHealth.stalledTasks.length}</span>
                  </div>
                  <ProgressBar value={report.taskHealth.stalledTasks.length} max={report.taskHealth.totalTasks || 1} showPercentage={false} colorFn={() => 'bg-yellow-500'} />
                </div>
              )}
              {report.taskHealth.blockedTasks.length > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-300">阻塞任务</span>
                    <span className="font-medium text-gray-900 dark:text-white">{report.taskHealth.blockedTasks.length}</span>
                  </div>
                  <ProgressBar value={report.taskHealth.blockedTasks.length} max={report.taskHealth.totalTasks || 1} showPercentage={false} colorFn={() => 'bg-blue-500'} />
                </div>
              )}
              {report.taskHealth.failedTasks.length > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-300">失败任务</span>
                    <span className="font-medium text-gray-900 dark:text-white">{report.taskHealth.failedTasks.length}</span>
                  </div>
                  <ProgressBar value={report.taskHealth.failedTasks.length} max={report.taskHealth.totalTasks || 1} showPercentage={false} colorFn={() => 'bg-red-500'} />
                </div>
              )}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* 第五行：智能建议列表 */}
      <FadeIn delay={0.4}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">智能建议</h3>
            <Badge variant="info">{report.recommendations.length} 条</Badge>
          </div>

          {report.recommendations.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <Zap className="w-10 h-10 mx-auto mb-2 text-green-400" />
              <p>系统运行良好，暂无优化建议</p>
            </div>
          ) : (
            <div className="space-y-2">
              {report.recommendations.map((rec, index) => (
                <div
                  key={`rec-${index}-${rec.slice(0, 20)}`}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <ArrowRight className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">{rec}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </FadeIn>

      {/* 第六行：趋势预测 */}
      <FadeIn delay={0.5}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">趋势预测</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">预计完成时间</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {report.trend.estimatedCompletionTime === 0
                  ? '无法预估'
                  : new Date(report.trend.estimatedCompletionTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">每周期完成率</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {report.trend.completionRate.toFixed(1)} 个任务/周期
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">风险等级</span>
              </div>
              <p className={`text-lg font-semibold ${riskColors[report.trend.riskLevel]}`}>
                {riskLabels[report.trend.riskLevel]}
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {report.trend.prediction}
            </p>
          </div>
        </div>
      </FadeIn>
    </div>
  );
};

export default Analytics;
