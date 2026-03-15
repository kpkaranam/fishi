import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const MCP_CATALOG: Record<string, { command: string; args: string[]; description: string }> = {
  github: {
    command: 'http',
    args: ['https://api.githubcopilot.com/mcp/'],
    description: 'GitHub — PRs, issues, code search, Actions',
  },
  'sequential-thinking': {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
    description: 'Sequential Thinking — complex problem decomposition',
  },
  context7: {
    command: 'npx',
    args: ['-y', '@upstash/context7-mcp@latest'],
    description: 'Context7 — up-to-date library documentation',
  },
  perplexity: {
    command: 'npx',
    args: ['-y', 'perplexity-mcp'],
    description: 'Perplexity — web search with citations',
  },
  supabase: {
    command: 'npx',
    args: ['-y', 'supabase-mcp'],
    description: 'Supabase — Postgres, auth, storage',
  },
  playwright: {
    command: 'npx',
    args: ['-y', '@anthropic/playwright-mcp'],
    description: 'Playwright — browser automation, E2E testing',
  },
};

export async function mcpCommand(action: string, name?: string): Promise<void> {
  const targetDir = process.cwd();
  const mcpPath = path.join(targetDir, '.mcp.json');

  switch (action) {
    case 'list':
      return listMcps(mcpPath);
    case 'add':
      if (!name) {
        console.log(chalk.red('\n  Usage: fishi mcp add <name>\n'));
        console.log(chalk.bold('  Available MCPs:'));
        for (const [key, value] of Object.entries(MCP_CATALOG)) {
          console.log(chalk.gray(`    ${key} — ${value.description}`));
        }
        return;
      }
      return addMcp(mcpPath, name);
    case 'remove':
      if (!name) {
        console.log(chalk.red('\n  Usage: fishi mcp remove <name>\n'));
        return;
      }
      return removeMcp(mcpPath, name);
    default:
      console.log(chalk.red(`\n  Unknown action: ${action}`));
      console.log(chalk.gray('  Valid actions: add | list | remove\n'));
  }
}

function listMcps(mcpPath: string): void {
  if (!fs.existsSync(mcpPath)) {
    console.log(chalk.yellow('\n  No .mcp.json found. Run `fishi init` first.\n'));
    return;
  }

  const config = JSON.parse(fs.readFileSync(mcpPath, 'utf-8'));
  const servers = Object.keys(config);

  console.log(chalk.bold('\n  Configured MCP Servers:'));
  if (servers.length === 0) {
    console.log(chalk.gray('  None configured.\n'));
    return;
  }

  for (const server of servers) {
    const entry = config[server];
    const catalogEntry = MCP_CATALOG[server];
    const desc = catalogEntry ? chalk.gray(` — ${catalogEntry.description}`) : '';
    console.log(chalk.cyan(`  ✓ ${server}`) + desc);
  }
  console.log('');
}

function addMcp(mcpPath: string, name: string): void {
  const catalog = MCP_CATALOG[name];
  if (!catalog) {
    console.log(chalk.yellow(`\n  "${name}" not found in FISHI catalog.`));
    console.log(chalk.gray('  Available: ' + Object.keys(MCP_CATALOG).join(', ')));
    console.log(chalk.gray('  You can manually add it to .mcp.json\n'));
    return;
  }

  let config: Record<string, unknown> = {};
  if (fs.existsSync(mcpPath)) {
    config = JSON.parse(fs.readFileSync(mcpPath, 'utf-8'));
  }

  if (config[name]) {
    console.log(chalk.yellow(`\n  "${name}" is already configured.\n`));
    return;
  }

  if (catalog.command === 'http') {
    config[name] = { type: 'http', url: catalog.args[0] };
  } else {
    config[name] = { type: 'stdio', command: catalog.command, args: catalog.args };
  }

  fs.writeFileSync(mcpPath, JSON.stringify(config, null, 2) + '\n');
  console.log(chalk.green(`\n  ✓ Added ${name}: ${catalog.description}\n`));

  // Update MCP registry
  const registryPath = path.join(path.dirname(mcpPath), '.fishi', 'mcp-registry.yaml');
  if (fs.existsSync(registryPath)) {
    const registry = parseYaml(fs.readFileSync(registryPath, 'utf-8')) || {};
    if (!registry.installed_mcps) registry.installed_mcps = { core: [], project: [], user: [] };
    if (!registry.installed_mcps.project.includes(name)) {
      registry.installed_mcps.project.push(name);
      fs.writeFileSync(registryPath, stringifyYaml(registry));
    }
  }
}

function removeMcp(mcpPath: string, name: string): void {
  if (!fs.existsSync(mcpPath)) {
    console.log(chalk.yellow('\n  No .mcp.json found.\n'));
    return;
  }

  const config = JSON.parse(fs.readFileSync(mcpPath, 'utf-8'));
  if (!config[name]) {
    console.log(chalk.yellow(`\n  "${name}" is not configured.\n`));
    return;
  }

  delete config[name];
  fs.writeFileSync(mcpPath, JSON.stringify(config, null, 2) + '\n');
  console.log(chalk.green(`\n  ✓ Removed ${name}\n`));
}
