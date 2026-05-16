/**
 * ACP 初始数据
 * 从 acpStore.ts 提取，集中管理所有初始状态
 */

import type {
  Organization,
  Task,
  KnowledgeNode,
  Score,
  Evaluation,
} from '../types';

export const initialOrganization: Organization = {
  id: 'org-001',
  name: 'ACP Demo Corp',
  type: 'hybrid',
  mission: '构建下一代 Agent 集群协作平台，实现智能体之间的高效协同',
  members: [
    { id: 'agent-001', name: 'Alex (CEO)', role: 'ceo', level: 8, reputation: 95, capabilities: ['战略规划', '决策', '资源分配'], status: 'idle' },
    { id: 'agent-002', name: 'Beth (CTO)', role: 'cto', level: 7, reputation: 92, capabilities: ['架构设计', '技术评审', '创新研发'], status: 'busy', currentTask: 'task-001' },
    { id: 'agent-003', name: 'Carl (COO)', role: 'coo', level: 7, reputation: 88, capabilities: ['运营管理', '流程优化', '团队协调'], status: 'idle' },
    { id: 'agent-004', name: 'Diana (Senior)', role: 'senior', level: 6, reputation: 85, capabilities: ['全栈开发', '代码审查', '性能优化'], status: 'busy', currentTask: 'task-002' },
    { id: 'agent-005', name: 'Eve (Mid)', role: 'mid', level: 5, reputation: 78, capabilities: ['前端开发', 'UI设计', '组件开发'], status: 'idle' },
    { id: 'agent-006', name: 'Frank (Mid)', role: 'mid', level: 5, reputation: 75, capabilities: ['后端开发', 'API设计', '数据库'], status: 'idle' },
    { id: 'agent-007', name: 'Grace (Junior)', role: 'junior', level: 3, reputation: 65, capabilities: ['测试', '文档', '基础开发'], status: 'idle' },
    { id: 'agent-008', name: 'Henry (Intern)', role: 'intern', level: 1, reputation: 50, capabilities: ['学习', '辅助开发', '代码整理'], status: 'offline' },
  ],
  departments: [
    { id: 'dept-001', name: '技术部', head: 'agent-002', members: ['agent-002', 'agent-004', 'agent-005', 'agent-006', 'agent-007', 'agent-008'], budget: 50000 },
    { id: 'dept-002', name: '后端组', head: 'agent-004', members: ['agent-004', 'agent-006'], budget: 20000 },
    { id: 'dept-003', name: '前端组', head: 'agent-005', members: ['agent-005', 'agent-007'], budget: 15000 },
  ],
  performance: {
    tasksCompleted: 156,
    avgQuality: 4.3,
    onTimeRate: 0.92,
    tokenUsage: 2500000,
    cost: 125.50,
  },
};

export const initialTasks: Task[] = [
  { id: 'task-001', title: '设计系统架构', description: '设计 ACP 平台的整体系统架构，包括微服务划分、通信协议、数据流', status: 'in_progress', priority: 'P0', assignee: 'agent-002', dependencies: [], progress: 65, estimatedTime: 480, createdAt: Date.now() - 86400000 },
  { id: 'task-002', title: '实现消息队列', description: '基于事件驱动架构实现 Agent 间消息队列系统', status: 'in_progress', priority: 'P1', assignee: 'agent-004', dependencies: ['task-001'], progress: 40, estimatedTime: 360, createdAt: Date.now() - 72000000 },
  { id: 'task-003', title: '构建知识图谱', description: '实现代码库知识图谱，支持语义搜索和关联发现', status: 'pending', priority: 'P1', dependencies: ['task-001'], progress: 0, estimatedTime: 600, createdAt: Date.now() - 36000000 },
  { id: 'task-004', title: '前端可视化', description: '开发实时监控仪表盘和组织管理界面', status: 'pending', priority: 'P2', dependencies: ['task-002'], progress: 0, estimatedTime: 480, createdAt: Date.now() - 18000000 },
  { id: 'task-005', title: '单元测试覆盖', description: '为核心模块编写全面的单元测试和集成测试', status: 'pending', priority: 'P2', dependencies: ['task-002', 'task-003'], progress: 0, estimatedTime: 240, createdAt: Date.now() },
];

export const initialKnowledgeNodes: KnowledgeNode[] = [
  { id: 'kn-001', type: 'concept', name: 'ACP', description: 'Agent Cluster Platform - Agent 集群协作平台', connections: ['kn-002', 'kn-003'] },
  { id: 'kn-002', type: 'class', name: 'QueryEngine', description: '核心查询引擎，处理 Agent Loop', connections: ['kn-004', 'kn-005'] },
  { id: 'kn-003', type: 'class', name: 'Coordinator', description: 'Agent 协调器，管理多 Agent 协作', connections: ['kn-002'] },
  { id: 'kn-004', type: 'function', name: 'submitMessage', description: '提交消息到查询引擎', connections: ['kn-002'] },
  { id: 'kn-005', type: 'function', name: 'executeTools', description: '执行工具调用', connections: ['kn-002', 'kn-006'] },
  { id: 'kn-006', type: 'class', name: 'ToolRegistry', description: '工具注册表，管理所有可用工具', connections: ['kn-005'] },
  { id: 'kn-007', type: 'decision', name: 'ACP协议选择', description: '选择 CAF/ASI/OCS 架构模式', connections: ['kn-001'] },
  { id: 'kn-008', type: 'file', name: 'services/acp/', description: 'ACP 协议服务实现目录', connections: ['kn-001', 'kn-003'] },
];

export const initialEvaluationScores: Score[] = [
  { dimension: '创新性', value: 90, max: 100, weight: 0.20, description: 'CAF/ASI/OCS 三种创新架构模式' },
  { dimension: '创造性', value: 88, max: 100, weight: 0.15, description: '组织协作+社会协作混合模式设计' },
  { dimension: '价值量', value: 92, max: 100, weight: 0.20, description: '解决多Agent协作核心痛点' },
  { dimension: '实用性', value: 85, max: 100, weight: 0.15, description: '基于成熟开源工具链构建' },
  { dimension: '易用性', value: 82, max: 100, weight: 0.10, description: '可视化界面+实时监控' },
  { dimension: '可维护性', value: 88, max: 100, weight: 0.10, description: '模块化设计，清晰接口定义' },
  { dimension: '可扩展性', value: 90, max: 100, weight: 0.10, description: '插件化架构，支持自定义扩展' },
];

export const initialEvaluation: Evaluation = {
  totalScore: 87,
  rating: 'excellent',
  scores: initialEvaluationScores,
  strengths: [
    '创新的三层架构设计（CAF/ASI/OCS）',
    '完整的多Agent协作生命周期管理',
    '基于事件驱动的实时通信系统',
    '高度模块化的服务层设计',
    '丰富的开源工具集成',
  ],
  weaknesses: [
    '缺少真实后端服务对接',
    '知识图谱可视化尚未实现',
    '消息系统仅定义未使用',
    '缺少认证授权机制',
    '性能优化空间较大',
  ],
  recommendations: [
    '接入真实 LLM API 实现智能调度',
    '集成 D3.js/Cytoscape 实现知识图谱可视化',
    '添加 WebSocket 实现实时通信',
    '实现 RBAC 权限管理系统',
    '添加性能监控和告警机制',
  ],
};
