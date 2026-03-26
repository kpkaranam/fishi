export function getStatuslineScript(): string {
  return `#!/usr/bin/env node
// fishi-statusline.mjs — FISHI Status Line for Claude Code
// Shows: model, phase, cost, context usage, worktree info
// Also writes metrics to .fishi/state/monitor.json

const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs');
const { join, dirname } = require('path');

// Read JSON from stdin synchronously (Claude Code sends all data at once)
let input = '';
try {
  input = require('fs').readFileSync('/dev/stdin', 'utf-8');
} catch {
  try {
    input = require('fs').readFileSync(0, 'utf-8'); // fd 0 = stdin
  } catch {
    process.exit(0);
  }
}

try {
    const data = JSON.parse(input);

    const model = data.model?.display_name || '?';
    const cost = data.cost?.total_cost_usd || 0;
    const pct = Math.floor(data.context_window?.used_percentage || 0);
    const inputTokens = data.context_window?.total_input_tokens || 0;
    const outputTokens = data.context_window?.total_output_tokens || 0;
    const linesAdded = data.cost?.total_lines_added || 0;
    const linesRemoved = data.cost?.total_lines_removed || 0;
    const durationMs = data.cost?.total_duration_ms || 0;
    const agentName = data.agent?.name || '';
    const worktreeName = data.worktree?.name || '';
    const worktreeBranch = data.worktree?.branch || '';

    // Read FISHI phase from project.yaml
    let phase = '';
    const cwd = data.workspace?.current_dir || data.cwd || process.cwd();
    const projectYaml = join(cwd, '.fishi', 'state', 'project.yaml');
    if (existsSync(projectYaml)) {
      try {
        const content = readFileSync(projectYaml, 'utf-8');
        const m = content.match(/^phase:\\s*(.+)$/m);
        if (m) phase = m[1].trim().replace(/['"]/g, '');
      } catch {}
    }

    // Build status line
    const GREEN = '\\x1b[32m', YELLOW = '\\x1b[33m', CYAN = '\\x1b[36m', RESET = '\\x1b[0m';
    const RED = '\\x1b[31m';

    const barColor = pct >= 90 ? RED : pct >= 70 ? YELLOW : GREEN;
    const filled = Math.floor(pct / 10);
    const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);

    const mins = Math.floor(durationMs / 60000);
    const secs = Math.floor((durationMs % 60000) / 1000);

    let line1 = \`\${CYAN}[FISHI]\${RESET} \${model}\`;
    if (phase) line1 += \` | \${GREEN}\${phase}\${RESET}\`;
    if (agentName) line1 += \` | agent: \${CYAN}\${agentName}\${RESET}\`;
    if (worktreeName) line1 += \` | wt: \${worktreeBranch || worktreeName}\`;

    let line2 = \`\${barColor}\${bar}\${RESET} \${pct}%\`;
    line2 += \` | \${YELLOW}$\${cost.toFixed(2)}\${RESET}\`;
    line2 += \` | \${inputTokens + outputTokens} tok\`;
    line2 += \` | +\${linesAdded}/-\${linesRemoved}\`;
    line2 += \` | \${mins}m\${secs}s\`;

    console.log(line1);
    console.log(line2);

    // Write metrics to monitor.json for dashboard
    try {
      const monitorPath = join(cwd, '.fishi', 'state', 'monitor.json');
      if (existsSync(monitorPath)) {
        const monitor = JSON.parse(readFileSync(monitorPath, 'utf-8'));
        // Update summary with real-time metrics from statusline
        monitor.summary.totalTokens = inputTokens + outputTokens;
        monitor.summary.tokensByModel = monitor.summary.tokensByModel || {};
        monitor.summary.tokensByModel[data.model?.id || 'unknown'] = inputTokens + outputTokens;
        monitor.summary.totalFilesChanged = linesAdded + linesRemoved;
        monitor.lastUpdated = new Date().toISOString();

        // Store cost and context info
        monitor.metrics = monitor.metrics || {};
        monitor.metrics.cost = cost;
        monitor.metrics.contextUsedPct = pct;
        monitor.metrics.inputTokens = inputTokens;
        monitor.metrics.outputTokens = outputTokens;
        monitor.metrics.linesAdded = linesAdded;
        monitor.metrics.linesRemoved = linesRemoved;
        monitor.metrics.model = data.model?.id || 'unknown';
        monitor.metrics.modelName = model;
        monitor.metrics.durationMs = durationMs;
        monitor.metrics.agentName = agentName;
        monitor.metrics.worktreeName = worktreeName;

        const dir = dirname(monitorPath);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(monitorPath, JSON.stringify(monitor, null, 2) + '\\n', 'utf-8');
      }
    } catch {}

  } catch (err) {
    console.log('[FISHI] status unavailable');
  }
`;
}

export function getStatuslineConfig(): object {
  return {
    statusLine: {
      type: "command",
      command: "node .fishi/scripts/fishi-statusline.mjs",
    },
  };
}
