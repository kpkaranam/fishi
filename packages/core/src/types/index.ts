export type ProjectType = 'greenfield' | 'brownfield' | 'hybrid';
export type CostMode = 'performance' | 'balanced' | 'economy';
export type ModelTier = 'opus' | 'sonnet' | 'haiku';
export type TaskStatus = 'backlog' | 'ready' | 'in_progress' | 'review' | 'done' | 'blocked';
export type GateStatus = 'pending' | 'approved' | 'rejected' | 'skipped';
export type AgentRole = 'master' | 'coordinator' | 'worker';

export interface FishiConfig {
  version: string;
  project: ProjectConfig;
  execution: ExecutionConfig;
  cost_mode: CostMode;
  model_routing: ModelRoutingConfig;
  git: GitConfig;
  gates: GateConfig;
  taskboard: TaskboardConfig;
  state: StateConfig;
  dynamic_agents: DynamicAgentConfig;
  mcp: McpConfig;
  plugins: string[];
}

export interface ProjectConfig {
  name: string;
  description: string;
  type: ProjectType;
  language?: string;
  framework?: string;
}

export interface ExecutionConfig {
  mode: 'cli' | 'headless' | 'api';
  parallel: boolean;
  max_parallel: number;
}

export interface ModelRoutingConfig {
  opus: string[];
  sonnet: string[];
  haiku: string[];
}

export interface GitConfig {
  strategy: 'auto' | 'single-branch' | 'milestone-branch' | 'worktree-per-agent';
  main_branch: string;
  dev_branch: string;
  worktree_dir: string;
  auto_commit: boolean;
  commit_prefix: boolean;
}

export interface GateConfig {
  enabled: boolean;
  gate_points: string[];
}

export interface TaskboardConfig {
  enabled: boolean;
  auto_update: boolean;
  sprint_duration: 'auto' | '1week' | '2weeks';
}

export interface StateConfig {
  checkpoint_on_stop: boolean;
  max_checkpoints: number;
  compress_after_sprint: boolean;
}

export interface DynamicAgentConfig {
  enabled: boolean;
  require_approval: boolean;
}

export interface McpConfig {
  auto_discover: boolean;
  core: string[];
  project: McpServerConfig[];
  agent_access: Record<string, string[]>;
}

export interface McpServerConfig {
  name: string;
  env?: Record<string, string>;
}

export interface AgentDefinition {
  name: string;
  description: string;
  role: AgentRole;
  tools: string[];
  model: ModelTier;
  isolation?: 'worktree';
  manages?: string[];
  reports_to?: string;
}

export interface DetectionResult {
  type: ProjectType;
  checks: DetectionCheck[];
  confidence: number;
}

export interface DetectionCheck {
  check: string;
  passed: boolean;
  evidence?: string;
}

export interface InitOptions {
  description?: string;
  interactive: boolean;
  costMode: CostMode;
  language?: string;
  framework?: string;
}
