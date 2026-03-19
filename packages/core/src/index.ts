// Types
export type {
  ProjectType,
  CostMode,
  ModelTier,
  TaskStatus,
  GateStatus,
  AgentRole,
  FishiConfig,
  ProjectConfig,
  ExecutionConfig,
  ModelRoutingConfig,
  GitConfig,
  GateConfig,
  TaskboardConfig,
  StateConfig,
  DynamicAgentConfig,
  McpConfig,
  McpServerConfig,
  AgentDefinition,
  DetectionResult,
  DetectionCheck,
  InitOptions,
} from './types/index';

export type {
  TemplateContext,
  AgentTemplate,
  SkillTemplate,
  HookTemplate,
  CommandTemplate,
} from './types/templates';

// Agent templates (all agents and coordinators via barrel)
export {
  getMasterOrchestratorTemplate,
  planningLeadTemplate,
  devLeadTemplate,
  qualityLeadTemplate,
  opsLeadTemplate,
  researchAgentTemplate,
  planningAgentTemplate,
  architectAgentTemplate,
  backendAgentTemplate,
  frontendAgentTemplate,
  uiuxAgentTemplate,
  fullstackAgentTemplate,
  devopsAgentTemplate,
  testingAgentTemplate,
  securityAgentTemplate,
  docsAgentTemplate,
  writingAgentTemplate,
  marketingAgentTemplate,
} from './templates/agents/index';

// Skill templates
export {
  getBrainstormingSkill,
  getBrownfieldAnalysisSkill,
  getTaskboardOpsSkill,
  getCodeGenSkill,
  getDebuggingSkill,
  getApiDesignSkill,
  getTestingSkill,
  getDeploymentSkill,
  getPrdSkill,
  getBrownfieldDiscoverySkill,
  getAdaptiveTaskGraphSkill,
  getDocumentationSkill,
} from './templates/skills/index';

// Hook templates
export {
  getSessionStartHook,
  getAutoCheckpointHook,
  getAgentCompleteHook,
  getPostEditHook,
  getSafetyCheckHook,
  getWorktreeSetupHook,
  getTaskboardUpdateHook,
  getWorktreeManagerScript,
  getGateManagerScript,
  getValidateScaffoldScript,
  getPhaseRunnerScript,
  getTodoManagerScript,
  getMemoryManagerScript,
  getLearningsManagerScript,
  getDocCheckerScript,
} from './templates/hooks/index';

// Command templates
export {
  getInitCommand,
  getStatusCommand,
  getResumeCommand,
  getGateCommand,
  getBoardCommand,
  getSprintCommand,
  getResetCommand,
  getPrdCommand,
} from './templates/commands/index';

// Config templates
export {
  getFishiYamlTemplate,
  getSettingsJsonTemplate,
  getClaudeMdTemplate,
  getMcpJsonTemplate,
  getProjectYamlTemplate,
  getAgentRegistryTemplate,
  getGitignoreAdditions,
  getModelRoutingReference,
} from './templates/configs/index';

export type {
  FishiYamlOptions,
  ClaudeMdOptions,
  BrownfieldAnalysisData,
  ProjectYamlOptions,
} from './templates/configs/index';

// Factory templates
export {
  getAgentFactoryTemplate,
  getCoordinatorFactoryTemplate,
} from './templates/factories/index';

// Generators
export { generateScaffold } from './generators/index';
export type { ScaffoldOptions, ScaffoldResult, ConflictResolution, FileResolutionMap } from './generators/index';

// Conflict detection & safe init
export { detectConflicts } from './generators/index';
export type { ConflictMap, ConflictCategory, FileConflict } from './generators/index';
export { createBackup } from './generators/index';
export type { BackupManifest } from './generators/index';
export { mergeClaudeMd, mergeClaudeMdTop, mergeSettingsJson, mergeMcpJson, mergeGitignore } from './generators/index';
export { emitEvent, readMonitorState, getAgentSummary } from './generators/index';
export type { MonitorState, MonitorEvent, MonitorSummary, DynamicAgent } from './generators/index';
