# @qlucent/fishi-core

Shared templates, types, and generators for the [FISHI](https://github.com/kpkaranam/fishi) framework.

[![npm version](https://img.shields.io/npm/v/@qlucent/fishi-core?style=flat-square&color=0066cc)](https://www.npmjs.com/package/@qlucent/fishi-core)
[![license](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](https://github.com/kpkaranam/fishi/blob/master/LICENSE)

## What is this?

This is the core library powering FISHI's scaffold generator, agent templates, hook scripts, and configuration templates. It is consumed by [`@qlucent/fishi`](https://www.npmjs.com/package/@qlucent/fishi) (the CLI) and the FISHI plugin.

**You probably want [`@qlucent/fishi`](https://www.npmjs.com/package/@qlucent/fishi) instead** — that's the CLI tool you install and run.

## What's included

| Category | Count | Description |
|----------|-------|-------------|
| Agent templates | 19 | Master orchestrator, 4 coordinators, 13 workers, deep research |
| Domain agents | 4 | SaaS, Marketplace, Mobile, AI/ML architects |
| Skill templates | 13 | Brainstorming, code-gen, debugging, testing, PRD, etc. |
| Hook scripts | 17 | Session start, checkpoint, phase guard, worktree guard, etc. |
| Command templates | 8 | `/fishi-init`, `/fishi-gate`, `/fishi-board`, `/fishi-sprint`, etc. |
| Config templates | 10 | CLAUDE.md, settings.json, SOUL.md, AGENTS.md, rules, etc. |

## Usage

```typescript
import {
  generateScaffold,
  frontendAgentTemplate,
  getMasterOrchestratorTemplate,
  getClaudeMdTemplate,
} from '@qlucent/fishi-core';

// Generate a full project scaffold
await generateScaffold('./my-project', {
  projectName: 'my-app',
  projectType: 'greenfield',
  interactive: false,
  costMode: 'balanced',
  description: 'My project',
});

// Or use individual templates
const frontendAgent = frontendAgentTemplate({
  projectName: 'my-app',
  projectDescription: 'My project',
  projectType: 'greenfield',
  costMode: 'balanced',
  timestamp: new Date().toISOString(),
});
```

## Links

- [FISHI CLI (`@qlucent/fishi`)](https://www.npmjs.com/package/@qlucent/fishi) — the tool you install and run
- [GitHub](https://github.com/kpkaranam/fishi) — source code, issues, changelog
- [License](https://github.com/kpkaranam/fishi/blob/master/LICENSE) — MIT
