#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { statusCommand } from './commands/status.js';
import { mcpCommand } from './commands/mcp.js';
import { resetCommand } from './commands/reset.js';
import { validateCommand } from './commands/validate.js';

const program = new Command();

program
  .name('fishi')
  .description(
    chalk.cyan('🐟 FISHI') +
      ' — Your AI Dev Team That Actually Ships\n' +
      '   Autonomous agent framework for Claude Code'
  )
  .version('0.1.0');

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

program.parse();
