import type { KnowledgeNode, Evaluation, Score } from '../types';

// Re-export organization and tasks from initialData (single source of truth)
export { initialOrganization as demoOrganization, initialTasks as demoTasks } from '../store/initialData';

// ============ Demo Knowledge Graph ============

export const demoKnowledgeGraph: KnowledgeNode[] = [
  { id: 'kn-001', type: 'file', name: 'OrganizationService.ts', description: '组织服务核心实现', connections: ['kn-002', 'kn-003'] },
  { id: 'kn-002', type: 'class', name: 'CorporateOrgService', description: '公司模式组织服务', connections: ['kn-004'] },
  { id: 'kn-003', type: 'class', name: 'SocialOrgService', description: '社会模式组织服务', connections: ['kn-005'] },
  { id: 'kn-004', type: 'function', name: 'createDepartment', description: '创建部门', connections: [] },
  { id: 'kn-005', type: 'function', name: 'createCommunity', description: '创建社区', connections: [] },
  { id: 'kn-006', type: 'concept', name: 'Agent Cluster', description: 'Agent 集群概念', connections: ['kn-001', 'kn-007'] },
  { id: 'kn-007', type: 'decision', name: 'ADR-001', description: '选择 Kafka 作为消息队列', connections: ['kn-008'] },
  { id: 'kn-008', type: 'file', name: 'KafkaAdapter.ts', description: 'Kafka 适配器实现', connections: [] },
];

// ============ Evaluation Scores ============

export const evaluationScores: Score[] = [
  { dimension: '创新性', value: 14, max: 15, weight: 0.15, description: '统一消息总线、分层调度、四层记忆、跨机器集群' },
  { dimension: '创造性', value: 13, max: 15, weight: 0.15, description: '流适配器模式、Feature Flag 驱动、配额管理' },
  { dimension: '价值量', value: 17, max: 20, weight: 0.20, description: '500x 通信提升、跨机器扩展、资源可控、企业级可观测' },
  { dimension: '实用性', value: 17, max: 20, weight: 0.20, description: '成熟开源工具、渐进演进、代码兼容、完整测试' },
  { dimension: '易用性', value: 12, max: 15, weight: 0.15, description: '清晰 CLI、配置驱动、完善文档' },
  { dimension: '可维护性', value: 9, max: 10, weight: 0.10, description: '模块化架构、开源工具、测试覆盖' },
  { dimension: '可扩展性', value: 5, max: 5, weight: 0.05, description: '水平扩展、插件架构、开放接口' },
];

export const evaluation: Evaluation = {
  totalScore: 87,
  rating: 'excellent',
  scores: evaluationScores,
  strengths: [
    '基于成熟开源工具，降低维护成本',
    '模块化架构，易于扩展和替换',
    '完整的测试体系，保证质量',
    '渐进式演进路径，降低采用风险',
    '企业级可观测性，便于运维'
  ],
  weaknesses: [
    '基础设施依赖较重 (Kafka, Neo4j 等)',
    '概念较多，学习曲线较陡',
    '对小型项目可能过度设计',
    '跨机器通信安全性待加强',
    '调试分布式系统较困难'
  ],
  recommendations: [
    '提供托管云服务，降低部署门槛',
    '增加交互式教程和模板市场',
    '实现轻量级模式 (单机 SQLite)',
    '增强可观测性和调试工具',
    '完善安全模型和权限控制'
  ]
};

// ============ Open Source Tools ============

export interface OpenSourceTool {
  name: string;
  category: string;
  description: string;
  url: string;
  stars: number;
  license: string;
}

export const openSourceTools: OpenSourceTool[] = [
  { name: 'Apache Kafka', category: '消息队列', description: '高吞吐分布式消息系统', url: 'https://kafka.apache.org', stars: 28000, license: 'Apache-2.0' },
  { name: 'Temporal', category: '工作流引擎', description: '持久化工作流编排', url: 'https://temporal.io', stars: 12000, license: 'MIT' },
  { name: 'Neo4j', category: '知识图谱', description: '原生图数据库', url: 'https://neo4j.com', stars: 13000, license: 'GPL-3.0' },
  { name: 'Milvus', category: '向量检索', description: '云原生向量数据库', url: 'https://milvus.io', stars: 31000, license: 'Apache-2.0' },
  { name: 'OpenTelemetry', category: '可观测性', description: '统一可观测性框架', url: 'https://opentelemetry.io', stars: 5000, license: 'Apache-2.0' },
  { name: 'Jaeger', category: '分布式追踪', description: '端到端分布式追踪', url: 'https://jaegertracing.io', stars: 20000, license: 'Apache-2.0' },
  { name: 'Prometheus', category: '指标监控', description: '时序数据库和监控系统', url: 'https://prometheus.io', stars: 55000, license: 'Apache-2.0' },
  { name: 'Grafana', category: '可视化', description: '开源分析和监控平台', url: 'https://grafana.com', stars: 64000, license: 'AGPL-3.0' },
  { name: 'Redis', category: '缓存/锁', description: '内存数据结构存储', url: 'https://redis.io', stars: 67000, license: 'BSD-3-Clause' },
  { name: 'PostgreSQL', category: '关系数据库', description: '高级开源关系数据库', url: 'https://postgresql.org', stars: 15000, license: 'PostgreSQL' },
  { name: 'Vitest', category: '测试框架', description: '下一代测试框架', url: 'https://vitest.dev', stars: 13000, license: 'MIT' },
  { name: 'Playwright', category: 'E2E测试', description: '跨浏览器自动化', url: 'https://playwright.dev', stars: 65000, license: 'Apache-2.0' },
];
