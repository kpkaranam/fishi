import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import {
  getSoulMdTemplate,
  getAgentsMdTemplate,
  getSandboxPolicyTemplate,
  getMonitorEmitterScript,
  getFileLockHookScript,
} from '@qlucent/fishi-core';

const CURRENT_VERSION = '0.14.4';

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
