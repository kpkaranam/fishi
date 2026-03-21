/**
 * Agent Complete Hook Template
 *
 * Generates an .mjs hook that fires on SubagentStop. It reads the tool result
 * from stdin, parses agent output for STATUS/FILES_CHANGED/SUMMARY fields,
 * updates the taskboard (moves tasks from In Progress to Review), and logs
 * the completion to an agent-specific log file.
 */
export function getAgentCompleteHook(): string {
  return `#!/usr/bin/env node
// agent-complete.mjs — FISHI agent completion hook
// Zero dependencies: uses only Node.js built-ins
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';

const projectRoot = process.env.FISHI_PROJECT_ROOT || process.cwd();
const boardPath = join(projectRoot, '.fishi', 'taskboard', 'board.md');
const logsDir = join(projectRoot, '.fishi', 'logs', 'agents');

/**
 * Read all of stdin synchronously (Claude Code pipes tool result JSON here).
 */
function readStdin() {
  try {
    return readFileSync('/dev/stdin', 'utf-8');
  } catch {
    // On Windows or if stdin is not available, try fd 0
    try {
      return readFileSync(0, 'utf-8');
    } catch {
      return '';
    }
  }
}

/**
 * Parse structured fields from agent output text.
 * Agents are expected to include lines like:
 *   STATUS: success
 *   FILES_CHANGED: src/foo.ts, src/bar.ts
 *   SUMMARY: Implemented the widget component
 *   TASK: TASK-042
 */
function parseAgentOutput(text) {
  const result = { status: '', filesChanged: [], summary: '', task: '' };
  if (!text) return result;

  const statusMatch = text.match(/STATUS:\\s*(.+)/i);
  if (statusMatch) result.status = statusMatch[1].trim();

  const filesMatch = text.match(/FILES_CHANGED:\\s*(.+)/i);
  if (filesMatch) {
    result.filesChanged = filesMatch[1].split(',').map(f => f.trim()).filter(Boolean);
  }

  const summaryMatch = text.match(/SUMMARY:\\s*(.+)/i);
  if (summaryMatch) result.summary = summaryMatch[1].trim();

  const taskMatch = text.match(/TASK:\\s*(.+)/i);
  if (taskMatch) result.task = taskMatch[1].trim();

  return result;
}

/**
 * Move a task from "In Progress" to "Review" in the board markdown.
 */
function moveTaskToReview(content, taskIdentifier) {
  if (!taskIdentifier) return content;

  const lines = content.split('\\n');
  let inProgressSection = false;
  let reviewSectionIdx = -1;
  let taskLine = null;
  let taskLineIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^##\\s+In\\s+Progress/i.test(line)) {
      inProgressSection = true;
      continue;
    }
    if (/^##\\s+(Review|In\\s+Review)/i.test(line)) {
      reviewSectionIdx = i;
      inProgressSection = false;
      continue;
    }
    if (/^##\\s+/.test(line)) {
      inProgressSection = false;
      continue;
    }
    if (inProgressSection && line.includes(taskIdentifier)) {
      taskLine = line;
      taskLineIndex = i;
    }
  }

  if (taskLineIndex === -1 || reviewSectionIdx === -1) return content;

  // Remove from In Progress
  lines.splice(taskLineIndex, 1);

  // Adjust review section index if task was above it
  const adjustedReviewIdx = taskLineIndex < reviewSectionIdx
    ? reviewSectionIdx - 1
    : reviewSectionIdx;

  // Insert after "## Review" header
  lines.splice(adjustedReviewIdx + 1, 0, taskLine);

  return lines.join('\\n');
}

try {
  // ── Read stdin for tool result JSON ────────────────────────────────
  const stdinData = readStdin();
  let toolResult = {};
  try {
    toolResult = JSON.parse(stdinData);
  } catch {
    // stdin may not be valid JSON — continue with env vars
  }

  // ── Determine agent info ───────────────────────────────────────────
  const agentName = process.env.CLAUDE_AGENT_NAME
    || process.env.FISHI_AGENT_NAME
    || toolResult.agent_name
    || 'unknown-agent';

  // ── Parse the agent's output for structured fields ─────────────────
  const agentOutput = toolResult.stdout || toolResult.output || toolResult.result || '';
  const parsed = parseAgentOutput(agentOutput);

  // Task ID: from parsed output, env var, or tool result
  const taskId = parsed.task
    || process.env.FISHI_TASK_ID
    || toolResult.task_id
    || '';

  const exitCode = toolResult.exit_code ?? process.env.FISHI_EXIT_CODE ?? '0';
  const status = parsed.status || (String(exitCode) === '0' ? 'success' : 'failed');
  const summary = parsed.summary || toolResult.summary || 'Agent completed';

  // ── Update taskboard ───────────────────────────────────────────────
  if (existsSync(boardPath) && taskId) {
    try {
      let boardContent = readFileSync(boardPath, 'utf-8');
      const updated = moveTaskToReview(boardContent, taskId);
      if (updated !== boardContent) {
        writeFileSync(boardPath, updated, 'utf-8');
        console.log(\`[FISHI] Task \${taskId} moved to Review.\`);
      }
    } catch (boardErr) {
      console.error(\`[FISHI] Failed to update taskboard: \${boardErr.message}\`);
    }
  }

  // ── Log agent completion ───────────────────────────────────────────
  mkdirSync(logsDir, { recursive: true });
  const now = new Date().toISOString();
  const logFile = join(logsDir, \`\${agentName.replace(/[^a-zA-Z0-9_-]/g, '_')}.log\`);
  const logLines = [
    '--- Agent Completion ---',
    \`Timestamp: \${now}\`,
    \`Agent: \${agentName}\`,
    \`Task: \${taskId || 'N/A'}\`,
    \`Status: \${status}\`,
    \`Exit Code: \${exitCode}\`,
    \`Summary: \${summary}\`,
  ];
  if (parsed.filesChanged.length > 0) {
    logLines.push(\`Files Changed: \${parsed.filesChanged.join(', ')}\`);
  }
  logLines.push('---', '');

  appendFileSync(logFile, logLines.join('\\n'), 'utf-8');

  // ── Output summary to stdout ───────────────────────────────────────
  console.log(\`[FISHI] Agent \${agentName} completed (\${status}): \${summary}\`);
  if (parsed.filesChanged.length > 0) {
    console.log(\`[FISHI] Files changed: \${parsed.filesChanged.join(', ')}\`);
  }

  // Emit monitoring event
  try {
    const { emitMonitorEvent } = await import('./monitor-emitter.mjs');
    emitMonitorEvent(projectRoot, { type: 'agent.completed', agent: agentName || 'unknown', data: { status: status || 'unknown', filesChanged: parsed.filesChanged ? parsed.filesChanged.length : 0, summary: summary || '', taskId: taskId || '' } });
  } catch {}
} catch (err) {
  console.error(\`[FISHI] Agent complete hook error: \${err.message}\`);
  process.exit(0); // Non-fatal
}
`;
}
