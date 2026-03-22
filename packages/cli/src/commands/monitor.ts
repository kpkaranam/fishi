import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';
import { readMonitorState, getAgentSummary } from '@qlucent/fishi-core';

const PHASES = ['init', 'discovery', 'prd', 'architecture', 'sprint_planning', 'development', 'deployment', 'deployed'];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function renderPhaseBar(currentPhase: string): string {
  const idx = PHASES.indexOf(currentPhase);
  const parts = PHASES.map((p, i) => {
    if (i < idx) return chalk.green(`[${p}]`);
    if (i === idx) return chalk.cyan.bold(`[${p}]`);
    return chalk.gray(`[${p}]`);
  });
  return '  ' + parts.join(chalk.gray(' → '));
}

function renderDivider(label: string): string {
  const line = '─'.repeat(60);
  return chalk.gray(`\n  ${line}\n  `) + chalk.bold(label) + '\n';
}

function renderMonitor(projectDir: string): void {
  const state = readMonitorState(projectDir);
  const agentSummary = getAgentSummary(projectDir);

  // Read project.yaml for phase
  let currentPhase = 'init';
  const projectYamlPath = path.join(projectDir, '.fishi', 'state', 'project.yaml');
  if (fs.existsSync(projectYamlPath)) {
    try {
      const projectState = parseYaml(fs.readFileSync(projectYamlPath, 'utf-8'));
      currentPhase = projectState?.current_phase || 'init';
    } catch {
      // ignore
    }
  }

  // Read gates.yaml
  let gates: Array<{ name: string; status: string }> = [];
  const gatesYamlPath = path.join(projectDir, '.fishi', 'state', 'gates.yaml');
  if (fs.existsSync(gatesYamlPath)) {
    try {
      const gatesData = parseYaml(fs.readFileSync(gatesYamlPath, 'utf-8'));
      gates = gatesData?.gates || [];
    } catch {
      // ignore
    }
  }

  const { summary, dynamicAgents, events, lastUpdated } = state;

  console.log('');
  console.log(chalk.cyan.bold('  FISHI Agent Monitor'));
  console.log(chalk.gray(`  Last updated: ${new Date(lastUpdated).toLocaleTimeString()}`));

  // Phase progress
  console.log(renderDivider('Phase Progress'));
  console.log(renderPhaseBar(currentPhase));
  console.log('');

  // Summary stats
  console.log(renderDivider('Summary'));
  const checkpointCount = events.filter(e => e.type === 'checkpoint.created').length;
  console.log(
    `  ${chalk.bold('Events:')} ${chalk.cyan(events.length)}` +
    `   ${chalk.bold('Checkpoints:')} ${chalk.cyan(checkpointCount)}` +
    `   ${chalk.bold('Agent Completions:')} ${chalk.cyan(summary.totalAgentCompletions)}` +
    `   ${chalk.bold('Files Changed:')} ${chalk.cyan(summary.totalFilesChanged)}`
  );

  // Agent activity
  console.log(renderDivider('Agent Activity'));
  const agentEntries = Object.entries(agentSummary);
  if (agentEntries.length === 0) {
    console.log(chalk.gray('  (no agent events yet)'));
  } else {
    for (const [agent, stats] of agentEntries.sort((a, b) => b[1].completions - a[1].completions)) {
      const failColor = stats.failures > 0 ? chalk.red : chalk.gray;
      console.log(
        `  ${chalk.magenta(agent.padEnd(28))}` +
        `  completions: ${chalk.cyan(stats.completions)}` +
        `  failures: ${failColor(stats.failures)}` +
        `  files: ${chalk.cyan(stats.filesChanged)}`
      );
    }
  }

  // Dynamic agents
  if (dynamicAgents.length > 0) {
    console.log(renderDivider('Dynamic Agents'));
    for (const da of dynamicAgents) {
      console.log(`  ${chalk.magenta(da.name)}  ${chalk.gray('←')} ${chalk.gray(da.coordinator)}`);
    }
  }

  // Gates
  if (gates.length > 0) {
    console.log(renderDivider('Gates'));
    for (const gate of gates) {
      const statusColor =
        gate.status === 'passed' ? chalk.green :
        gate.status === 'failed' ? chalk.red :
        chalk.yellow;
      console.log(`  ${statusColor('●')} ${gate.name.padEnd(30)} ${statusColor(gate.status)}`);
    }
  }

  // Last 10 events
  console.log(renderDivider('Recent Events (last 10)'));
  const recentEvents = events.slice(-10).reverse();
  if (recentEvents.length === 0) {
    console.log(chalk.gray('  (no events yet)'));
  } else {
    for (const ev of recentEvents) {
      const ts = new Date(ev.timestamp).toLocaleTimeString();
      console.log(
        `  ${chalk.gray(ts)}  ${chalk.cyan(ev.type.padEnd(20))}  ${chalk.magenta(ev.agent)}`
      );
    }
  }
  console.log('');
}

export async function monitorCommand(options: { watch?: boolean }): Promise<void> {
  const projectDir = process.cwd();
  const fishiDir = path.join(projectDir, '.fishi');

  if (!fs.existsSync(fishiDir)) {
    console.log(chalk.yellow('\n  FISHI is not initialized in this directory.'));
    console.log(chalk.gray('  Run `fishi init` to get started.\n'));
    return;
  }

  if (!options.watch) {
    renderMonitor(projectDir);
    return;
  }

  // Watch mode
  const monitorJsonPath = path.join(fishiDir, 'state', 'monitor.json');
  let lastMtime = 0;

  const render = () => {
    process.stdout.write('\x1B[2J\x1B[0;0H');
    renderMonitor(projectDir);
    console.log(chalk.gray('  [watch mode — polling every 1s, Ctrl+C to exit]'));
  };

  render();

  const interval = setInterval(() => {
    try {
      if (fs.existsSync(monitorJsonPath)) {
        const mtime = fs.statSync(monitorJsonPath).mtimeMs;
        if (mtime !== lastMtime) {
          lastMtime = mtime;
          render();
        }
      }
    } catch {
      // ignore transient read errors
    }
  }, 1000);

  // Keep process alive; exit on Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log(chalk.gray('\n  Monitor exited.\n'));
    process.exit(0);
  });
}
