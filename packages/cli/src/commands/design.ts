import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import {
  detectDesignTokens,
  generateDefaultTokens,
  detectComponentRegistry,
  runBrandGuardian,
  generateDesignSystemConfig,
} from '@qlucent/fishi-core';

export async function designCommand(
  action: string,
  options: { output?: string }
): Promise<void> {
  const targetDir = process.cwd();

  if (action === 'detect') {
    console.log('');
    console.log(chalk.cyan.bold('  FISHI Design System — Detect'));
    console.log('');

    const tokens = detectDesignTokens(targetDir);
    const registry = detectComponentRegistry(targetDir);

    console.log(chalk.white.bold('  Design Tokens'));
    console.log(chalk.gray(`    Colors:        ${Object.keys(tokens.colors).length} detected`));
    console.log(chalk.gray(`    Typography:    ${tokens.typography.fontFamilies.length} font families, ${Object.keys(tokens.typography.scale).length} scale values`));
    console.log(chalk.gray(`    Spacing:       ${Object.keys(tokens.spacing).length} values`));
    console.log(chalk.gray(`    Border radius: ${Object.keys(tokens.borderRadius).length} values`));
    console.log(chalk.gray(`    Dark mode:     ${tokens.darkMode ? chalk.green('yes') : chalk.yellow('no')}`));
    console.log('');
    console.log(chalk.white.bold('  Component Registry'));
    console.log(chalk.gray(`    Library:       ${registry.library || 'none detected'}`));
    console.log(chalk.gray(`    Framework:     ${registry.framework || 'none detected'}`));
    console.log(chalk.gray(`    Components:    ${registry.components.length} found`));
    if (registry.components.length > 0) {
      const byType: Record<string, number> = {};
      for (const c of registry.components) byType[c.type] = (byType[c.type] || 0) + 1;
      for (const [type, count] of Object.entries(byType)) {
        console.log(chalk.gray(`      ${type}: ${count}`));
      }
    }
    console.log('');

    // Save config
    if (options.output || fs.existsSync(path.join(targetDir, '.fishi'))) {
      const outputPath = options.output || path.join(targetDir, '.fishi', 'design-system.json');
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(outputPath, generateDesignSystemConfig(tokens, registry), 'utf-8');
      console.log(chalk.green(`  Saved to ${path.relative(targetDir, outputPath)}`));
    }

  } else if (action === 'init') {
    console.log('');
    console.log(chalk.cyan.bold('  FISHI Design System — Initialize'));
    console.log('');

    // Detect existing or generate defaults
    let tokens = detectDesignTokens(targetDir);
    const hasExisting = Object.keys(tokens.colors).length > 0;

    if (!hasExisting) {
      tokens = generateDefaultTokens();
      console.log(chalk.yellow('  No design tokens found — using FISHI defaults.'));
    } else {
      console.log(chalk.green(`  Detected ${Object.keys(tokens.colors).length} colors from your project.`));
    }

    const registry = detectComponentRegistry(targetDir);
    const outputPath = path.join(targetDir, '.fishi', 'design-system.json');
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outputPath, generateDesignSystemConfig(tokens, registry), 'utf-8');

    console.log(chalk.green(`  Design system saved to .fishi/design-system.json`));
    console.log(chalk.gray('  Your agents will use these tokens for consistent styling.'));
    console.log('');

  } else if (action === 'validate') {
    console.log('');
    console.log(chalk.cyan.bold('  FISHI Brand Guardian — Validation'));
    console.log('');

    const tokens = detectDesignTokens(targetDir);
    const report = runBrandGuardian(targetDir, tokens);

    if (report.issues.length === 0) {
      console.log(chalk.green('  No issues found! Your frontend follows the design system.'));
    } else {
      for (const issue of report.issues) {
        const icon = issue.severity === 'error' ? chalk.red('ERROR') : issue.severity === 'warning' ? chalk.yellow('WARN') : chalk.blue('INFO');
        console.log(`  ${icon} ${chalk.gray(issue.file)}:${issue.line}`);
        console.log(`        ${issue.message}`);
        if (issue.fix) console.log(`        ${chalk.gray('Fix: ' + issue.fix)}`);
      }
    }

    console.log('');
    console.log(chalk.white.bold('  Summary'));
    console.log(chalk.gray(`    Files scanned: ${report.stats.filesScanned}`));
    console.log(chalk.red(`    Errors:        ${report.stats.errors}`));
    console.log(chalk.yellow(`    Warnings:      ${report.stats.warnings}`));
    console.log(chalk.blue(`    Info:          ${report.stats.infos}`));
    console.log(`    Status:        ${report.passed ? chalk.green('PASSED') : chalk.red('FAILED')}`);
    console.log('');

    if (!report.passed) process.exit(1);

  } else {
    console.log(chalk.yellow(`  Unknown action: ${action}. Use: detect, init, validate`));
  }
}
