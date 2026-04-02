#!/usr/bin/env node
/**
 * @qlucent/fishi-patterns — MCP server for integration pattern blueprints
 *
 * Serves 55 battle-tested integration blueprints via MCP protocol (stdio).
 * Tools: search, info, select, list_categories, contribute_template
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLUEPRINTS_DIR = join(__dirname, '..', 'blueprints');

// ── Blueprint types ─────────────────────────────────────────────────

export interface Blueprint {
  id: string;
  name: string;
  category: string;
  frameworks: string[];
  dependencies: string[];
  description: string;
  content: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  count: number;
}

// ── Load blueprints from filesystem ─────────────────────────────────

function loadBlueprints(): Blueprint[] {
  const blueprints: Blueprint[] = [];

  if (!existsSync(BLUEPRINTS_DIR)) {
    process.stderr.write(`[fishi-patterns] Warning: blueprints directory not found at ${BLUEPRINTS_DIR}\n`);
    return blueprints;
  }

  const categories = readdirSync(BLUEPRINTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const category of categories) {
    const categoryDir = join(BLUEPRINTS_DIR, category);
    const files = readdirSync(categoryDir).filter(f => f.endsWith('.md'));

    for (const file of files) {
      const content = readFileSync(join(categoryDir, file), 'utf-8');
      const parsed = parseFrontmatter(content);

      if (parsed.frontmatter.id) {
        blueprints.push({
          id: parsed.frontmatter.id,
          name: parsed.frontmatter.name || basename(file, '.md'),
          category: parsed.frontmatter.category || category,
          frameworks: parseArray(parsed.frontmatter.frameworks),
          dependencies: parseArray(parsed.frontmatter.dependencies),
          description: parsed.frontmatter.description || '',
          content: parsed.body,
        });
      }
    }
  }

  return blueprints;
}

function parseFrontmatter(content: string): { frontmatter: Record<string, string>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const frontmatter: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
      frontmatter[key] = value;
    }
  }

  return { frontmatter, body: match[2] };
}

function parseArray(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }
}

// ── MCP tool implementations ────────────────────────────────────────

const blueprints = loadBlueprints();
process.stderr.write(`[fishi-patterns] Loaded ${blueprints.length} blueprints from ${BLUEPRINTS_DIR}\n`);

function searchBlueprints(query: string, category?: string): Omit<Blueprint, 'content'>[] {
  const q = query.toLowerCase();
  return blueprints
    .filter(b => {
      if (category && b.category !== category) return false;
      return (
        b.name.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.frameworks.some(f => f.toLowerCase().includes(q))
      );
    })
    .map(({ content, ...rest }) => rest);
}

function getInfo(patternId: string): Blueprint | null {
  return blueprints.find(b => b.id === patternId) || null;
}

function selectPattern(patternId: string): string | null {
  const blueprint = blueprints.find(b => b.id === patternId);
  return blueprint ? blueprint.content : null;
}

function listCategories(): CategoryInfo[] {
  const categoryMap = new Map<string, number>();
  for (const b of blueprints) {
    categoryMap.set(b.category, (categoryMap.get(b.category) || 0) + 1);
  }
  return Array.from(categoryMap.entries()).map(([id, count]) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '),
    count,
  }));
}

function getContributeTemplate(): string {
  const templatePath = join(__dirname, '..', 'PATTERN-TEMPLATE.md');
  if (existsSync(templatePath)) {
    return readFileSync(templatePath, 'utf-8');
  }
  return `---
id: {category}-{name}
name: {Pattern Name}
category: {category}
frameworks: []
dependencies: []
description: "{One-line description}"
---

# {Pattern Name}

## Setup
- Install: \`npm install {package}\`
- Env vars: {LIST_ENV_VARS}

## Architecture
{How to integrate this into your project}

## Key Patterns
{Important implementation patterns}

## Pitfalls
{Common mistakes to avoid}
`;
}

// ── MCP JSON-RPC server (stdio) ─────────────────────────────────────

const TOOLS = [
  {
    name: 'search',
    description: 'Search integration blueprints by keyword and optional category',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search keyword (e.g., "stripe", "auth")' },
        category: { type: 'string', description: 'Optional category filter' },
      },
      required: ['query'],
    },
  },
  {
    name: 'info',
    description: 'Get full details of a specific integration blueprint',
    inputSchema: {
      type: 'object',
      properties: {
        pattern_id: { type: 'string', description: 'Blueprint ID (e.g., "payments-stripe")' },
      },
      required: ['pattern_id'],
    },
  },
  {
    name: 'select',
    description: 'Select a blueprint and get its content ready for agent context injection',
    inputSchema: {
      type: 'object',
      properties: {
        pattern_id: { type: 'string', description: 'Blueprint ID (e.g., "payments-stripe")' },
      },
      required: ['pattern_id'],
    },
  },
  {
    name: 'list_categories',
    description: 'List all available pattern categories with blueprint counts',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'contribute_template',
    description: 'Get the blueprint contribution template for creating new patterns',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

function handleToolCall(name: string, args: Record<string, unknown>): unknown {
  switch (name) {
    case 'search':
      return { blueprints: searchBlueprints(args.query as string, args.category as string | undefined) };
    case 'info': {
      const info = getInfo(args.pattern_id as string);
      return info || { error: `Pattern '${args.pattern_id}' not found` };
    }
    case 'select': {
      const content = selectPattern(args.pattern_id as string);
      return content ? { content } : { error: `Pattern '${args.pattern_id}' not found` };
    }
    case 'list_categories':
      return { categories: listCategories() };
    case 'contribute_template':
      return { template: getContributeTemplate() };
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

function handleMessage(msg: Record<string, unknown>): Record<string, unknown> {
  const id = msg.id;
  const method = msg.method as string;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'fishi-patterns', version: '0.1.0' },
      },
    };
  }

  if (method === 'notifications/initialized') {
    return { jsonrpc: '2.0', id, result: {} };
  }

  if (method === 'tools/list') {
    return { jsonrpc: '2.0', id, result: { tools: TOOLS } };
  }

  if (method === 'tools/call') {
    const params = msg.params as Record<string, unknown>;
    const toolName = params.name as string;
    const toolArgs = (params.arguments || {}) as Record<string, unknown>;

    try {
      const result = handleToolCall(toolName, toolArgs);
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        },
      };
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }],
          isError: true,
        },
      };
    }
  }

  return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
}

// ── Stdio transport ─────────────────────────────────────────────────

const rl = createInterface({ input: process.stdin });
let buffer = '';

rl.on('line', (line) => {
  buffer += line;
  try {
    const msg = JSON.parse(buffer);
    buffer = '';
    const response = handleMessage(msg);
    if (response.id !== undefined) {
      process.stdout.write(JSON.stringify(response) + '\n');
    }
  } catch {
    // Incomplete JSON — wait for more input
  }
});

rl.on('close', () => {
  process.exit(0);
});

// Export for testing
export { searchBlueprints, getInfo, selectPattern, listCategories, getContributeTemplate, loadBlueprints };
