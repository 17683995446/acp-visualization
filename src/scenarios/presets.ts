/**
 * 预设场景定义
 * 包含多种模拟场景的初始数据，供用户快速加载
 */

import type { ScenarioSnapshot } from '../store/scenarioManager';

// ============ 预设 1：小团队敏捷开发 ============

const smallTeamSnapshot: ScenarioSnapshot = {
  tasks: [
    { id: 'task-s1-001', title: '需求分析', description: '分析用户需求，编写需求文档', status: 'completed', priority: 'P0', assignee: 'agent-s1-002', dependencies: [], progress: 100, estimatedTime: 120, createdAt: Date.now() - 172800000 },
    { id: 'task-s1-002', title: 'UI 原型设计', description: '设计产品 UI 原型和交互流程', status: 'in_progress', priority: 'P1', assignee: 'agent-s1-003', dependencies: ['task-s1-001'], progress: 60, estimatedTime: 240, createdAt: Date.now() - 86400000 },
    { id: 'task-s1-003', title: '后端 API 开发', description: '实现 RESTful API 接口', status: 'in_progress', priority: 'P1', assignee: 'agent-s1-004', dependencies: ['task-s1-001'], progress: 35, estimatedTime: 360, createdAt: Date.now() - 86400000 },
    { id: 'task-s1-004', title: '前端页面开发', description: '基于原型实现前端页面', status: 'pending', priority: 'P2', dependencies: ['task-s1-002'], progress: 0, estimatedTime: 300, createdAt: Date.now() - 43200000 },
    { id: 'task-s1-005', title: '集成测试', description: '前后端联调与集成测试', status: 'pending', priority: 'P2', dependencies: ['task-s1-003', 'task-s1-004'], progress: 0, estimatedTime: 180, createdAt: Date.now() },
    { id: 'task-s1-006', title: '部署上线', description: '部署到生产环境', status: 'pending', priority: 'P3', dependencies: ['task-s1-005'], progress: 0, estimatedTime: 60, createdAt: Date.now() },
    { id: 'task-s1-007', title: '编写技术文档', description: '编写 API 文档和使用手册', status: 'pending', priority: 'P3', dependencies: ['task-s1-003'], progress: 0, estimatedTime: 120, createdAt: Date.now() },
    { id: 'task-s1-008', title: '代码审查', description: '对核心模块进行代码审查', status: 'pending', priority: 'P2', dependencies: ['task-s1-003', 'task-s1-004'], progress: 0, estimatedTime: 90, createdAt: Date.now() },
    { id: 'task-s1-009', title: '性能优化', description: '优化系统性能瓶颈', status: 'pending', priority: 'P2', dependencies: ['task-s1-005'], progress: 0, estimatedTime: 240, createdAt: Date.now() },
    { id: 'task-s1-010', title: '用户验收测试', description: '邀请用户进行验收测试', status: 'pending', priority: 'P3', dependencies: ['task-s1-006'], progress: 0, estimatedTime: 120, createdAt: Date.now() },
  ],
  organization: {
    id: 'org-s1',
    name: '敏捷小队 Alpha',
    type: 'hybrid',
    mission: '快速迭代，交付高质量的 Web 应用',
    members: [
      { id: 'agent-s1-001', name: '张明 (PM)', role: 'manager', level: 7, reputation: 90, capabilities: ['项目管理', '需求分析', 'Scrum'], status: 'idle' },
      { id: 'agent-s1-002', name: '李华 (需求)', role: 'senior', level: 6, reputation: 85, capabilities: ['需求分析', '用户研究', '文档'], status: 'idle' },
      { id: 'agent-s1-003', name: '王芳 (设计)', role: 'mid', level: 5, reputation: 80, capabilities: ['UI设计', '原型', 'Figma'], status: 'busy', currentTask: 'task-s1-002' },
      { id: 'agent-s1-004', name: '赵强 (后端)', role: 'senior', level: 6, reputation: 88, capabilities: ['Java', 'Spring', '数据库', 'API设计'], status: 'busy', currentTask: 'task-s1-003' },
      { id: 'agent-s1-005', name: '陈静 (前端)', role: 'mid', level: 5, reputation: 76, capabilities: ['React', 'TypeScript', 'CSS'], status: 'idle' },
    ],
    departments: [
      { id: 'dept-s1-001', name: '产品组', head: 'agent-s1-001', members: ['agent-s1-001', 'agent-s1-002'], budget: 20000 },
      { id: 'dept-s1-002', name: '开发组', head: 'agent-s1-004', members: ['agent-s1-003', 'agent-s1-004', 'agent-s1-005'], budget: 40000 },
    ],
    performance: {
      tasksCompleted: 42,
      avgQuality: 4.5,
      onTimeRate: 0.88,
      tokenUsage: 800000,
      cost: 40.00,
    },
  },
  messages: [
    { id: 'msg-s1-001', from: 'agent-s1-001', to: 'agent-s1-003', type: 'notification', content: '需求文档已更新，请查看最新版本', timestamp: Date.now() - 3600000, read: true },
    { id: 'msg-s1-002', from: 'agent-s1-004', to: 'agent-s1-005', type: 'request', content: 'API 接口文档已就绪，可以开始前端对接', timestamp: Date.now() - 1800000, read: false },
  ],
  knowledgeNodes: [
    { id: 'kn-s1-001', type: 'concept', name: '敏捷开发', description: 'Scrum/Kanban 敏捷方法论', connections: ['kn-s1-002', 'kn-s1-003'] },
    { id: 'kn-s1-002', type: 'class', name: 'SprintBacklog', description: 'Sprint 待办事项列表', connections: ['kn-s1-001'] },
    { id: 'kn-s1-003', type: 'decision', name: '技术选型', description: 'React + Spring Boot 技术栈', connections: ['kn-s1-001'] },
  ],
  evaluationScores: [
    { dimension: '创新性', value: 75, max: 100, weight: 0.20, description: '采用敏捷开发流程' },
    { dimension: '创造性', value: 70, max: 100, weight: 0.15, description: '小团队高效协作模式' },
    { dimension: '价值量', value: 80, max: 100, weight: 0.20, description: '快速交付业务价值' },
    { dimension: '实用性', value: 85, max: 100, weight: 0.15, description: '成熟技术栈，易于维护' },
    { dimension: '易用性', value: 78, max: 100, weight: 0.10, description: '简洁的团队结构' },
    { dimension: '可维护性', value: 82, max: 100, weight: 0.10, description: '代码规范和文档完善' },
    { dimension: '可扩展性', value: 68, max: 100, weight: 0.10, description: '模块化设计支持扩展' },
  ],
  evaluation: {
    totalScore: 77,
    rating: 'good',
    scores: [],
    strengths: ['团队规模小，沟通高效', '敏捷流程成熟', '技术栈稳定可靠'],
    weaknesses: ['团队规模有限，并行能力不足', '缺少专门的测试人员', '知识储备较少'],
    recommendations: ['引入自动化测试流程', '建立知识共享机制', '考虑引入 CI/CD'],
  },
  schedulerConfig: {
    capabilityWeight: 0.35,
    reputationWeight: 0.20,
    workloadWeight: 0.25,
    priorityWeight: 0.20,
    preferIdleAgents: true,
  },
};

// ============ 预设 2：大规模分布式系统 ============

const largeScaleSnapshot: ScenarioSnapshot = {
  tasks: (() => {
    const tasks: ScenarioSnapshot['tasks'] = [];
    const taskTitles = [
      '微服务网关搭建', '用户认证服务', '权限管理系统', '订单服务开发', '支付服务集成',
      '消息队列配置', '分布式缓存设计', '数据库分库分表', '日志收集系统', '监控告警平台',
      'API 文档生成', '服务注册发现', '配置中心搭建', '灰度发布系统', '压力测试方案',
      '数据同步服务', '搜索引擎集成', '文件存储服务', '通知推送服务', '定时任务调度',
      '数据导出功能', '报表统计模块', '用户行为分析', 'A/B 测试平台', '容灾备份方案',
      '安全审计日志', '接口限流策略', '服务熔断降级', '链路追踪系统', '性能基准测试',
      '国际化支持', '多租户架构', '数据脱敏方案', 'API 版本管理', '文档站点搭建',
      '自动化部署', '容器化改造', '服务网格配置', '流量回放测试', '混沌工程实验',
      '数据迁移工具', 'ETL 管道搭建', '实时数仓建设', '离线数据分析', '数据质量监控',
      '模型训练服务', '特征工程平台', '推荐算法开发', '搜索排序优化', '智能客服集成',
    ];

    for (let i = 0; i < 50; i++) {
      const status = i < 10 ? 'completed' : i < 20 ? (i % 3 === 0 ? 'in_progress' : 'pending') : i % 5 === 0 ? 'blocked' : 'pending';
      const progress = status === 'completed' ? 100 : status === 'in_progress' ? Math.floor(Math.random() * 60 + 20) : 0;
      const priority = i < 5 ? 'P0' : i < 15 ? 'P1' : i < 35 ? 'P2' : 'P3';
      const deps: string[] = [];
      if (i > 0 && i % 3 === 0) deps.push(`task-s2-${String(i - 1).padStart(3, '0')}`);
      if (i > 2 && i % 5 === 0) deps.push(`task-s2-${String(i - 3).padStart(3, '0')}`);

      tasks.push({
        id: `task-s2-${String(i + 1).padStart(3, '0')}`,
        title: taskTitles[i] || `任务 ${i + 1}`,
        description: `${taskTitles[i] || '任务'}的详细描述`,
        status,
        priority,
        assignee: status === 'in_progress' ? `agent-s2-${String((i % 20) + 1).padStart(3, '0')}` : undefined,
        dependencies: deps,
        progress,
        estimatedTime: Math.floor(Math.random() * 480 + 60),
        createdAt: Date.now() - Math.floor(Math.random() * 604800000),
      });
    }
    return tasks;
  })(),
  organization: {
    id: 'org-s2',
    name: '分布式系统团队',
    type: 'corporate',
    mission: '构建高可用、高性能的分布式微服务系统',
    members: (() => {
      const roles: Array<{ role: string; name: string; capabilities: string[] }> = [
        { role: 'ceo', name: 'CEO', capabilities: ['战略规划', '资源分配', '决策'] },
        { role: 'cto', name: 'CTO', capabilities: ['架构设计', '技术战略', '创新研发'] },
        { role: 'coo', name: 'COO', capabilities: ['运营管理', '流程优化', '团队协调'] },
        { role: 'manager', name: 'PM-1', capabilities: ['项目管理', '需求分析', 'Scrum'] },
        { role: 'manager', name: 'PM-2', capabilities: ['项目管理', '风险管理', '沟通'] },
        { role: 'senior', name: '架构师-1', capabilities: ['系统架构', '微服务', '分布式'] },
        { role: 'senior', name: '架构师-2', capabilities: ['数据库', '缓存', '消息队列'] },
        { role: 'senior', name: '后端-1', capabilities: ['Java', 'Spring', '高并发'] },
        { role: 'senior', name: '后端-2', capabilities: ['Go', 'gRPC', '微服务'] },
        { role: 'mid', name: '后端-3', capabilities: ['Python', 'FastAPI', '数据处理'] },
        { role: 'mid', name: '后端-4', capabilities: ['Node.js', 'Express', 'REST'] },
        { role: 'mid', name: '前端-1', capabilities: ['React', 'TypeScript', '状态管理'] },
        { role: 'mid', name: '前端-2', capabilities: ['Vue', 'CSS', '组件开发'] },
        { role: 'junior', name: '前端-3', capabilities: ['HTML', 'CSS', 'JavaScript'] },
        { role: 'junior', name: '测试-1', capabilities: ['自动化测试', 'Selenium', 'JMeter'] },
        { role: 'junior', name: '测试-2', capabilities: ['接口测试', '性能测试', '安全测试'] },
        { role: 'mid', name: 'DevOps-1', capabilities: ['Docker', 'K8s', 'CI/CD'] },
        { role: 'mid', name: 'DevOps-2', capabilities: ['监控', '日志', '告警'] },
        { role: 'senior', name: 'DBA-1', capabilities: ['MySQL', 'Redis', 'MongoDB'] },
        { role: 'intern', name: '实习生-1', capabilities: ['学习', '辅助开发', '文档'] },
      ];

      return roles.map((r, i) => {
        const id = `agent-s2-${String(i + 1).padStart(3, '0')}`;
        const isBusy = i >= 5 && i < 10 && i % 2 === 0;
        return {
          id,
          name: `${r.name}`,
          role: r.role as ScenarioSnapshot['organization']['members'][0]['role'],
          level: r.role === 'ceo' || r.role === 'cto' || r.role === 'coo' ? 9 : r.role === 'manager' ? 7 : r.role === 'senior' ? 6 : r.role === 'mid' ? 5 : r.role === 'junior' ? 3 : 1,
          reputation: Math.floor(Math.random() * 30 + 60),
          capabilities: r.capabilities,
          status: (isBusy ? 'busy' : i === 19 ? 'offline' : 'idle') as 'idle' | 'busy' | 'offline',
          ...(isBusy ? { currentTask: `task-s2-${String((i % 10) + 11).padStart(3, '0')}` } : {}),
        };
      });
    })(),
    departments: [
      { id: 'dept-s2-001', name: '管理层', head: 'agent-s2-001', members: ['agent-s2-001', 'agent-s2-002', 'agent-s2-003'], budget: 100000 },
      { id: 'dept-s2-002', name: '产品部', head: 'agent-s2-004', members: ['agent-s2-004', 'agent-s2-005'], budget: 30000 },
      { id: 'dept-s2-003', name: '架构组', head: 'agent-s2-006', members: ['agent-s2-006', 'agent-s2-007'], budget: 50000 },
      { id: 'dept-s2-004', name: '后端组', head: 'agent-s2-008', members: ['agent-s2-008', 'agent-s2-009', 'agent-s2-010', 'agent-s2-011'], budget: 80000 },
      { id: 'dept-s2-005', name: '前端组', head: 'agent-s2-012', members: ['agent-s2-012', 'agent-s2-013', 'agent-s2-014'], budget: 50000 },
      { id: 'dept-s2-006', name: '测试组', head: 'agent-s2-015', members: ['agent-s2-015', 'agent-s2-016'], budget: 30000 },
      { id: 'dept-s2-007', name: 'DevOps', head: 'agent-s2-017', members: ['agent-s2-017', 'agent-s2-018'], budget: 40000 },
      { id: 'dept-s2-008', name: 'DBA', head: 'agent-s2-019', members: ['agent-s2-019'], budget: 30000 },
    ],
    performance: {
      tasksCompleted: 523,
      avgQuality: 4.1,
      onTimeRate: 0.78,
      tokenUsage: 15000000,
      cost: 750.00,
    },
  },
  messages: [
    { id: 'msg-s2-001', from: 'agent-s2-006', to: 'agent-s2-008', type: 'request', content: '微服务网关方案需要评审，请安排时间', timestamp: Date.now() - 7200000, read: true },
    { id: 'msg-s2-002', from: 'agent-s2-008', to: 'agent-s2-010', type: 'notification', content: '订单服务接口已更新，请同步修改调用方', timestamp: Date.now() - 3600000, read: false },
    { id: 'msg-s2-003', from: 'agent-s2-015', to: 'agent-s2-008', type: 'response', content: '订单服务压力测试报告已完成，发现 3 个性能瓶颈', timestamp: Date.now() - 1800000, read: false },
  ],
  knowledgeNodes: [
    { id: 'kn-s2-001', type: 'concept', name: '微服务架构', description: '分布式微服务系统架构设计', connections: ['kn-s2-002', 'kn-s2-003', 'kn-s2-004'] },
    { id: 'kn-s2-002', type: 'class', name: 'APIGateway', description: '统一 API 网关服务', connections: ['kn-s2-001'] },
    { id: 'kn-s2-003', type: 'class', name: 'ServiceRegistry', description: '服务注册与发现', connections: ['kn-s2-001'] },
    { id: 'kn-s2-004', type: 'decision', name: '通信协议', description: 'gRPC vs REST 通信协议选择', connections: ['kn-s2-001'] },
    { id: 'kn-s2-005', type: 'class', name: 'MessageQueue', description: '消息队列服务', connections: ['kn-s2-001'] },
    { id: 'kn-s2-006', type: 'function', name: 'circuitBreaker', description: '熔断器模式实现', connections: ['kn-s2-005'] },
  ],
  evaluationScores: [
    { dimension: '创新性', value: 92, max: 100, weight: 0.20, description: '先进的微服务架构设计' },
    { dimension: '创造性', value: 88, max: 100, weight: 0.15, description: '多团队协作模式创新' },
    { dimension: '价值量', value: 95, max: 100, weight: 0.20, description: '解决大规模系统核心问题' },
    { dimension: '实用性', value: 80, max: 100, weight: 0.15, description: '架构复杂，实施难度较高' },
    { dimension: '易用性', value: 65, max: 100, weight: 0.10, description: '系统复杂度高，学习成本大' },
    { dimension: '可维护性', value: 75, max: 100, weight: 0.10, description: '模块化设计但依赖关系复杂' },
    { dimension: '可扩展性', value: 95, max: 100, weight: 0.10, description: '高度可扩展的分布式架构' },
  ],
  evaluation: {
    totalScore: 85,
    rating: 'excellent',
    scores: [],
    strengths: ['架构设计先进', '团队规模充足', '技术栈全面', '可扩展性强'],
    weaknesses: ['系统复杂度高', '团队沟通成本大', '部分模块进度滞后', '测试覆盖率不足'],
    recommendations: ['简化非核心模块', '加强跨团队沟通机制', '提高自动化测试覆盖率', '建立技术债务管理流程'],
  },
  schedulerConfig: {
    capabilityWeight: 0.30,
    reputationWeight: 0.15,
    workloadWeight: 0.30,
    priorityWeight: 0.25,
    preferIdleAgents: true,
  },
};

// ============ 预设 3：危机恢复场景 ============

const crisisSnapshot: ScenarioSnapshot = {
  tasks: [
    { id: 'task-s3-001', title: '数据库主从切换', description: '主库故障，紧急切换到从库', status: 'failed', priority: 'P0', dependencies: [], progress: 80, estimatedTime: 60, createdAt: Date.now() - 7200000 },
    { id: 'task-s3-002', title: '修复支付服务', description: '支付服务内存泄漏导致频繁重启', status: 'failed', priority: 'P0', dependencies: [], progress: 45, estimatedTime: 180, createdAt: Date.now() - 10800000 },
    { id: 'task-s3-003', title: '恢复用户数据', description: '部分用户数据丢失，需要从备份恢复', status: 'in_progress', priority: 'P0', assignee: 'agent-s3-004', dependencies: ['task-s3-001'], progress: 30, estimatedTime: 240, createdAt: Date.now() - 5400000 },
    { id: 'task-s3-004', title: '排查消息队列积压', description: '消息队列大量消息积压', status: 'in_progress', priority: 'P0', assignee: 'agent-s3-005', dependencies: [], progress: 20, estimatedTime: 120, createdAt: Date.now() - 3600000 },
    { id: 'task-s3-005', title: '重启缓存集群', description: 'Redis 集群部分节点宕机', status: 'pending', priority: 'P0', dependencies: [], progress: 0, estimatedTime: 90, createdAt: Date.now() - 1800000 },
    { id: 'task-s3-006', title: '编写事故报告', description: '整理事故时间线和影响范围', status: 'pending', priority: 'P1', dependencies: ['task-s3-001', 'task-s3-002'], progress: 0, estimatedTime: 180, createdAt: Date.now() },
    { id: 'task-s3-007', title: '优化告警规则', description: '完善监控告警，防止类似问题', status: 'pending', priority: 'P1', dependencies: ['task-s3-006'], progress: 0, estimatedTime: 120, createdAt: Date.now() },
    { id: 'task-s3-008', title: '客户补偿方案', description: '制定受影响客户的补偿方案', status: 'pending', priority: 'P1', dependencies: ['task-s3-003'], progress: 0, estimatedTime: 60, createdAt: Date.now() },
    { id: 'task-s3-009', title: '压力测试验证', description: '修复后进行全链路压力测试', status: 'pending', priority: 'P2', dependencies: ['task-s3-002', 'task-s3-003', 'task-s3-005'], progress: 0, estimatedTime: 360, createdAt: Date.now() },
    { id: 'task-s3-010', title: '复盘会议', description: '组织全团队复盘，总结教训', status: 'pending', priority: 'P2', dependencies: ['task-s3-006', 'task-s3-009'], progress: 0, estimatedTime: 120, createdAt: Date.now() },
  ],
  organization: {
    id: 'org-s3',
    name: '应急响应团队',
    type: 'corporate',
    mission: '紧急处理系统故障，恢复服务正常运行',
    members: [
      { id: 'agent-s3-001', name: '王总 (CTO)', role: 'cto', level: 9, reputation: 95, capabilities: ['架构设计', '故障排查', '决策'], status: 'busy', currentTask: 'task-s3-002' },
      { id: 'agent-s3-002', name: '李工 (DBA)', role: 'senior', level: 6, reputation: 82, capabilities: ['MySQL', 'Redis', '数据恢复'], status: 'busy', currentTask: 'task-s3-003' },
      { id: 'agent-s3-003', name: '张工 (运维)', role: 'senior', level: 6, reputation: 80, capabilities: ['Linux', 'Docker', 'K8s', '监控'], status: 'idle' },
      { id: 'agent-s3-004', name: '赵工 (后端)', role: 'mid', level: 5, reputation: 70, capabilities: ['Java', '排查', '性能优化'], status: 'busy', currentTask: 'task-s3-003' },
      { id: 'agent-s3-005', name: '刘工 (MQ)', role: 'mid', level: 5, reputation: 75, capabilities: ['Kafka', 'RabbitMQ', '消息处理'], status: 'busy', currentTask: 'task-s3-004' },
      { id: 'agent-s3-006', name: '陈工 (前端)', role: 'mid', level: 5, reputation: 68, capabilities: ['React', '错误处理', '降级方案'], status: 'idle' },
      { id: 'agent-s3-007', name: '周工 (测试)', role: 'junior', level: 3, reputation: 60, capabilities: ['测试', '压力测试', '自动化'], status: 'idle' },
      { id: 'agent-s3-008', name: '吴助理', role: 'intern', level: 1, reputation: 45, capabilities: ['文档', '辅助', '日志分析'], status: 'offline' },
    ],
    departments: [
      { id: 'dept-s3-001', name: '应急指挥', head: 'agent-s3-001', members: ['agent-s3-001', 'agent-s3-003'], budget: 50000 },
      { id: 'dept-s3-002', name: '技术修复', head: 'agent-s3-002', members: ['agent-s3-002', 'agent-s3-004', 'agent-s3-005'], budget: 40000 },
      { id: 'dept-s3-003', name: '支持组', head: 'agent-s3-006', members: ['agent-s3-006', 'agent-s3-007', 'agent-s3-008'], budget: 20000 },
    ],
    performance: {
      tasksCompleted: 89,
      avgQuality: 3.8,
      onTimeRate: 0.65,
      tokenUsage: 3000000,
      cost: 150.00,
    },
  },
  messages: [
    { id: 'msg-s3-001', from: 'agent-s3-001', to: 'agent-s3-003', type: 'notification', content: '紧急：主库宕机，立即启动容灾方案', timestamp: Date.now() - 7200000, read: true },
    { id: 'msg-s3-002', from: 'agent-s3-002', to: 'agent-s3-001', type: 'request', content: '主从切换失败，从库数据有延迟，需要手动修复', timestamp: Date.now() - 5400000, read: true },
    { id: 'msg-s3-003', from: 'agent-s3-005', to: 'agent-s3-001', type: 'notification', content: '消息队列积压超过 100 万条，正在紧急消费', timestamp: Date.now() - 3600000, read: false },
    { id: 'msg-s3-004', from: 'agent-s3-003', to: 'agent-s3-001', type: 'response', content: 'Redis 集群已定位问题节点，准备重启', timestamp: Date.now() - 1800000, read: false },
  ],
  knowledgeNodes: [
    { id: 'kn-s3-001', type: 'decision', name: '容灾方案', description: '数据库容灾切换方案', connections: ['kn-s3-002'] },
    { id: 'kn-s3-002', type: 'class', name: 'FailoverManager', description: '故障转移管理器', connections: ['kn-s3-001'] },
    { id: 'kn-s3-003', type: 'concept', name: '事故分级', description: 'P0-P3 事故分级标准', connections: ['kn-s3-001'] },
  ],
  evaluationScores: [
    { dimension: '创新性', value: 60, max: 100, weight: 0.20, description: '应急处理方案' },
    { dimension: '创造性', value: 55, max: 100, weight: 0.15, description: '资源重新分配策略' },
    { dimension: '价值量', value: 70, max: 100, weight: 0.20, description: '快速恢复服务减少损失' },
    { dimension: '实用性', value: 75, max: 100, weight: 0.15, description: '实用的故障处理流程' },
    { dimension: '易用性', value: 50, max: 100, weight: 0.10, description: '高压环境下操作复杂' },
    { dimension: '可维护性', value: 65, max: 100, weight: 0.10, description: '需要完善事后文档' },
    { dimension: '可扩展性', value: 70, max: 100, weight: 0.10, description: '应急流程可复用' },
  ],
  evaluation: {
    totalScore: 64,
    rating: 'acceptable',
    scores: [],
    strengths: ['快速响应', '团队协作紧密', '关键人员到位及时'],
    weaknesses: ['预防措施不足', '自动化程度低', '监控告警不完善', '知识文档缺失'],
    recommendations: ['建立完善的监控告警体系', '制定详细的应急预案', '提高系统自动化程度', '定期进行故障演练'],
  },
  schedulerConfig: {
    capabilityWeight: 0.40,
    reputationWeight: 0.15,
    workloadWeight: 0.20,
    priorityWeight: 0.25,
    preferIdleAgents: true,
  },
};

// ============ 预设 4：空项目启动 ============

const emptyProjectSnapshot: ScenarioSnapshot = {
  tasks: [],
  organization: {
    id: 'org-empty',
    name: '新项目',
    type: 'hybrid',
    mission: '从零开始构建团队和项目',
    members: [],
    departments: [],
    performance: {
      tasksCompleted: 0,
      avgQuality: 0,
      onTimeRate: 0,
      tokenUsage: 0,
      cost: 0,
    },
  },
  messages: [],
  knowledgeNodes: [],
  evaluationScores: [
    { dimension: '创新性', value: 0, max: 100, weight: 0.20, description: '待评估' },
    { dimension: '创造性', value: 0, max: 100, weight: 0.15, description: '待评估' },
    { dimension: '价值量', value: 0, max: 100, weight: 0.20, description: '待评估' },
    { dimension: '实用性', value: 0, max: 100, weight: 0.15, description: '待评估' },
    { dimension: '易用性', value: 0, max: 100, weight: 0.10, description: '待评估' },
    { dimension: '可维护性', value: 0, max: 100, weight: 0.10, description: '待评估' },
    { dimension: '可扩展性', value: 0, max: 100, weight: 0.10, description: '待评估' },
  ],
  evaluation: {
    totalScore: 0,
    rating: 'needs_improvement',
    scores: [],
    strengths: [],
    weaknesses: [],
    recommendations: [],
  },
  schedulerConfig: {
    capabilityWeight: 0.35,
    reputationWeight: 0.20,
    workloadWeight: 0.25,
    priorityWeight: 0.20,
    preferIdleAgents: true,
  },
};

// ============ 导出 ============

export interface PresetScenario {
  name: string;
  description: string;
  snapshot: ScenarioSnapshot;
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    name: '小团队敏捷开发',
    description: '5人小团队，10个任务，模拟敏捷开发流程',
    snapshot: smallTeamSnapshot,
  },
  {
    name: '大规模分布式系统',
    description: '20人团队，50个任务，复杂依赖关系',
    snapshot: largeScaleSnapshot,
  },
  {
    name: '危机恢复场景',
    description: '多个任务失败，需要重新分配资源',
    snapshot: crisisSnapshot,
  },
  {
    name: '空项目启动',
    description: '空白状态，从零开始构建团队和任务',
    snapshot: emptyProjectSnapshot,
  },
];
