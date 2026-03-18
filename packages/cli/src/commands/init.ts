import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import type { CostMode, InitOptions, ProjectType } from '@qlucent/fishi-core';
import { detectConflicts, createBackup } from '@qlucent/fishi-core';
import type { FileResolutionMap, ConflictResolution } from '@qlucent/fishi-core';
import { detectProjectType } from '../analyzers/detector.js';
import { runBrownfieldAnalysis, type BrownfieldAnalysis } from '../analyzers/brownfield.js';
import { generateBrownfieldReport } from '../analyzers/brownfield-report.js';
import { scaffold } from '../generators/scaffold.js';

interface InitActionOptions {
  language?: string;
  framework?: string;
  costMode: string;
  interactive?: boolean;
  mergeAll?: boolean;
  replaceAll?: boolean;
}

export async function initCommand(
  description: string | undefined,
  options: InitActionOptions
): Promise<void> {
  const targetDir = process.cwd();
  const projectName = path.basename(targetDir);

  console.log('');
  console.log(chalk.cyan.bold('  🐟 FISHI — Fuck It, Ship It'));
  console.log(chalk.gray('  Autonomous agent framework for Claude Code'));
  console.log('');

  // Re-init guard: ask instead of hard exit
  if (fs.existsSync(path.join(targetDir, '.fishi'))) {
    if (options.interactive !== false) {
      const { reinit } = await inquirer.prompt([{
        type: 'confirm',
        name: 'reinit',
        message: 'FISHI is already initialized in this directory. Re-initialize?',
        default: false,
      }]);
      if (!reinit) {
        console.log(chalk.gray('  Run `fishi status` to see project state.'));
        return;
      }
    } else {
      console.log(chalk.yellow('  ⚠ FISHI already initialized. Run `fishi status` to see project state.'));
      return;
    }
  }

  // Step 1: Detect project type
  const spinner = ora('Analyzing project directory...').start();
  const detection = await detectProjectType(targetDir);
  spinner.succeed(
    `Project type: ${chalk.bold(detection.type)} (${detection.confidence}% confidence)`
  );

  for (const check of detection.checks) {
    const icon = check.passed ? chalk.green('  ✓') : chalk.gray('  ○');
    console.log(`${icon} ${check.check}${check.evidence ? chalk.gray(` — ${check.evidence}`) : ''}`);
  }
  console.log('');

  // Step 2: Gather project info (wizard or zero-config)
  let initOptions: InitOptions;

  if (description) {
    // Zero-config mode
    console.log(chalk.green('  → Zero-config mode: using provided description'));
    console.log('');
    initOptions = {
      description,
      interactive: false,
      costMode: options.costMode as CostMode,
      language: options.language,
      framework: options.framework,
    };
  } else if (options.interactive === false) {
    // Explicit non-interactive without description
    console.log(chalk.yellow('  → Non-interactive mode without description'));
    initOptions = {
      interactive: false,
      costMode: options.costMode as CostMode,
      language: options.language,
      framework: options.framework,
    };
  } else {
    // Interactive wizard
    initOptions = await runWizard(options);
  }

  // Step 3: Brownfield analysis (if existing project)
  let brownfieldAnalysis: BrownfieldAnalysis | null = null;

  if (detection.type === 'brownfield' || detection.type === 'hybrid') {
    console.log('');
    const analysisSpinner = ora('Running deep brownfield codebase analysis...').start();
    brownfieldAnalysis = await runBrownfieldAnalysis(targetDir);
    analysisSpinner.succeed('Brownfield analysis complete');
    console.log('');

    // Show detailed summary
    printBrownfieldSummary(brownfieldAnalysis);

    // Use detected values as defaults
    if (!initOptions.language && brownfieldAnalysis.language) {
      initOptions.language = brownfieldAnalysis.language;
    }
    if (!initOptions.framework && brownfieldAnalysis.framework) {
      initOptions.framework = brownfieldAnalysis.framework;
    }

    // Ask user how they want to proceed
    if (initOptions.interactive !== false) {
      const { proceed } = await inquirer.prompt([
        {
          type: 'list',
          name: 'proceed',
          message: 'How would you like to proceed?',
          choices: [
            {
              name: 'Accept analysis and scaffold FISHI',
              value: 'accept',
            },
            {
              name: 'Adjust settings before scaffolding',
              value: 'adjust',
            },
            { name: 'Cancel', value: 'cancel' },
          ],
        },
      ]);

      if (proceed === 'cancel') {
        console.log(chalk.yellow('\n  Cancelled. No files were created.'));
        return;
      }

      if (proceed === 'adjust') {
        const adjustments = await inquirer.prompt([
          {
            type: 'input',
            name: 'language',
            message: 'Primary language:',
            default: initOptions.language,
          },
          {
            type: 'input',
            name: 'framework',
            message: 'Framework:',
            default: initOptions.framework,
          },
        ]);
        initOptions.language = adjustments.language;
        initOptions.framework = adjustments.framework;
      }
    }
  }

  // ── Conflict Detection ──────────────────────────────────────────
  const conflictResult = detectConflicts(targetDir);
  let resolutions: FileResolutionMap | undefined;

  if (conflictResult.hasConflicts) {
    console.log('');
    console.log(chalk.yellow(`  ⚠ Found ${conflictResult.totalConflicts} existing file(s) that FISHI wants to create.`));
    console.log('');

    // Always backup first
    const backupSpinner = ora('Backing up existing files...').start();
    const allConflictPaths = conflictResult.categories.flatMap(c => c.conflicts.map(f => f.path));
    const backupPath = await createBackup(targetDir, allConflictPaths);
    backupSpinner.succeed(`Backup created at ${path.relative(targetDir, backupPath)}`);
    console.log('');

    // Interactive resolution
    resolutions = { categories: {}, files: {} };

    if (options.interactive !== false) {
      for (const cat of conflictResult.categories) {
        if (cat.conflicts.length === 0) continue;

        const conflictSummary = cat.conflicts.length === 1
          ? `Found existing ${cat.label} (${cat.conflicts[0].size} bytes)`
          : `Found ${cat.conflicts.length} existing ${cat.label} files`;

        // Agent/skill/command files can't be safely merged (YAML frontmatter + markdown)
        const noMergeCategories = ['agents', 'skills', 'commands'];
        const canMerge = !noMergeCategories.includes(cat.name);

        const choices = canMerge
          ? [
              { name: 'Merge — add FISHI content alongside existing', value: 'merge' },
              { name: 'Skip — leave existing files untouched', value: 'skip' },
              { name: 'Replace — overwrite with FISHI version (backup saved)', value: 'replace' },
            ]
          : [
              { name: 'Skip — leave existing files untouched', value: 'skip' },
              { name: 'Replace — overwrite with FISHI version (backup saved)', value: 'replace' },
            ];

        const { action } = await inquirer.prompt([{
          type: 'list',
          name: 'action',
          message: `${conflictSummary}. How should FISHI handle this?`,
          choices,
          default: canMerge ? 'merge' : 'skip',
        }]);

        resolutions.categories[cat.name] = action as ConflictResolution;
      }
    } else {
      // Non-interactive defaults
      const defaultAction: ConflictResolution = options.mergeAll ? 'merge' : options.replaceAll ? 'replace' : 'skip';
      for (const cat of conflictResult.categories) {
        if (cat.conflicts.length > 0) {
          resolutions.categories[cat.name] = defaultAction;
        }
      }
    }
  }

  // Step 4: Scaffold
  console.log('');
  const scaffoldSpinner = ora('Scaffolding FISHI framework...').start();

  try {
    // Build brownfield analysis data for the scaffold if available
    const brownfieldData = brownfieldAnalysis
      ? {
          language: brownfieldAnalysis.language,
          framework: brownfieldAnalysis.framework,
          testFramework: brownfieldAnalysis.testFramework,
          packageManager: brownfieldAnalysis.packageManager,
          linter: brownfieldAnalysis.linter,
          formatter: brownfieldAnalysis.formatter,
          cssFramework: brownfieldAnalysis.cssFramework,
          orm: brownfieldAnalysis.orm,
          database: brownfieldAnalysis.database,
          authProvider: brownfieldAnalysis.authProvider,
          apiStyle: brownfieldAnalysis.apiStyle,
          monorepo: brownfieldAnalysis.monorepo,
          conventions: brownfieldAnalysis.conventions,
          codePatterns: brownfieldAnalysis.codePatterns,
          fileStats: {
            totalFiles: brownfieldAnalysis.fileStats.totalFiles,
            codeFiles: brownfieldAnalysis.fileStats.codeFiles,
            testFiles: brownfieldAnalysis.fileStats.testFiles,
          },
        }
      : undefined;

    const result = await scaffold(targetDir, {
      ...initOptions,
      projectName,
      projectType: detection.type,
      brownfieldAnalysis: brownfieldData,
      resolutions,
      docsReadmeExists: conflictResult?.docsReadmeExists,
      rootClaudeMdExists: conflictResult?.rootClaudeMdExists,
    });

    // Write brownfield report if analysis was performed
    if (brownfieldAnalysis) {
      const reportPath = path.join(targetDir, '.fishi', 'memory', 'brownfield-analysis.md');
      const reportDir = path.dirname(reportPath);
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      const report = generateBrownfieldReport(brownfieldAnalysis);
      fs.writeFileSync(reportPath, report, 'utf-8');
    }

    scaffoldSpinner.succeed('FISHI framework scaffolded successfully!');
    console.log('');
    console.log(chalk.bold('  Created:'));
    console.log(chalk.gray(`  📁 .claude/agents/         — ${result.agentCount} agents (master + coordinators + workers)`));
    console.log(chalk.gray(`  📁 .claude/skills/         — ${result.skillCount} skills`));
    console.log(chalk.gray(`  📁 .claude/commands/       — ${result.commandCount} slash commands`));
    console.log(chalk.gray(`  📁 .fishi/                 — Framework config, TaskBoard, hooks, state`));
    console.log(chalk.gray(`  📄 .claude/CLAUDE.md       — Project instructions`));
    console.log(chalk.gray(`  📄 .claude/settings.json   — Hooks & permissions`));
    console.log(chalk.gray(`  📄 .mcp.json               — MCP server config`));

    if (brownfieldAnalysis) {
      console.log(chalk.gray(`  📄 .fishi/memory/brownfield-analysis.md — Codebase analysis report`));
      console.log('');
      console.log(chalk.bold('  Brownfield conventions written to CLAUDE.md:'));
      if (brownfieldAnalysis.packageManager)
        console.log(chalk.gray(`    Package manager: ${brownfieldAnalysis.packageManager}`));
      if (brownfieldAnalysis.linter)
        console.log(chalk.gray(`    Linter: ${brownfieldAnalysis.linter}`));
      if (brownfieldAnalysis.formatter)
        console.log(chalk.gray(`    Formatter: ${brownfieldAnalysis.formatter}`));
      if (brownfieldAnalysis.testFramework)
        console.log(chalk.gray(`    Test framework: ${brownfieldAnalysis.testFramework}`));
      if (brownfieldAnalysis.orm)
        console.log(chalk.gray(`    ORM: ${brownfieldAnalysis.orm}`));
      if (brownfieldAnalysis.apiStyle)
        console.log(chalk.gray(`    API style: ${brownfieldAnalysis.apiStyle}`));
      if (brownfieldAnalysis.codePatterns.length > 0)
        console.log(chalk.gray(`    Patterns: ${brownfieldAnalysis.codePatterns.map(p => p.name).join(', ')}`));
    }

    console.log('');
    console.log(chalk.cyan.bold('  🐟 Ready to ship!'));
    console.log(chalk.gray('  Run `claude` to start, then use `/fishi-init` to begin your project.'));
    console.log('');
  } catch (error) {
    scaffoldSpinner.fail('Scaffolding failed');
    console.error(chalk.red(`\n  Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  }
}

function printBrownfieldSummary(analysis: BrownfieldAnalysis): void {
  console.log(chalk.bold('  Codebase Analysis:'));
  console.log('');

  // Core stack
  console.log(chalk.white('  Stack'));
  console.log(chalk.gray(`    Language:       ${analysis.language || 'unknown'}`));
  console.log(chalk.gray(`    Framework:      ${analysis.framework || 'none detected'}`));
  console.log(chalk.gray(`    Dependencies:   ${analysis.dependencyCount}`));
  if (analysis.monorepo) console.log(chalk.gray(`    Monorepo:       yes`));
  console.log('');

  // Tooling
  console.log(chalk.white('  Tooling'));
  console.log(chalk.gray(`    Package mgr:    ${analysis.packageManager || 'unknown'}`));
  console.log(chalk.gray(`    Linter:         ${analysis.linter || 'none'}`));
  console.log(chalk.gray(`    Formatter:      ${analysis.formatter || 'none'}`));
  console.log(chalk.gray(`    Test framework: ${analysis.testFramework || 'none'}`));
  console.log(chalk.gray(`    Has tests:      ${analysis.hasTests ? 'yes' : 'no'}`));
  console.log(chalk.gray(`    Has CI/CD:      ${analysis.hasCiCd ? 'yes' : 'no'}`));
  console.log('');

  // Data layer
  if (analysis.orm || analysis.database || analysis.authProvider || analysis.apiStyle) {
    console.log(chalk.white('  Data & API'));
    if (analysis.orm) console.log(chalk.gray(`    ORM:            ${analysis.orm}`));
    if (analysis.database) console.log(chalk.gray(`    Database:       ${analysis.database}`));
    if (analysis.authProvider) console.log(chalk.gray(`    Auth:           ${analysis.authProvider}`));
    if (analysis.apiStyle) console.log(chalk.gray(`    API style:      ${analysis.apiStyle}`));
    if (analysis.cssFramework) console.log(chalk.gray(`    CSS framework:  ${analysis.cssFramework}`));
    console.log('');
  }

  // File stats
  console.log(chalk.white('  File Statistics'));
  console.log(chalk.gray(`    Total files:    ${analysis.fileStats.totalFiles}`));
  console.log(chalk.gray(`    Code files:     ${analysis.fileStats.codeFiles}`));
  console.log(chalk.gray(`    Test files:     ${analysis.fileStats.testFiles}`));
  console.log(chalk.gray(`    Config files:   ${analysis.fileStats.configFiles}`));
  console.log('');

  // Code patterns
  if (analysis.codePatterns.length > 0) {
    console.log(chalk.white('  Detected Patterns'));
    for (const pattern of analysis.codePatterns) {
      const confidence = pattern.confidence >= 80 ? chalk.green('high') : chalk.yellow('med');
      console.log(chalk.gray(`    ${pattern.name} (${confidence}${chalk.gray(')')}`));
    }
    console.log('');
  }

  // Tech debt
  if (analysis.techDebt.length > 0) {
    console.log(chalk.white('  Tech Debt Signals'));
    for (const debt of analysis.techDebt) {
      console.log(chalk.yellow(`    ⚠ ${debt}`));
    }
    console.log('');
  }

  // Existing agents
  if (analysis.existingAgents.length > 0) {
    console.log(chalk.white('  Existing Agents'));
    for (const agent of analysis.existingAgents) {
      console.log(chalk.gray(`    ${agent}`));
    }
    console.log('');
  }
}

async function runWizard(options: InitActionOptions): Promise<InitOptions> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'description',
      message: 'What are you building?',
      validate: (input: string) =>
        input.trim().length > 0 || 'Please describe your project',
    },
    {
      type: 'list',
      name: 'costMode',
      message: 'Cost mode:',
      choices: [
        {
          name: 'Balanced (recommended) — Opus for critical, Sonnet for dev, Haiku for docs',
          value: 'balanced',
        },
        {
          name: 'Performance — More Opus, faster results, higher cost',
          value: 'performance',
        },
        {
          name: 'Economy — More Haiku, slower but cheaper',
          value: 'economy',
        },
      ],
      default: 'balanced',
    },
    {
      type: 'input',
      name: 'language',
      message: 'Primary language (or press Enter to let FISHI decide):',
      default: options.language || '',
    },
    {
      type: 'input',
      name: 'framework',
      message: 'Framework (or press Enter to let FISHI decide):',
      default: options.framework || '',
    },
  ]);

  return {
    description: answers.description,
    interactive: true,
    costMode: answers.costMode,
    language: answers.language || undefined,
    framework: answers.framework || undefined,
  };
}
