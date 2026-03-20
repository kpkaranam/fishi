import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import type { CostMode, InitOptions } from '@qlucent/fishi-core';
import { detectProjectType } from '../analyzers/detector.js';
import { runBrownfieldAnalysis } from '../analyzers/brownfield.js';
import { generateBrownfieldReport } from '../analyzers/brownfield-report.js';
import { scaffold } from '../generators/scaffold.js';
import { detectDevServer, startDevServer, getVibeModeConfig } from '@qlucent/fishi-core';
import { detectConflicts, createBackup } from '@qlucent/fishi-core';
import { detectDocker } from '@qlucent/fishi-core';
import type { FileResolutionMap, ConflictResolution } from '@qlucent/fishi-core';

interface QuickstartOptions {
  language?: string;
  framework?: string;
  costMode: string;
  devCmd?: string;
  port?: string;
}

export async function quickstartCommand(
  description: string | undefined,
  options: QuickstartOptions
): Promise<void> {
  const targetDir = process.cwd();
  const projectName = path.basename(targetDir);

  console.log('');
  console.log(chalk.cyan.bold('  FISHI — Vibe Mode'));
  console.log(chalk.gray('  Skip the ceremony, start shipping'));
  console.log('');

  // Check if already initialized
  if (fs.existsSync(path.join(targetDir, '.fishi'))) {
    console.log(chalk.yellow('  FISHI already initialized. Starting dev server only...'));
    const serverConfig = detectDevServer(targetDir, options.devCmd);
    if (serverConfig.detected) {
      console.log(chalk.green(`  Starting ${serverConfig.framework} dev server on :${serverConfig.port}...`));
      const child = startDevServer(targetDir, serverConfig);
      child.stdout?.on('data', (d) => process.stdout.write(d));
      child.stderr?.on('data', (d) => process.stderr.write(d));
      child.on('close', (code) => process.exit(code || 0));
      return;
    }
    console.log(chalk.yellow('  Could not detect dev server. Use --dev-cmd to specify.'));
    return;
  }

  // Step 1: Detect project type
  const spinner = ora('Analyzing project...').start();
  const detection = await detectProjectType(targetDir);
  spinner.succeed(`Project type: ${chalk.bold(detection.type)}`);

  // Step 2: Brownfield analysis (if applicable)
  let brownfieldAnalysis = null;

  if (detection.type === 'brownfield' || detection.type === 'hybrid') {
    const analysisSpinner = ora('Running brownfield analysis...').start();
    brownfieldAnalysis = await runBrownfieldAnalysis(targetDir);
    analysisSpinner.succeed('Brownfield analysis complete');
  }

  // Step 3: Conflict detection + auto-merge for brownfield
  const conflictResult = detectConflicts(targetDir);
  let resolutions: FileResolutionMap | undefined;

  if (conflictResult.hasConflicts) {
    console.log(chalk.yellow(`  Auto-merging ${conflictResult.totalConflicts} conflicting files (vibe mode)...`));
    const allPaths = conflictResult.categories.flatMap(c => c.conflicts.map(f => f.path));
    await createBackup(targetDir, allPaths);

    resolutions = { categories: {}, files: {} };
    for (const cat of conflictResult.categories) {
      if (cat.conflicts.length > 0) {
        // Merge configs, skip agents/skills/commands (add alongside)
        const noMerge = ['agents', 'skills', 'commands'];
        resolutions.categories[cat.name] = noMerge.includes(cat.name) ? 'skip' as ConflictResolution : 'merge' as ConflictResolution;
      }
    }
  }

  // Step 4: Build options (auto-fill from prompt + analysis)
  const initOptions: InitOptions = {
    description: description || `${projectName} project`,
    interactive: false,
    costMode: (options.costMode as CostMode) || 'balanced',
    language: options.language || brownfieldAnalysis?.language,
    framework: options.framework || brownfieldAnalysis?.framework,
  };

  let brownfieldData = undefined;

  if (brownfieldAnalysis) {
    brownfieldData = {
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
    };
  }

  // Step 5: Scaffold
  const scaffoldSpinner = ora('Scaffolding FISHI...').start();
  try {
    const result = await scaffold(targetDir, {
      ...initOptions,
      projectName,
      projectType: detection.type,
      brownfieldAnalysis: brownfieldData,
      resolutions,
      docsReadmeExists: conflictResult.docsReadmeExists,
      rootClaudeMdExists: conflictResult.rootClaudeMdExists,
    });
    scaffoldSpinner.succeed(`Scaffolded: ${result.agentCount} agents, ${result.skillCount} skills, ${result.commandCount} commands`);
  } catch (error) {
    scaffoldSpinner.fail('Scaffolding failed');
    console.error(chalk.red(`  Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  }

  // Step 6: Write vibe mode config
  const fishiYamlPath = path.join(targetDir, '.fishi', 'fishi.yaml');
  if (fs.existsSync(fishiYamlPath)) {
    fs.appendFileSync(fishiYamlPath, getVibeModeConfig(true), 'utf-8');
  }

  // Step 7: Sandbox config (auto-detect, don't prompt)
  const dockerAvailable = detectDocker();
  const sandboxMode = dockerAvailable ? 'docker' : 'process';
  fs.appendFileSync(fishiYamlPath, `\nsandbox:\n  mode: ${sandboxMode}\n  docker_available: ${dockerAvailable}\n`, 'utf-8');

  // Step 8: Auto-advance phase to development (skip gates)
  const projectYamlPath = path.join(targetDir, '.fishi', 'state', 'project.yaml');
  if (fs.existsSync(projectYamlPath)) {
    let content = fs.readFileSync(projectYamlPath, 'utf-8');
    content = content.replace(/^phase:\s*.+$/m, 'phase: development');
    fs.writeFileSync(projectYamlPath, content, 'utf-8');
  }

  // Step 9: Detect and start dev server
  const serverConfig = detectDevServer(targetDir, options.devCmd);

  console.log('');
  console.log(chalk.cyan.bold('  Vibe Mode Active'));
  console.log(chalk.gray(`  Phase: ${chalk.green('development')} (gates auto-skipped)`));
  console.log(chalk.gray(`  Sandbox: ${sandboxMode}`));

  if (serverConfig.detected) {
    const port = options.port ? parseInt(options.port, 10) : serverConfig.port;
    console.log(chalk.gray(`  Dev server: ${serverConfig.framework} on :${port}`));
    console.log('');
    console.log(chalk.green.bold(`  Preview: http://localhost:${port}`));
    console.log('');
    console.log(chalk.gray('  Starting dev server...'));
    console.log('');

    const child = startDevServer(targetDir, { ...serverConfig, port });
    child.stdout?.on('data', (d) => process.stdout.write(d));
    child.stderr?.on('data', (d) => process.stderr.write(d));
    child.on('close', (code) => {
      console.log(chalk.gray(`\n  Dev server stopped (exit ${code})`));
    });

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      child.kill();
      console.log(chalk.gray('\n  Dev server stopped.'));
      process.exit(0);
    });
  } else {
    console.log('');
    console.log(chalk.yellow('  No dev server detected. Run your dev server manually.'));
    console.log(chalk.gray('  Or use: fishi quickstart --dev-cmd "npm run dev"'));
    console.log('');
    console.log(chalk.cyan.bold('  Ready to ship!'));
    console.log(chalk.gray('  Run `claude` to start working with your AI dev team.'));
    console.log('');
  }
}
