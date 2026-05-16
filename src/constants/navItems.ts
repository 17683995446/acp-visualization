import {
  LayoutDashboard,
  Users,
  ListTodo,
  GitBranch,
  BarChart3,
  Wrench,
  GitCompare,
  MessageSquare,
  Network,
} from 'lucide-react';

export const navItems = [
  { to: '/', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/organization', icon: Users, label: '组织管理' },
  { to: '/tasks', icon: ListTodo, label: '任务中心' },
  { to: '/messages', icon: MessageSquare, label: '消息中心' },
  { to: '/knowledge', icon: Network, label: '知识图谱' },
  { to: '/architecture', icon: GitBranch, label: '架构设计' },
  { to: '/comparison', icon: GitCompare, label: '方案对比' },
  { to: '/evaluation', icon: BarChart3, label: '综合评分' },
  { to: '/tools', icon: Wrench, label: '开源工具' },
];
