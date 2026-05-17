import React, { useState, useMemo } from 'react';
import {
  ExternalLink,
  Star,
  Search,
  Users,
  CheckCircle,
  Network,
  BarChart3,
  Link2,
} from 'lucide-react';
import { openSourceTools } from '../data/demo';
import { useACPStore } from '../store/acpStore';
import { StatCard, ProgressBar, Badge } from '../components/ui';
import { FadeIn } from '../components/animation';
import { calculateStats } from '../store/helpers';

const categories = ['全部', '消息队列', '工作流引擎', '知识图谱', '向量检索', '可观测性', '分布式追踪', '指标监控', '可视化', '缓存/锁', '关系数据库', '测试框架', 'E2E测试'];

// Capability keywords to match tools to tasks
const TOOL_CAPABILITY_MAP: Record<string, string[]> = {
  'Apache Kafka': ['消息', '队列', '通信', '事件'],
  'Temporal': ['工作流', '编排', '流程'],
  'Neo4j': ['知识图谱', '图谱', '关联'],
  'Milvus': ['向量', '检索', '搜索', '嵌入'],
  'OpenTelemetry': ['可观测', '监控', '追踪'],
  'Jaeger': ['追踪', '分布式', '调试'],
  'Prometheus': ['监控', '指标', '告警'],
  'Grafana': ['可视化', '监控', '仪表盘'],
  'Redis': ['缓存', '锁', '性能'],
  'PostgreSQL': ['数据库', '存储', '关系'],
  'Vitest': ['测试', '单元测试'],
  'Playwright': ['测试', 'E2E', '自动化'],
};

const ToolCard: React.FC<{
  tool: typeof openSourceTools[0];
  relatedTasks: { id: string; title: string }[];
}> = ({ tool, relatedTasks }) => (
  <a
    href={tool.url}
    target="_blank"
    rel="noopener noreferrer"
    className="block bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all group"
  >
    <div className="flex items-start justify-between mb-3">
      <div>
        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
          {tool.name}
        </h3>
        <p className="text-xs text-gray-500">{tool.category}</p>
      </div>
      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
    </div>

    <p className="text-sm text-gray-600 mb-3">{tool.description}</p>

    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center space-x-1 text-yellow-600">
        <Star className="w-3 h-3 fill-current" />
        <span>{tool.stars.toLocaleString()}</span>
      </div>
      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
        {tool.license}
      </span>
    </div>

    {/* Related tasks */}
    {relatedTasks.length > 0 && (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 mb-1 flex items-center">
          <Link2 className="w-3 h-3 mr-1" />
          相关任务
        </p>
        <div className="flex flex-wrap gap-1">
          {relatedTasks.slice(0, 3).map((t) => (
            <Badge key={t.id} variant="info" size="sm">
              {t.title}
            </Badge>
          ))}
          {relatedTasks.length > 3 && (
            <Badge variant="default" size="sm">
              +{relatedTasks.length - 3}
            </Badge>
          )}
        </div>
      </div>
    )}
  </a>
);

const Tools: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [search, setSearch] = useState('');

  const organization = useACPStore((s) => s.organization);
  const tasks = useACPStore((s) => s.tasks);
  const messages = useACPStore((s) => s.messages);
  const knowledgeNodes = useACPStore((s) => s.knowledgeNodes);

  const stats = useMemo(
    () => calculateStats(organization.members, tasks, messages),
    [organization.members, tasks, messages]
  );

  const taskCompletionRate = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((stats.completedTasks / tasks.length) * 100);
  }, [tasks.length, stats.completedTasks]);

  const knowledgeConnectionCount = useMemo(() => {
    return knowledgeNodes.reduce((sum, node) => sum + node.connections.length, 0);
  }, [knowledgeNodes]);

  // Collect all unique capabilities
  const allCapabilities = useMemo(() => {
    const capSet = new Set<string>();
    for (const m of organization.members) {
      for (const c of m.capabilities) {
        capSet.add(c);
      }
    }
    return Array.from(capSet);
  }, [organization.members]);

  // Find capabilities most in-demand from pending/in_progress tasks
  const inDemandCapabilities = useMemo(() => {
    const demandMap: Record<string, number> = {};
    const activeTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
    for (const task of activeTasks) {
      const text = `${task.title} ${task.description}`.toLowerCase();
      for (const cap of allCapabilities) {
        if (text.includes(cap.toLowerCase())) {
          demandMap[cap] = (demandMap[cap] || 0) + 1;
        }
      }
    }
    return demandMap;
  }, [tasks, allCapabilities]);

  // Match tools to tasks by capability keywords
  const toolTaskMap = useMemo(() => {
    const map: Record<string, { id: string; title: string }[]> = {};
    for (const tool of openSourceTools) {
      const keywords = TOOL_CAPABILITY_MAP[tool.name] || [tool.category, tool.name.split(' ')[0].toLowerCase()];
      const matched: { id: string; title: string }[] = [];
      for (const task of tasks) {
        const text = `${task.title} ${task.description}`.toLowerCase();
        if (keywords.some((kw) => text.includes(kw.toLowerCase()))) {
          matched.push({ id: task.id, title: task.title });
        }
      }
      map[tool.name] = matched;
    }
    return map;
  }, [tasks]);

  const filteredTools = openSourceTools.filter((tool) => {
    const matchesCategory = selectedCategory === '全部' || tool.category === selectedCategory;
    const matchesSearch =
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">开源工具集</h1>
          <p className="text-gray-500 mt-1">站在巨人的肩膀上，不重复造轮子</p>
        </div>
      </FadeIn>

      {/* Platform Capability Overview */}
      <FadeIn delay={0.1}>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">平台能力概览</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="团队成员"
              value={organization.members.length}
              icon={Users}
              gradient="from-blue-500 to-blue-600"
              subtitle={`${allCapabilities.length} 种能力`}
            />
            <StatCard
              label="任务完成率"
              value={`${taskCompletionRate}%`}
              icon={CheckCircle}
              gradient="from-green-500 to-green-600"
              subtitle={`${stats.completedTasks}/${tasks.length} 已完成`}
            />
            <StatCard
              label="知识图谱节点"
              value={knowledgeNodes.length}
              icon={Network}
              gradient="from-purple-500 to-purple-600"
              subtitle={`${knowledgeConnectionCount} 条连接`}
            />
            <StatCard
              label="活跃任务"
              value={stats.activeTasks}
              icon={BarChart3}
              gradient="from-orange-500 to-orange-600"
              subtitle={`${stats.pendingTasks} 待处理`}
            />
          </div>

          {/* Capability distribution */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">能力分布</h3>
            {allCapabilities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allCapabilities.map((cap) => {
                  const memberCount = organization.members.filter((m) =>
                    m.capabilities.includes(cap)
                  ).length;
                  const percentage = Math.round((memberCount / organization.members.length) * 100);
                  const demand = inDemandCapabilities[cap] || 0;
                  return (
                    <div key={cap} className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600 w-24 truncate flex-shrink-0">{cap}</span>
                      <ProgressBar value={percentage} size="sm" showPercentage={false} />
                      <span className="text-xs text-gray-500 w-12 flex-shrink-0">{memberCount}人</span>
                      {demand > 0 && (
                        <Badge variant="warning" size="sm" dot>
                          需求{demand}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">暂无能力数据</p>
            )}
          </div>
        </div>
      </FadeIn>

      {/* Filters */}
      <FadeIn delay={0.2}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索工具..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </FadeIn>

      {/* Category Tabs */}
      <FadeIn delay={0.25}>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </FadeIn>

      {/* Tools Grid */}
      <FadeIn delay={0.3}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => (
            <ToolCard
              key={tool.name}
              tool={tool}
              relatedTasks={toolTaskMap[tool.name] || []}
            />
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">没有找到匹配的工具</p>
          </div>
        )}
      </FadeIn>

      {/* Capability Matrix */}
      <FadeIn delay={0.4}>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">能力矩阵</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                    成员
                  </th>
                  {allCapabilities.map((cap) => (
                    <th
                      key={cap}
                      className={`px-3 py-3 text-center text-xs font-medium uppercase tracking-wider whitespace-nowrap ${
                        (inDemandCapabilities[cap] || 0) > 0
                          ? 'text-orange-600 bg-orange-50'
                          : 'text-gray-500'
                      }`}
                    >
                      {cap}
                      {(inDemandCapabilities[cap] || 0) > 0 && (
                        <span className="ml-1 text-[10px]">({inDemandCapabilities[cap]})</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {organization.members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap sticky left-0 bg-white">
                      {member.name}
                    </td>
                    {allCapabilities.map((cap) => (
                      <td key={cap} className="px-3 py-3 text-center">
                        {member.capabilities.includes(cap) ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-gray-200">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {organization.members.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">暂无成员数据</p>
          )}
        </div>
      </FadeIn>

      {/* Philosophy */}
      <FadeIn delay={0.5}>
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-6 text-white">
          <h2 className="text-lg font-semibold mb-4">开源选型原则</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: '优先 CNCF 项目', desc: '云原生基金会毕业项目，经过生产验证' },
              { title: '社区活跃', desc: 'Stars > 1000，近期有提交，维护活跃' },
              { title: '大厂背书', desc: '有商业支持或被大公司广泛使用' },
              { title: '文档完善', desc: '文档齐全，生态丰富，易于上手' },
            ].map((item, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold">{i + 1}</span>
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm opacity-80">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </div>
  );
};

export default Tools;
