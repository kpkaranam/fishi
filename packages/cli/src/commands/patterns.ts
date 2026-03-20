import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import {
  getPatternCategories,
  getPatternsByCategory,
  getPattern,
  searchPatterns,
  saveSelectedPatterns,
  readSelectedPatterns,
  generatePatternGuide,
} from '@qlucent/fishi-core';

export async function patternsCommand(
  action: string,
  options: { category?: string; query?: string; output?: string }
): Promise<void> {
  const targetDir = process.cwd();

  if (action === 'list') {
    console.log('');
    console.log(chalk.cyan.bold('  FISHI Pattern Marketplace'));
    console.log(chalk.gray('  Pre-built architectural blueprints for common integrations'));
    console.log('');

    const categories = getPatternCategories();
    for (const cat of categories) {
      console.log(chalk.white.bold(`  ${cat.name}`));
      console.log(chalk.gray(`  ${cat.description}`));
      for (const p of cat.patterns) {
        console.log(chalk.gray(`    - ${chalk.cyan(p.id)} — ${p.name} (${p.tools.join(', ')})`));
      }
      console.log('');
    }

    const total = categories.reduce((s, c) => s + c.patterns.length, 0);
    console.log(chalk.gray(`  ${categories.length} categories, ${total} patterns available`));
    console.log('');

  } else if (action === 'search') {
    if (!options.query) {
      console.log(chalk.yellow('  Usage: fishi patterns search --query "stripe"'));
      return;
    }
    const results = searchPatterns(options.query);
    console.log('');
    console.log(chalk.cyan.bold(`  Search: "${options.query}" — ${results.length} results`));
    console.log('');
    for (const p of results) {
      console.log(`  ${chalk.cyan(p.id)} — ${p.name} [${p.category}]`);
      console.log(chalk.gray(`    ${p.description}`));
      console.log(chalk.gray(`    Tools: ${p.tools.join(', ')}`));
      console.log('');
    }

  } else if (action === 'info') {
    if (!options.query) {
      console.log(chalk.yellow('  Usage: fishi patterns info --query "stripe"'));
      return;
    }
    const pattern = getPattern(options.query);
    if (!pattern) {
      console.log(chalk.yellow(`  Pattern "${options.query}" not found. Run: fishi patterns list`));
      return;
    }
    console.log('');
    console.log(chalk.cyan.bold(`  ${pattern.name}`));
    console.log(chalk.gray(`  Category: ${pattern.category}`));
    console.log(chalk.gray(`  Tools: ${pattern.tools.join(', ')}`));
    console.log('');
    console.log(pattern.guide);

  } else if (action === 'select') {
    if (!options.query) {
      console.log(chalk.yellow('  Usage: fishi patterns select --query "stripe,auth0,sendgrid"'));
      return;
    }
    const ids = options.query.split(',').map(s => s.trim());
    const valid: string[] = [];
    const invalid: string[] = [];
    for (const id of ids) {
      if (getPattern(id)) valid.push(id);
      else invalid.push(id);
    }
    if (invalid.length > 0) {
      console.log(chalk.yellow(`  Unknown patterns: ${invalid.join(', ')}`));
    }
    if (valid.length > 0) {
      saveSelectedPatterns(targetDir, valid);

      // Generate and save guide
      const guide = generatePatternGuide(valid);
      const guidePath = path.join(targetDir, '.fishi', 'patterns-guide.md');
      fs.writeFileSync(guidePath, guide, 'utf-8');

      console.log(chalk.green(`  Selected ${valid.length} patterns: ${valid.join(', ')}`));
      console.log(chalk.green(`  Guide saved to .fishi/patterns-guide.md`));
    }

  } else if (action === 'selected') {
    const selected = readSelectedPatterns(targetDir);
    if (selected.length === 0) {
      console.log(chalk.gray('  No patterns selected. Run: fishi patterns select --query "stripe,auth0"'));
      return;
    }
    console.log('');
    console.log(chalk.cyan.bold('  Selected Patterns'));
    for (const id of selected) {
      const p = getPattern(id);
      if (p) console.log(`  ${chalk.cyan(p.id)} — ${p.name} (${p.tools.join(', ')})`);
    }
    console.log('');

  } else {
    console.log(chalk.yellow(`  Unknown action: ${action}. Use: list, search, info, select, selected`));
  }
}
