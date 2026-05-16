// Agent Cluster Platform Types

// ============ Organization Types ============

export type OrgType = 'corporate' | 'social' | 'hybrid';

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  mission: string;
  members: Member[];
  departments: Department[];
  performance: PerformanceMetrics;
}

export interface Member {
  id: string;
  name: string;
  role: Role;
  level: number;
  reputation: number;
  capabilities: string[];
  status: 'idle' | 'busy' | 'offline';
  currentTask?: string;
}

export type Role = 
  | 'ceo' | 'cto' | 'coo' | 'cqo'
  | 'manager' | 'senior' | 'mid' | 'junior' | 'intern'
  | 'maintainer' | 'collaborator' | 'contributor';

export interface Department {
  id: string;
  name: string;
  head: string;
  members: string[];
  budget: number;
}

export interface PerformanceMetrics {
  tasksCompleted: number;
  avgQuality: number;
  onTimeRate: number;
  tokenUsage: number;
  cost: number;
}

// ============ Task Types ============

export type TaskStatus = 'pending' | 'scheduled' | 'in_progress' | 'blocked' | 'completed' | 'failed';
export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  dependencies: string[];
  progress: number;
  estimatedTime: number;
  actualTime?: number;
  createdAt: number;
  deadline?: number;
}

// ============ Communication Types ============

export interface Message {
  id: string;
  from: string;
  to: string;
  type: 'task' | 'notification' | 'request' | 'response';
  content: string;
  timestamp: number;
  read?: boolean;
}

// ============ Knowledge Types ============

export interface KnowledgeNode {
  id: string;
  type: 'file' | 'function' | 'class' | 'concept' | 'decision';
  name: string;
  description: string;
  connections: string[];
}

// ============ Scoring Types ============

export interface Score {
  dimension: string;
  value: number;
  max: number;
  weight: number;
  description: string;
}

export interface Evaluation {
  totalScore: number;
  rating: 'exceptional' | 'excellent' | 'good' | 'acceptable' | 'needs_improvement';
  scores: Score[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}
