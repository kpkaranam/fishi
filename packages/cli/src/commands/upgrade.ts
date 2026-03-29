import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getSoulMdTemplate,
  getAgentsMdTemplate,
  getSandboxPolicyTemplate,
  getMonitorEmitterScript,
  getFileLockHookScript,
  getPhaseGuardHook,
  getSessionStartHook,
  getAutoCheckpointHook,
  getAgentCompleteHook,
  getGateManagerScript,
  getWorktreeManagerScript,
  getSettingsJsonTemplate,
  getInitCommand,
  getStatusCommand,
  getGateCommand,
  getBoardCommand,
  getPostEditHook,
  getSafetyCheckHook,
  getWorktreeSetupHook,
  getTaskboardUpdateHook,
  getValidateScaffoldScript,
  getPhaseRunnerScript,
  getTodoManagerScript,
  getMemoryManagerScript,
  getLearningsManagerScript,
  getDocCheckerScript,
  getWorktreeGuardHook,
  getWorktreeHooksScript,
  getTaskCompletedHook,
  getSessionEndHook,
  getFailureLoggerHook,
  getStatuslineScript,
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
  getDeepResearchAgentTemplate,
} from '@qlucent/fishi-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CURRENT_VERSION: string = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf-8')
).version;

/**
 * Convert old hook format { matcher, command } to new { matcher, hooks: [{ type, command }] }
 */
function fixHooksFormat(settings: any): boolean {
  if (!settings.hooks) return false;
  let fixed = false;

  for (const [event, entries] of Object.entries(settings.hooks)) {
    if (!Array.isArray(entries)) continue;
    for (let i = 0; i < (entries as any[]).length; i++) {
      const entry = (entries as any[])[i];
      // Old format: { matcher, command } → New format: { matcher, hooks: [{ type: "command", command }] }
      if (entry.command && !entry.hooks) {
        (entries as any[])[i] = {
          matcher: entry.matcher || '',
          hooks: [{ type: 'command', command: entry.command }],
        };
        fixed = true;
      }
    }
  }

  return fixed;
}

/**
 * Remove invalid or overly broad deny rules.
 */
function fixDenyRules(settings: any): boolean {
  if (!settings.permissions?.deny) return false;
  const original = settings.permissions.deny.length;

  settings.permissions.deny = settings.permissions.deny.filter((rule: string) => {
    // Remove fork bomb pattern — empty parens rejected by Claude Code
    if (rule.includes(':(){ :|:& };:')) return false;
    // Remove any Bash() with empty content
    if (/^Bash\(\s*\)$/.test(rule)) return false;
    // Remove overly broad npm/yarn deny — blocks legitimate chained commands
    if (rule === 'Bash(npm *)' || rule === 'Bash(yarn *)') return false;
    return true;
  });

  // Ensure npm and yarn are in allow list (package manager agnostic)
  if (settings.permissions?.allow) {
    if (!settings.permissions.allow.includes('Bash(npm *)')) {
      settings.permissions.allow.push('Bash(npm *)');
    }
    if (!settings.permissions.allow.includes('Bash(yarn *)')) {
      settings.permissions.allow.push('Bash(yarn *)');
    }
  }

  return settings.permissions.deny.length !== original;
}

export async function upgradeCommand(): Promise<void> {
  const targetDir = process.cwd();

  console.log('');
  console.log(chalk.cyan.bold('  FISHI Upgrade'));
  console.log(chalk.gray(`  Upgrading project to v${CURRENT_VERSION}`));
  console.log('');

  if (!fs.existsSync(path.join(targetDir, '.fishi'))) {
    console.log(chalk.yellow('  No FISHI project found. Run `fishi init` first.'));
    return;
  }

  const spinner = ora('Upgrading...').start();
  const updated: string[] = [];
  const created: string[] = [];

  // 1. Fix settings.json — hooks format + deny rules
  const settingsPath = path.join(targetDir, '.claude', 'settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      const hooksFixed = fixHooksFormat(existing);
      const denyFixed = fixDenyRules(existing);

      if (hooksFixed || denyFixed) {
        // Backup old settings
        const backupDir = path.join(targetDir, '.fishi', 'backup', 'upgrade-' + new Date().toISOString().replace(/:/g, '-').replace(/\.\d+Z$/, ''));
        fs.mkdirSync(backupDir, { recursive: true });
        fs.copyFileSync(settingsPath, path.join(backupDir, 'settings.json'));

        // Write fixed settings (preserves all user customizations)
        fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8');

        if (hooksFixed) updated.push('.claude/settings.json (hooks format: matcher+command → matcher+hooks array)');
        if (denyFixed) updated.push('.claude/settings.json (removed invalid deny rules)');
      }
    } catch {
      updated.push('.claude/settings.json (could not parse — please fix manually)');
    }
  }

  // 2. Create SOUL.md if missing
  const soulPath = path.join(targetDir, 'SOUL.md');
  if (!fs.existsSync(soulPath)) {
    fs.writeFileSync(soulPath, getSoulMdTemplate(), 'utf-8');
    created.push('SOUL.md');
  }

  // 3. Create AGENTS.md if missing
  const agentsPath = path.join(targetDir, 'AGENTS.md');
  if (!fs.existsSync(agentsPath)) {
    fs.writeFileSync(agentsPath, getAgentsMdTemplate(), 'utf-8');
    created.push('AGENTS.md');
  }

  // 4. Create sandbox-policy.yaml if missing
  const policyPath = path.join(targetDir, '.fishi', 'sandbox-policy.yaml');
  if (!fs.existsSync(policyPath)) {
    fs.writeFileSync(policyPath, getSandboxPolicyTemplate(), 'utf-8');
    created.push('.fishi/sandbox-policy.yaml');
  }

  // 5. Create monitor-emitter.mjs if missing
  const monitorPath = path.join(targetDir, '.fishi', 'scripts', 'monitor-emitter.mjs');
  if (!fs.existsSync(monitorPath)) {
    fs.writeFileSync(monitorPath, getMonitorEmitterScript(), 'utf-8');
    created.push('.fishi/scripts/monitor-emitter.mjs');
  }

  // 6. Create file-lock-hook.mjs if missing
  const lockPath = path.join(targetDir, '.fishi', 'scripts', 'file-lock-hook.mjs');
  if (!fs.existsSync(lockPath)) {
    fs.writeFileSync(lockPath, getFileLockHookScript(), 'utf-8');
    created.push('.fishi/scripts/file-lock-hook.mjs');
  }

  // 7. Create monitor.json if missing
  const monitorJsonPath = path.join(targetDir, '.fishi', 'state', 'monitor.json');
  if (!fs.existsSync(monitorJsonPath)) {
    fs.writeFileSync(monitorJsonPath, JSON.stringify({
      events: [], summary: { totalAgentCompletions: 0, totalFilesChanged: 0, totalTokens: 0, tokensByModel: {}, tokensByAgent: {}, toolsUsed: {}, dynamicAgentsCreated: 0 }, dynamicAgents: [], lastUpdated: new Date().toISOString()
    }, null, 2) + '\n', 'utf-8');
    created.push('.fishi/state/monitor.json');
  }

  // 8. Create file-locks.yaml if missing
  const locksPath = path.join(targetDir, '.fishi', 'state', 'file-locks.yaml');
  if (!fs.existsSync(locksPath)) {
    fs.writeFileSync(locksPath, 'locks: []\n', 'utf-8');
    created.push('.fishi/state/file-locks.yaml');
  }

  // 9. Create archive directory if missing
  const archivePath = path.join(targetDir, '.fishi', 'archive');
  if (!fs.existsSync(archivePath)) {
    fs.mkdirSync(archivePath, { recursive: true });
    created.push('.fishi/archive/');
  }

  // 10. Create research directory if missing
  const researchPath = path.join(targetDir, '.fishi', 'research');
  if (!fs.existsSync(researchPath)) {
    fs.mkdirSync(researchPath, { recursive: true });
    created.push('.fishi/research/');
  }

  // 11. Regenerate hook scripts with latest versions (includes monitor emission)
  const hooksToRegenerate = [
    { name: 'session-start.mjs', getter: getSessionStartHook },
    { name: 'auto-checkpoint.mjs', getter: getAutoCheckpointHook },
    { name: 'agent-complete.mjs', getter: getAgentCompleteHook },
    { name: 'gate-manager.mjs', getter: getGateManagerScript },
    { name: 'worktree-manager.mjs', getter: getWorktreeManagerScript },
    { name: 'monitor-emitter.mjs', getter: getMonitorEmitterScript },
    { name: 'file-lock-hook.mjs', getter: getFileLockHookScript },
    { name: 'phase-guard.mjs', getter: getPhaseGuardHook },
    { name: 'post-edit.mjs', getter: getPostEditHook },
    { name: 'safety-check.mjs', getter: getSafetyCheckHook },
    { name: 'worktree-setup.mjs', getter: getWorktreeSetupHook },
    { name: 'taskboard-update.mjs', getter: getTaskboardUpdateHook },
    { name: 'validate-scaffold.mjs', getter: getValidateScaffoldScript },
    { name: 'phase-runner.mjs', getter: getPhaseRunnerScript },
    { name: 'todo-manager.mjs', getter: getTodoManagerScript },
    { name: 'memory-manager.mjs', getter: getMemoryManagerScript },
    { name: 'learnings-manager.mjs', getter: getLearningsManagerScript },
    { name: 'doc-checker.mjs', getter: getDocCheckerScript },
    { name: 'worktree-guard.mjs', getter: getWorktreeGuardHook },
    { name: 'worktree-hooks.mjs', getter: getWorktreeHooksScript },
    { name: 'task-completed-hook.mjs', getter: getTaskCompletedHook },
    { name: 'session-end-hook.mjs', getter: getSessionEndHook },
    { name: 'failure-logger.mjs', getter: getFailureLoggerHook },
    { name: 'fishi-statusline.js', getter: getStatuslineScript },
  ];

  const scriptsDir = path.join(targetDir, '.fishi', 'scripts');
  if (fs.existsSync(scriptsDir)) {
    for (const hook of hooksToRegenerate) {
      try {
        const scriptPath = path.join(scriptsDir, hook.name);
        fs.writeFileSync(scriptPath, hook.getter(), 'utf-8');
        updated.push(`.fishi/scripts/${hook.name} (regenerated with monitoring)`);
      } catch {
        // Skip hooks that fail to generate
      }
    }
  }

  // 12. Regenerate slash commands with orchestration enforcement
  const commandsDir = path.join(targetDir, '.claude', 'commands');
  if (fs.existsSync(commandsDir)) {
    const commandsToRegenerate = [
      { name: 'fishi-init.md', getter: getInitCommand },
      { name: 'fishi-status.md', getter: getStatusCommand },
      { name: 'fishi-gate.md', getter: getGateCommand },
      { name: 'fishi-board.md', getter: getBoardCommand },
    ];
    for (const cmd of commandsToRegenerate) {
      try {
        fs.writeFileSync(path.join(commandsDir, cmd.name), cmd.getter(), 'utf-8');
        updated.push(`.claude/commands/${cmd.name} (orchestration enforcement)`);
      } catch {}
    }
  }

  // 13. Regenerate settings.json with phase-guard hook
  const settingsPath2 = path.join(targetDir, '.claude', 'settings.json');
  if (fs.existsSync(settingsPath2)) {
    try {
      const existing2 = JSON.parse(fs.readFileSync(settingsPath2, 'utf-8'));
      // Check if phase-guard is already in PreToolUse hooks
      const preToolUse = existing2.hooks?.PreToolUse || [];
      const hasPhaseGuard = preToolUse.some((h: any) =>
        h.hooks?.some((hook: any) => hook.command?.includes('phase-guard'))
      );
      if (!hasPhaseGuard) {
        if (!existing2.hooks) existing2.hooks = {};
        if (!existing2.hooks.PreToolUse) existing2.hooks.PreToolUse = [];
        existing2.hooks.PreToolUse.push({
          matcher: 'Write|Edit',
          hooks: [{ type: 'command', command: 'node .fishi/scripts/phase-guard.mjs' }],
        });
        fs.writeFileSync(settingsPath2, JSON.stringify(existing2, null, 2) + '\n', 'utf-8');
        updated.push('.claude/settings.json (added phase-guard hook)');
      }
    } catch {}
  }

  // 14. Regenerate CLAUDE.md with latest orchestration enforcement
  const claudeMdPath = path.join(targetDir, '.claude', 'CLAUDE.md');
  const rootClaudeMdPath = path.join(targetDir, 'CLAUDE.md');
  if (fs.existsSync(claudeMdPath) || fs.existsSync(rootClaudeMdPath)) {
    try {
      // Read project info from fishi.yaml for template generation
      const fishiYaml = fs.readFileSync(path.join(targetDir, '.fishi', 'fishi.yaml'), 'utf-8');
      const nameMatch = fishiYaml.match(/name:\s*["']?(.+?)["']?\s*$/m);
      const descMatch = fishiYaml.match(/description:\s*["']?(.+?)["']?\s*$/m);
      const typeMatch = fishiYaml.match(/type:\s*(\w+)/m);

      const { getClaudeMdTemplate } = await import('@qlucent/fishi-core');
      const newClaudeMd = getClaudeMdTemplate({
        projectName: nameMatch?.[1] || path.basename(targetDir),
        projectDescription: descMatch?.[1] || 'FISHI-managed project',
        projectType: (typeMatch?.[1] as any) || 'greenfield',
      });

      // Write to whichever location exists (prefer root for priority)
      if (fs.existsSync(rootClaudeMdPath)) {
        // For root CLAUDE.md, merge FISHI section at top (preserve user content below)
        const { mergeClaudeMdTop } = await import('@qlucent/fishi-core');
        const existing = fs.readFileSync(rootClaudeMdPath, 'utf-8');
        const merged = mergeClaudeMdTop(existing, newClaudeMd);
        fs.writeFileSync(rootClaudeMdPath, merged, 'utf-8');
        updated.push('CLAUDE.md (orchestration enforcement updated)');
      } else {
        fs.writeFileSync(claudeMdPath, newClaudeMd, 'utf-8');
        updated.push('.claude/CLAUDE.md (orchestration enforcement updated)');
      }
    } catch {
      // Skip if template generation fails
    }
  }

  // 15. Regenerate .claude/rules/ directory
  const rulesDir = path.join(targetDir, '.claude', 'rules');
  if (!fs.existsSync(rulesDir)) fs.mkdirSync(rulesDir, { recursive: true });

  const { getPipelineRules, getDelegationRules, getSafetyRules, getConventionsRules } = await import('@qlucent/fishi-core');
  fs.writeFileSync(path.join(rulesDir, 'pipeline.md'), getPipelineRules(), 'utf-8');
  fs.writeFileSync(path.join(rulesDir, 'delegation.md'), getDelegationRules(), 'utf-8');
  fs.writeFileSync(path.join(rulesDir, 'safety.md'), getSafetyRules(), 'utf-8');
  fs.writeFileSync(path.join(rulesDir, 'conventions.md'), getConventionsRules('greenfield'), 'utf-8');
  updated.push('.claude/rules/ (pipeline, delegation, safety, conventions)');

  // 16. Regenerate all agent definitions with latest templates
  const agentsDir = path.join(targetDir, '.claude', 'agents');
  if (fs.existsSync(agentsDir)) {
    try {
      // Read project info from fishi.yaml for template context
      const fishiYamlPath = path.join(targetDir, '.fishi', 'fishi.yaml');
      const fishiYamlContent = fs.existsSync(fishiYamlPath) ? fs.readFileSync(fishiYamlPath, 'utf-8') : '';
      const nameMatch2 = fishiYamlContent.match(/name:\s*["']?(.+?)["']?\s*$/m);
      const descMatch2 = fishiYamlContent.match(/description:\s*["']?(.+?)["']?\s*$/m);
      const typeMatch2 = fishiYamlContent.match(/type:\s*(\w+)/m);

      const ctx = {
        projectName: nameMatch2?.[1] || path.basename(targetDir),
        projectDescription: descMatch2?.[1] || 'FISHI-managed project',
        projectType: (typeMatch2?.[1] as any) || 'greenfield',
        costMode: 'balanced' as const,
        timestamp: new Date().toISOString(),
      };

      const coordDir = path.join(agentsDir, 'coordinators');
      if (!fs.existsSync(coordDir)) fs.mkdirSync(coordDir, { recursive: true });

      const agentFiles: [string, string][] = [
        ['master-orchestrator.md', getMasterOrchestratorTemplate()],
        ['coordinators/planning-lead.md', planningLeadTemplate(ctx)],
        ['coordinators/dev-lead.md', devLeadTemplate(ctx)],
        ['coordinators/quality-lead.md', qualityLeadTemplate(ctx)],
        ['coordinators/ops-lead.md', opsLeadTemplate(ctx)],
        ['research-agent.md', researchAgentTemplate(ctx)],
        ['planning-agent.md', planningAgentTemplate(ctx)],
        ['architect-agent.md', architectAgentTemplate(ctx)],
        ['backend-agent.md', backendAgentTemplate(ctx)],
        ['frontend-agent.md', frontendAgentTemplate(ctx)],
        ['uiux-agent.md', uiuxAgentTemplate(ctx)],
        ['fullstack-agent.md', fullstackAgentTemplate(ctx)],
        ['devops-agent.md', devopsAgentTemplate(ctx)],
        ['testing-agent.md', testingAgentTemplate(ctx)],
        ['security-agent.md', securityAgentTemplate(ctx)],
        ['docs-agent.md', docsAgentTemplate(ctx)],
        ['writing-agent.md', writingAgentTemplate(ctx)],
        ['marketing-agent.md', marketingAgentTemplate(ctx)],
        ['deep-research-agent.md', getDeepResearchAgentTemplate()],
      ];

      for (const [filename, content] of agentFiles) {
        fs.writeFileSync(path.join(agentsDir, filename), content, 'utf-8');
      }
      updated.push(`.claude/agents/ (${agentFiles.length} agents regenerated with latest templates)`);
    } catch {
      // Skip if agent regeneration fails
    }
  }

  // 17. Initialize worktree-log.yaml if missing
  const worktreeLogPath = path.join(targetDir, '.fishi', 'state', 'worktree-log.yaml');
  if (!fs.existsSync(worktreeLogPath)) {
    fs.writeFileSync(worktreeLogPath, 'worktrees:\n', 'utf-8');
    created.push('.fishi/state/worktree-log.yaml');
  }

  spinner.succeed('Upgrade complete');
  console.log('');

  if (updated.length > 0) {
    console.log(chalk.white.bold('  Updated:'));
    for (const u of updated) console.log(chalk.green(`    ${u}`));
    console.log('');
  }

  if (created.length > 0) {
    console.log(chalk.white.bold('  Created (new in latest):'));
    for (const c of created) console.log(chalk.cyan(`    ${c}`));
    console.log('');
  }

  if (updated.length === 0 && created.length === 0) {
    console.log(chalk.green('  Already up to date!'));
    console.log('');
  }

  console.log(chalk.gray(`  Project upgraded to FISHI v${CURRENT_VERSION}`));
  console.log('');
}
