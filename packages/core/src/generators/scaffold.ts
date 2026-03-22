import { mkdir, writeFile, readFile, appendFile } from 'fs/promises';
import { readFile as fsReadFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';

import type { InitOptions, ProjectType } from '../types/index.js';
import type { TemplateContext } from '../types/templates.js';
import { mergeClaudeMd, mergeClaudeMdTop, mergeSettingsJson, mergeMcpJson, mergeGitignore } from './merge-strategies.js';

// Agent templates
import { getMasterOrchestratorTemplate } from '../templates/agents/master-orchestrator.js';
import { planningLeadTemplate } from '../templates/agents/coordinators/planning-lead.js';
import { devLeadTemplate } from '../templates/agents/coordinators/dev-lead.js';
import { qualityLeadTemplate } from '../templates/agents/coordinators/quality-lead.js';
import { opsLeadTemplate } from '../templates/agents/coordinators/ops-lead.js';
import { researchAgentTemplate } from '../templates/agents/research-agent.js';
import { planningAgentTemplate } from '../templates/agents/planning-agent.js';
import { architectAgentTemplate } from '../templates/agents/architect-agent.js';
import { backendAgentTemplate } from '../templates/agents/backend-agent.js';
import { frontendAgentTemplate } from '../templates/agents/frontend-agent.js';
import { uiuxAgentTemplate } from '../templates/agents/uiux-agent.js';
import { fullstackAgentTemplate } from '../templates/agents/fullstack-agent.js';
import { devopsAgentTemplate } from '../templates/agents/devops-agent.js';
import { testingAgentTemplate } from '../templates/agents/testing-agent.js';
import { securityAgentTemplate } from '../templates/agents/security-agent.js';
import { docsAgentTemplate } from '../templates/agents/docs-agent.js';
import { writingAgentTemplate } from '../templates/agents/writing-agent.js';
import { marketingAgentTemplate } from '../templates/agents/marketing-agent.js';

// Factory templates
import { getAgentFactoryTemplate } from '../templates/factories/agent-template.js';
import { getCoordinatorFactoryTemplate } from '../templates/factories/coordinator-template.js';

// Skill templates
import { getBrainstormingSkill } from '../templates/skills/brainstorming.js';
import { getBrownfieldAnalysisSkill } from '../templates/skills/brownfield-analysis.js';
import { getTaskboardOpsSkill } from '../templates/skills/taskboard-ops.js';
import { getCodeGenSkill } from '../templates/skills/code-gen.js';
import { getDebuggingSkill } from '../templates/skills/debugging.js';
import { getApiDesignSkill } from '../templates/skills/api-design.js';
import { getTestingSkill } from '../templates/skills/testing.js';
import { getDeploymentSkill } from '../templates/skills/deployment.js';
import { getPrdSkill } from '../templates/skills/prd.js';
import { getBrownfieldDiscoverySkill } from '../templates/skills/brownfield-discovery.js';
import { getAdaptiveTaskGraphSkill } from '../templates/skills/adaptive-taskgraph.js';
import { getDocumentationSkill } from '../templates/skills/documentation.js';
import { getDeepResearchSkill } from '../templates/skills/deep-research.js';

// Domain agent templates
import { getSaasArchitectTemplate } from '../templates/agents/domains/saas-architect.js';
import { getMarketplaceArchitectTemplate } from '../templates/agents/domains/marketplace-architect.js';
import { getMobileArchitectTemplate } from '../templates/agents/domains/mobile-architect.js';
import { getAimlArchitectTemplate } from '../templates/agents/domains/aiml-architect.js';
import { getDeepResearchAgentTemplate } from '../templates/agents/domains/deep-research.js';
import type { ProjectDomain } from './domain-manager.js';

// Hook templates
import { getSessionStartHook } from '../templates/hooks/session-start.js';
import { getAutoCheckpointHook } from '../templates/hooks/auto-checkpoint.js';
import { getAgentCompleteHook } from '../templates/hooks/agent-complete.js';
import { getPostEditHook } from '../templates/hooks/post-edit.js';
import { getSafetyCheckHook } from '../templates/hooks/safety-check.js';
import { getWorktreeSetupHook } from '../templates/hooks/worktree-setup.js';
import { getTaskboardUpdateHook } from '../templates/hooks/taskboard-update.js';
import { getWorktreeManagerScript } from '../templates/hooks/worktree-manager.js';
import { getGateManagerScript } from '../templates/hooks/gate-manager.js';
import { getValidateScaffoldScript } from '../templates/hooks/validate-scaffold.js';
import { getPhaseRunnerScript } from '../templates/hooks/phase-runner.js';
import { getTodoManagerScript } from '../templates/hooks/todo-manager.js';
import { getMemoryManagerScript } from '../templates/hooks/memory-manager.js';
import { getLearningsManagerScript } from '../templates/hooks/learnings-manager.js';
import { getDocCheckerScript } from '../templates/hooks/doc-checker.js';
import { getMonitorEmitterScript } from '../templates/hooks/monitor-emitter.js';
import { getFileLockHookScript } from '../templates/hooks/file-lock-hook.js';
import { getPhaseGuardHook } from '../templates/hooks/phase-guard.js';

// Command templates
import { getInitCommand } from '../templates/commands/init-command.js';
import { getStatusCommand } from '../templates/commands/status-command.js';
import { getResumeCommand } from '../templates/commands/resume-command.js';
import { getGateCommand } from '../templates/commands/gate-command.js';
import { getBoardCommand } from '../templates/commands/board-command.js';
import { getSprintCommand } from '../templates/commands/sprint-command.js';
import { getResetCommand } from '../templates/commands/reset-command.js';
import { getPrdCommand } from '../templates/commands/prd-command.js';

// Config templates
import { getFishiYamlTemplate } from '../templates/configs/fishi-yaml.js';
import { getSettingsJsonTemplate } from '../templates/configs/settings-json.js';
import { getClaudeMdTemplate } from '../templates/configs/claude-md.js';
import type { BrownfieldAnalysisData } from '../templates/configs/claude-md.js';
import { getMcpJsonTemplate } from '../templates/configs/mcp-json.js';
import { getProjectYamlTemplate } from '../templates/configs/project-yaml.js';
import { getAgentRegistryTemplate } from '../templates/configs/agent-registry.js';
import { getGitignoreAdditions } from '../templates/configs/gitignore-additions.js';
import { getModelRoutingReference } from '../templates/configs/model-routing.js';
import { getSoulMdTemplate } from '../templates/configs/soul-md.js';
import { getAgentsMdTemplate } from '../templates/configs/agents-md.js';

export type ConflictResolution = 'skip' | 'merge' | 'replace';

export interface FileResolutionMap {
  categories: Record<string, ConflictResolution>;
  files: Record<string, ConflictResolution>;
}

export interface ScaffoldOptions extends InitOptions {
  projectName: string;
  projectType: ProjectType;
  brownfieldAnalysis?: BrownfieldAnalysisData;
  resolutions?: FileResolutionMap;
  docsReadmeExists?: boolean;
  rootClaudeMdExists?: boolean;
  domain?: ProjectDomain;
}

export interface ScaffoldResult {
  agentCount: number;
  skillCount: number;
  commandCount: number;
  hookCount: number;
  filesCreated: number;
}

export async function generateScaffold(
  targetDir: string,
  options: ScaffoldOptions
): Promise<ScaffoldResult> {
  let filesCreated = 0;
  const resolutions = options.resolutions;

  async function write(relativePath: string, content: string, category?: string): Promise<void> {
    if (resolutions) {
      const fileRes = resolutions.files[relativePath];
      const catRes = category ? resolutions.categories[category] : undefined;
      const resolution = fileRes || catRes;

      if (resolution === 'skip') return;
      // 'merge' is handled by caller before calling write()
      // 'replace' and undefined fall through to normal write
    }

    const fullPath = join(targetDir, relativePath);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, 'utf-8');
    filesCreated++;
  }

  const ctx: TemplateContext = {
    projectName: options.projectName,
    projectDescription: options.description || `${options.projectName} project`,
    projectType: options.projectType,
    language: options.language,
    framework: options.framework,
    costMode: options.costMode,
    timestamp: new Date().toISOString(),
  };

  // Create directory structure
  const dirs = [
    '.claude/agents/coordinators',
    '.claude/skills/brainstorming',
    '.claude/skills/brownfield-analysis',
    '.claude/skills/taskboard-ops',
    '.claude/skills/code-gen',
    '.claude/skills/debugging',
    '.claude/skills/api-design',
    '.claude/skills/testing',
    '.claude/skills/deployment',
    '.claude/skills/prd',
    '.claude/skills/brownfield-discovery',
    '.claude/skills/adaptive-taskgraph',
    '.claude/skills/documentation',
    '.claude/skills/deep-research',
    '.claude/commands',
    'docs',
    '.fishi/plans/prd',
    '.fishi/plans/adrs',
    '.fishi/state/checkpoints',
    '.fishi/taskboard/sprints',
    '.fishi/taskboard/epics',
    '.fishi/taskboard/archive',
    '.fishi/memory/agents',
    '.fishi/memory/research',
    '.fishi/logs/agents',
    '.fishi/scripts',
    '.fishi/agent-factory',
    '.fishi/todos/coordinators',
    '.fishi/todos/agents',
    '.fishi/learnings/by-domain',
    '.fishi/learnings/by-agent',
    '.fishi/archive',
    '.fishi/research',
    '.trees',
  ];
  for (const dir of dirs) {
    await mkdir(join(targetDir, dir), { recursive: true });
  }

  // ── Agents (1 master + 4 coordinators + 13 workers = 18) ──────────
  await write('.claude/agents/master-orchestrator.md', getMasterOrchestratorTemplate(), 'agents');
  await write('.claude/agents/coordinators/planning-lead.md', planningLeadTemplate(ctx), 'agents');
  await write('.claude/agents/coordinators/dev-lead.md', devLeadTemplate(ctx), 'agents');
  await write('.claude/agents/coordinators/quality-lead.md', qualityLeadTemplate(ctx), 'agents');
  await write('.claude/agents/coordinators/ops-lead.md', opsLeadTemplate(ctx), 'agents');
  await write('.claude/agents/research-agent.md', researchAgentTemplate(ctx), 'agents');
  await write('.claude/agents/planning-agent.md', planningAgentTemplate(ctx), 'agents');
  await write('.claude/agents/architect-agent.md', architectAgentTemplate(ctx), 'agents');
  await write('.claude/agents/backend-agent.md', backendAgentTemplate(ctx), 'agents');
  await write('.claude/agents/frontend-agent.md', frontendAgentTemplate(ctx), 'agents');
  await write('.claude/agents/uiux-agent.md', uiuxAgentTemplate(ctx), 'agents');
  await write('.claude/agents/fullstack-agent.md', fullstackAgentTemplate(ctx), 'agents');
  await write('.claude/agents/devops-agent.md', devopsAgentTemplate(ctx), 'agents');
  await write('.claude/agents/testing-agent.md', testingAgentTemplate(ctx), 'agents');
  await write('.claude/agents/security-agent.md', securityAgentTemplate(ctx), 'agents');
  await write('.claude/agents/docs-agent.md', docsAgentTemplate(ctx), 'agents');
  await write('.claude/agents/writing-agent.md', writingAgentTemplate(ctx), 'agents');
  await write('.claude/agents/marketing-agent.md', marketingAgentTemplate(ctx), 'agents');
  let agentCount = 18;

  // ── Deep Research Agent (always included) ────────────────────────
  await write('.claude/agents/deep-research-agent.md', getDeepResearchAgentTemplate(), 'agents');
  agentCount++;

  // ── Domain-Specific Agent (if domain selected) ──────────────────
  if (options.domain && options.domain !== 'general') {
    const domainTemplates: Record<string, () => string> = {
      saas: getSaasArchitectTemplate,
      marketplace: getMarketplaceArchitectTemplate,
      mobile: getMobileArchitectTemplate,
      aiml: getAimlArchitectTemplate,
    };
    const template = domainTemplates[options.domain];
    if (template) {
      await write(`.claude/agents/${options.domain}-architect.md`, template(), 'agents');
      agentCount++;
    }
  }

  // ── Agent Factory Templates ───────────────────────────────────────
  await write('.fishi/agent-factory/agent-template.md', getAgentFactoryTemplate());
  await write('.fishi/agent-factory/coordinator-template.md', getCoordinatorFactoryTemplate());

  // ── Skills (12) ───────────────────────────────────────────────────
  await write('.claude/skills/brainstorming/SKILL.md', getBrainstormingSkill(), 'skills');
  await write('.claude/skills/brownfield-analysis/SKILL.md', getBrownfieldAnalysisSkill(), 'skills');
  await write('.claude/skills/taskboard-ops/SKILL.md', getTaskboardOpsSkill(), 'skills');
  await write('.claude/skills/code-gen/SKILL.md', getCodeGenSkill(), 'skills');
  await write('.claude/skills/debugging/SKILL.md', getDebuggingSkill(), 'skills');
  await write('.claude/skills/api-design/SKILL.md', getApiDesignSkill(), 'skills');
  await write('.claude/skills/testing/SKILL.md', getTestingSkill(), 'skills');
  await write('.claude/skills/deployment/SKILL.md', getDeploymentSkill(), 'skills');
  await write('.claude/skills/prd/SKILL.md', getPrdSkill(), 'skills');
  await write('.claude/skills/brownfield-discovery/SKILL.md', getBrownfieldDiscoverySkill(), 'skills');
  await write('.claude/skills/adaptive-taskgraph/SKILL.md', getAdaptiveTaskGraphSkill(), 'skills');
  await write('.claude/skills/documentation/SKILL.md', getDocumentationSkill(), 'skills');

  // ── Deep Research Skill ──────────────────────────────────────────
  await write('.claude/skills/deep-research/SKILL.md', getDeepResearchSkill(), 'skills');
  const skillCount = 13;

  // ── Hooks (7 .mjs scripts) ───────────────────────────────────────
  await write('.fishi/scripts/session-start.mjs', getSessionStartHook());
  await write('.fishi/scripts/auto-checkpoint.mjs', getAutoCheckpointHook());
  await write('.fishi/scripts/agent-complete.mjs', getAgentCompleteHook());
  await write('.fishi/scripts/post-edit.mjs', getPostEditHook());
  await write('.fishi/scripts/safety-check.mjs', getSafetyCheckHook());
  await write('.fishi/scripts/worktree-setup.mjs', getWorktreeSetupHook());
  await write('.fishi/scripts/taskboard-update.mjs', getTaskboardUpdateHook());
  await write('.fishi/scripts/worktree-manager.mjs', getWorktreeManagerScript());
  await write('.fishi/scripts/gate-manager.mjs', getGateManagerScript());
  await write('.fishi/scripts/validate-scaffold.mjs', getValidateScaffoldScript());
  await write('.fishi/scripts/phase-runner.mjs', getPhaseRunnerScript());
  await write('.fishi/scripts/todo-manager.mjs', getTodoManagerScript());
  await write('.fishi/scripts/memory-manager.mjs', getMemoryManagerScript());
  await write('.fishi/scripts/learnings-manager.mjs', getLearningsManagerScript());
  await write('.fishi/scripts/doc-checker.mjs', getDocCheckerScript());
  await write('.fishi/scripts/monitor-emitter.mjs', getMonitorEmitterScript());
  await write('.fishi/scripts/file-lock-hook.mjs', getFileLockHookScript());
  await write('.fishi/scripts/phase-guard.mjs', getPhaseGuardHook());
  const hookCount = 18;

  // ── Initial TODO Files ─────────────────────────────────────────────
  const todoTemplate = (name: string) => `# TODO — ${name}\n\n## Active\n\n## Completed\n`;
  await write('.fishi/todos/master-orchestrator.md', todoTemplate('master-orchestrator'));
  await write('.fishi/todos/coordinators/planning-lead.md', todoTemplate('planning-lead'));
  await write('.fishi/todos/coordinators/dev-lead.md', todoTemplate('dev-lead'));
  await write('.fishi/todos/coordinators/quality-lead.md', todoTemplate('quality-lead'));
  await write('.fishi/todos/coordinators/ops-lead.md', todoTemplate('ops-lead'));
  await write('.fishi/todos/agents/backend-agent.md', todoTemplate('backend-agent'));
  await write('.fishi/todos/agents/frontend-agent.md', todoTemplate('frontend-agent'));
  await write('.fishi/todos/agents/testing-agent.md', todoTemplate('testing-agent'));
  await write('.fishi/todos/agents/devops-agent.md', todoTemplate('devops-agent'));

  // ── Slash Commands (8) ────────────────────────────────────────────
  await write('.claude/commands/fishi-init.md', getInitCommand(), 'commands');
  await write('.claude/commands/fishi-status.md', getStatusCommand(), 'commands');
  await write('.claude/commands/fishi-resume.md', getResumeCommand(), 'commands');
  await write('.claude/commands/fishi-gate.md', getGateCommand(), 'commands');
  await write('.claude/commands/fishi-board.md', getBoardCommand(), 'commands');
  await write('.claude/commands/fishi-sprint.md', getSprintCommand(), 'commands');
  await write('.claude/commands/fishi-reset.md', getResetCommand(), 'commands');
  await write('.claude/commands/fishi-prd.md', getPrdCommand(), 'commands');
  const commandCount = 8;

  // ── Safety Layer ────────────────────────────────────────────────
  await write('SOUL.md', getSoulMdTemplate());
  await write('AGENTS.md', getAgentsMdTemplate());

  // ── Config Files ──────────────────────────────────────────────────
  await write('.fishi/fishi.yaml', getFishiYamlTemplate({
    projectName: options.projectName,
    projectDescription: ctx.projectDescription,
    projectType: options.projectType,
    costMode: options.costMode,
    language: options.language,
    framework: options.framework,
  }));
  // settings.json
  const settingsContent = getSettingsJsonTemplate();
  if (resolutions?.categories['settings-json'] === 'merge') {
    const existingRaw = await fsReadFile(join(targetDir, '.claude', 'settings.json'), 'utf-8');
    const merged = mergeSettingsJson(JSON.parse(existingRaw), JSON.parse(settingsContent));
    await write('.claude/settings.json', JSON.stringify(merged, null, 2) + '\n', 'settings-json');
  } else {
    await write('.claude/settings.json', settingsContent, 'settings-json');
  }

  // CLAUDE.md — root CLAUDE.md takes priority over .claude/CLAUDE.md
  const claudeMdContent = getClaudeMdTemplate({
    projectName: options.projectName,
    projectDescription: ctx.projectDescription,
    projectType: options.projectType,
    language: options.language,
    framework: options.framework,
    brownfieldAnalysis: options.brownfieldAnalysis,
  });
  if (options.rootClaudeMdExists) {
    // Root CLAUDE.md exists — merge into it, skip .claude/CLAUDE.md
    const rootResolution = resolutions?.categories['root-claude-md'];
    if (rootResolution === 'merge') {
      const existingMd = await fsReadFile(join(targetDir, 'CLAUDE.md'), 'utf-8');
      const merged = mergeClaudeMdTop(existingMd, claudeMdContent);
      const fullPath = join(targetDir, 'CLAUDE.md');
      await writeFile(fullPath, merged, 'utf-8');
      filesCreated++;
    } else if (rootResolution === 'replace') {
      const fullPath = join(targetDir, 'CLAUDE.md');
      await writeFile(fullPath, claudeMdContent, 'utf-8');
      filesCreated++;
    }
    // skip: don't touch root CLAUDE.md, don't create .claude/CLAUDE.md
  } else if (resolutions?.categories['claude-md'] === 'merge') {
    const existingMd = await fsReadFile(join(targetDir, '.claude', 'CLAUDE.md'), 'utf-8');
    const merged = mergeClaudeMd(existingMd, claudeMdContent);
    await write('.claude/CLAUDE.md', merged, 'claude-md');
  } else {
    await write('.claude/CLAUDE.md', claudeMdContent, 'claude-md');
  }

  // .mcp.json
  const mcpContent = getMcpJsonTemplate();
  if (resolutions?.categories['mcp-json'] === 'merge') {
    const existingRaw = await fsReadFile(join(targetDir, '.mcp.json'), 'utf-8');
    const merged = mergeMcpJson(JSON.parse(existingRaw), JSON.parse(mcpContent));
    await write('.mcp.json', JSON.stringify(merged, null, 2) + '\n', 'mcp-json');
  } else {
    await write('.mcp.json', mcpContent, 'mcp-json');
  }
  await write('.fishi/state/project.yaml', getProjectYamlTemplate({
    projectName: options.projectName,
    projectDescription: ctx.projectDescription,
    projectType: options.projectType,
  }));
  await write('.fishi/state/agent-registry.yaml', getAgentRegistryTemplate());
  await write('.fishi/state/file-locks.yaml', 'locks: []\n');
  await write('.fishi/state/task-graph.yaml', 'tasks: []\ndependencies: []\n');
  await write('.fishi/state/gates.yaml', 'gates: []\n');
  await write('.fishi/state/monitor.json', JSON.stringify({
    events: [],
    summary: { totalAgentCompletions: 0, totalFilesChanged: 0, totalTokens: 0, tokensByModel: {}, tokensByAgent: {}, toolsUsed: {}, dynamicAgentsCreated: 0 },
    dynamicAgents: [],
    lastUpdated: new Date().toISOString()
  }, null, 2) + '\n');
  await write('.fishi/mcp-registry.yaml', getMcpRegistryTemplate());
  await write('.fishi/model-routing.md', getModelRoutingReference());

  // ── Memory ────────────────────────────────────────────────────────
  await write('.fishi/memory/project-context.md', getProjectContextTemplate(ctx));
  await write('.fishi/memory/decisions.md', '# Architecture Decision Log\n\n_No decisions recorded yet._\n');
  await write('.fishi/memory/agents/master-orchestrator.md', getMasterOrchestratorMemory(ctx));

  // ── Learnings ──────────────────────────────────────────────────────
  await write('.fishi/learnings/shared.md', '# Learnings \u2014 shared\n\n## Mistakes & Fixes\n\n## Best Practices\n');

  // ── Docs ──────────────────────────────────────────────────────────
  if (!options.docsReadmeExists) {
    await write('docs/README.md', `# ${options.projectName}\n\nDocumentation will be generated as the project progresses.\n`);
  }

  // ── TaskBoard ─────────────────────────────────────────────────────
  await write('.fishi/taskboard/board.md', getEmptyBoard());
  await write('.fishi/taskboard/backlog.md', getEmptyBacklog());

  // ── .gitignore additions ──────────────────────────────────────────
  const gitignorePath = join(targetDir, '.gitignore');
  const additions = getGitignoreAdditions();
  if (existsSync(gitignorePath)) {
    if (resolutions?.categories['gitignore'] === 'skip') {
      // Do nothing
    } else {
      const existing = await readFile(gitignorePath, 'utf-8');
      const merged = mergeGitignore(existing, '\n' + additions);
      if (merged !== existing) {
        await writeFile(join(targetDir, '.gitignore'), merged, 'utf-8');
      }
    }
  } else {
    await writeFile(gitignorePath, additions, 'utf-8');
    filesCreated++;
  }

  return { agentCount, skillCount, commandCount, hookCount, filesCreated };
}

function getMcpRegistryTemplate(): string {
  return `mcp_discovery:
  detected_services: []

installed_mcps:
  core:
    - github
    - sequential-thinking
    - context7
  project: []
  user: []
`;
}

function getProjectContextTemplate(ctx: TemplateContext): string {
  return `# Project Context — ${ctx.projectName}

## Overview
${ctx.projectDescription}

## Type
${ctx.projectType}

## Tech Stack
- Language: ${ctx.language || 'TBD'}
- Framework: ${ctx.framework || 'TBD'}

## Key Decisions
_None yet. Decisions will be logged as the project progresses._

## Current State
Phase: init
Sprint: 0

## Agent Memory
Each agent has personal persistent memory at \`.fishi/memory/agents/{agent-name}.md\`.
Agents should read their personal memory at session start and save important context during work.
Use \`node .fishi/scripts/memory-manager.mjs\` to read/write agent memories programmatically.
`;
}

function getEmptyBoard(): string {
  return `# TaskBoard — Project Kanban

<!-- Config
columns: Backlog, Ready, In Progress, Review, Done
categories: Backend, Frontend, DevOps, Design, Testing, Docs
labels: critical, high, medium, low
-->

---

## 📋 Backlog

_No tasks yet. Run /fishi-init to start planning._

---

## 🟡 Ready

---

## 🔵 In Progress

---

## 🟠 Review

---

## ✅ Done

`;
}

function getMasterOrchestratorMemory(ctx: TemplateContext): string {
  const now = new Date().toISOString();
  return `# Memory — master-orchestrator

## project-bootstrap
> Written: ${now}

Project "${ctx.projectName}" initialized. Type: ${ctx.projectType}. Language: ${ctx.language || 'TBD'}. Framework: ${ctx.framework || 'TBD'}.
Description: ${ctx.projectDescription}
Current phase: init. No gates passed yet. No coordinators delegated yet.
`;
}

function getEmptyBacklog(): string {
  return `# Product Backlog

Prioritized list of all upcoming work items.

_Backlog is empty. Use /fishi-init to start the planning process._
`;
}
