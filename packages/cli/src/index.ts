#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { statusCommand } from './commands/status.js';
import { mcpCommand } from './commands/mcp.js';
import { resetCommand } from './commands/reset.js';
import { validateCommand } from './commands/validate.js';
import { monitorCommand } from './commands/monitor.js';
import { dashboardCommand } from './commands/dashboard.js';
import { sandboxCommand } from './commands/sandbox.js';
import { quickstartCommand } from './commands/quickstart.js';
import { previewCommand } from './commands/preview.js';
import { designCommand } from './commands/design.js';
import { securityCommand } from './commands/security.js';
import { patternsCommand } from './commands/patterns.js';

const program = new Command();

program
  .name('fishi')
  .description(
    chalk.cyan('🐟 FISHI') +
      ' — Your AI Dev Team That Actually Ships\n' +
      '   Autonomous agent framework for Claude Code'
  )
  .version('0.12.0');

program
  .command('init')
  .description('Initialize FISHI in the current directory')
  .argument('[description]', 'Project description (skip wizard with zero-config)')
  .option('-l, --language <lang>', 'Primary language (e.g., typescript, python)')
  .option('-f, --framework <framework>', 'Framework (e.g., nextjs, express, django)')
  .option(
    '-c, --cost-mode <mode>',
    'Cost mode: performance | balanced | economy',
    'balanced'
  )
  .option('--no-interactive', 'Skip interactive wizard even without description')
  .option('--merge-all', 'Merge all conflicting files (non-interactive brownfield)')
  .option('--replace-all', 'Replace all conflicting files (non-interactive brownfield)')
  .action(initCommand);

program
  .command('status')
  .description('Show project status, active agents, and TaskBoard summary')
  .action(statusCommand);

program
  .command('mcp')
  .description('Manage MCP server integrations')
  .argument('<action>', 'Action: add | list | remove')
  .argument('[name]', 'MCP server name')
  .action(mcpCommand);

program
  .command('reset')
  .description('Rollback to a previous checkpoint')
  .argument('[checkpoint]', 'Checkpoint ID (defaults to latest)')
  .action(resetCommand);

program
  .command('validate')
  .description('Validate scaffold integrity — checks files, frontmatter, cross-references, pipeline, and permissions')
  .action(validateCommand);

program
  .command('monitor')
  .description('Agent observability — TUI dashboard showing agent activity, tokens, gates')
  .option('-w, --watch', 'Watch mode — auto-refresh on changes')
  .action(monitorCommand);

program
  .command('dashboard')
  .description('Agent observability — web dashboard at http://localhost:4269')
  .option('-p, --port <port>', 'Port number', '4269')
  .action(dashboardCommand);

program
  .command('sandbox')
  .description('Sandbox status and policy management')
  .argument('<action>', 'Action: status | policy')
  .action(sandboxCommand);

program
  .command('quickstart')
  .description('Vibe mode — skip gates, scaffold + start dev server immediately')
  .argument('[description]', 'What are you building?')
  .option('-l, --language <lang>', 'Primary language')
  .option('-f, --framework <framework>', 'Framework')
  .option('-c, --cost-mode <mode>', 'Cost mode', 'balanced')
  .option('--dev-cmd <cmd>', 'Custom dev server command')
  .option('--port <port>', 'Dev server port')
  .action(quickstartCommand);

program
  .command('preview')
  .description('Start live preview dev server')
  .option('--dev-cmd <cmd>', 'Custom dev server command')
  .option('--port <port>', 'Dev server port')
  .action(previewCommand);

program
  .command('design')
  .description('Design system — detect tokens, init design system, validate with Brand Guardian')
  .argument('<action>', 'Action: detect | init | validate')
  .option('-o, --output <path>', 'Output path for design config')
  .action(designCommand);

program
  .command('security')
  .description('Security scanner — native SAST + OWASP vulnerability detection')
  .argument('<action>', 'Action: scan | rules')
  .option('-o, --output <path>', 'Save report to file')
  .option('--json', 'Output as JSON')
  .action(securityCommand);

program
  .command('patterns')
  .description('Pattern marketplace — browse, search, select integration blueprints')
  .argument('<action>', 'Action: list | search | info | select | selected')
  .option('-q, --query <query>', 'Search query or pattern ID(s)')
  .option('-c, --category <category>', 'Filter by category')
  .option('-o, --output <path>', 'Save guide to file')
  .action(patternsCommand);

program.parse();
