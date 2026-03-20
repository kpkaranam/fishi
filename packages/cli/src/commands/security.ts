import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { runSecurityScan, generateSecurityReport, getScanRules } from '@qlucent/fishi-core';

export async function securityCommand(
  action: string,
  options: { output?: string; json?: boolean }
): Promise<void> {
  const targetDir = process.cwd();

  if (action === 'scan') {
    console.log('');
    console.log(chalk.cyan.bold('  FISHI Security Scanner'));
    console.log(chalk.gray('  Native SAST + OWASP vulnerability detection'));
    console.log('');

    const spinner = ora('Scanning for vulnerabilities...').start();
    const report = runSecurityScan(targetDir);
    spinner.succeed(`Scanned ${report.summary.filesScanned} files`);
    console.log('');

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      // Display findings by severity
      const severityOrder: Array<'critical' | 'high' | 'medium' | 'low' | 'info'> = ['critical', 'high', 'medium', 'low', 'info'];
      const severityColors: Record<string, (s: string) => string> = {
        critical: chalk.red.bold,
        high: chalk.red,
        medium: chalk.yellow,
        low: chalk.blue,
        info: chalk.gray,
      };

      for (const sev of severityOrder) {
        const sevFindings = report.findings.filter(f => f.severity === sev);
        if (sevFindings.length === 0) continue;

        console.log(severityColors[sev](`  ${sev.toUpperCase()} (${sevFindings.length})`));
        for (const f of sevFindings) {
          console.log(chalk.gray(`    ${f.file}:${f.line}`));
          console.log(`      ${f.message}`);
          if (f.cwe) console.log(chalk.gray(`      ${f.cwe}`));
          console.log(chalk.green(`      Fix: ${f.fix}`));
          console.log('');
        }
      }

      // Summary
      console.log(chalk.white.bold('  Summary'));
      if (report.summary.critical > 0) console.log(chalk.red(`    Critical: ${report.summary.critical}`));
      if (report.summary.high > 0) console.log(chalk.red(`    High:     ${report.summary.high}`));
      if (report.summary.medium > 0) console.log(chalk.yellow(`    Medium:   ${report.summary.medium}`));
      if (report.summary.low > 0) console.log(chalk.blue(`    Low:      ${report.summary.low}`));
      if (report.summary.info > 0) console.log(chalk.gray(`    Info:     ${report.summary.info}`));
      console.log(`    Total:    ${report.summary.total}`);
      console.log(`    Status:   ${report.summary.passed ? chalk.green('PASSED') : chalk.red('FAILED')}`);
      console.log('');
    }

    // Save report if output specified or .fishi exists
    const outputPath = options.output || (fs.existsSync(path.join(targetDir, '.fishi'))
      ? path.join(targetDir, '.fishi', 'security-report.md')
      : null);

    if (outputPath) {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(outputPath, generateSecurityReport(report), 'utf-8');
      console.log(chalk.green(`  Report saved to ${path.relative(targetDir, outputPath)}`));
      console.log('');
    }

    if (!report.summary.passed) process.exit(1);

  } else if (action === 'rules') {
    const rules = getScanRules();
    console.log('');
    console.log(chalk.cyan.bold('  FISHI Security Scanner — Rules'));
    console.log(chalk.gray(`  ${rules.length} rules active`));
    console.log('');

    const byCategory: Record<string, typeof rules> = {};
    for (const r of rules) {
      if (!byCategory[r.category]) byCategory[r.category] = [];
      byCategory[r.category].push(r);
    }

    for (const [cat, catRules] of Object.entries(byCategory)) {
      console.log(chalk.white.bold(`  ${cat}`));
      for (const r of catRules) {
        const sevColor = r.severity === 'critical' ? chalk.red : r.severity === 'high' ? chalk.red : r.severity === 'medium' ? chalk.yellow : chalk.blue;
        console.log(`    ${sevColor(r.severity.padEnd(8))} ${r.id}${r.cwe ? chalk.gray(` (${r.cwe})`) : ''}`);
        console.log(chalk.gray(`             ${r.message}`));
      }
      console.log('');
    }

  } else {
    console.log(chalk.yellow(`  Unknown action: ${action}. Use: scan, rules`));
  }
}
