export interface ModelRoutingRule {
  task: string;
  model: 'opus' | 'sonnet' | 'haiku';
  reason: string;
}

export function getModelRoutingReference(): string {
  return `# FISHI Model Routing Reference

## Routing Principle
Use the most capable model only when the task demands it. Default to Sonnet.
Escalate to Opus for decisions that are expensive to reverse. Use Haiku for
tasks where speed matters more than nuance.

## Coordinator Model Routing

### Use Opus (latest) for:
| Task | Why Opus |
|------|----------|
| Code review (pre-merge) | Catching subtle bugs saves hours of debugging later |
| Architecture decisions | Wrong architecture is the most expensive mistake |
| Security-sensitive review | Security flaws can be catastrophic |
| Cross-coordinator conflict resolution | Requires understanding multiple domains simultaneously |
| Complex task decomposition | Breaking a vague objective into the right tasks is high-leverage |
| Sprint planning & estimation | Bad estimates cascade through the entire project |
| Dynamic agent/coordinator creation | Agent quality determines downstream work quality |
| PRD review & validation | PRD errors propagate to every subsequent phase |

### Use Sonnet for:
| Task | Why Sonnet |
|------|-----------|
| Task assignment | Matching task to agent is straightforward once tasks are defined |
| Status collection | Reading and summarizing state files |
| Worktree creation/cleanup | Mechanical git operations |
| TaskBoard updates | Moving tasks between columns, updating counts |
| Progress reporting to Master | Summarizing completed work |
| Routine delegation | Passing well-defined tasks to workers |
| Standard code implementation | Most development work |
| Test writing | Following established patterns |

### Use Haiku for:
| Task | Why Haiku |
|------|----------|
| Documentation writing | README, API docs, guides |
| Changelog generation | Summarizing git history |
| File scaffolding | Creating boilerplate from templates |
| Marketing copy | Blog posts, landing page text |
| Simple formatting/linting | Mechanical text transforms |

## Cost Mode Overrides

### Performance Mode
- All coordinator tasks use Opus
- Worker implementation tasks use Sonnet (not Haiku)
- Fastest results, highest cost

### Balanced Mode (Default)
- Follow the routing table above
- Coordinators switch between Opus and Sonnet based on task type
- Workers use Sonnet for code, Haiku for docs

### Economy Mode
- Coordinators default to Sonnet, Opus only for security and architecture
- Workers default to Haiku where possible, Sonnet for complex code
- Skip optional review loops
- Collapse discovery + PRD into a single phase if project is simple
`;
}
