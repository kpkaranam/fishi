export function getAgentRegistryTemplate(): string {
  return `# FISHI Agent Registry
# Auto-managed by FISHI — lists all registered agents and their status

agents:
  # Master Orchestrator (L0)
  - name: master-orchestrator
    role: master
    status: ready
    model: opus
    reports_to: null

  # Coordinators (L1)
  - name: planning-lead
    role: coordinator
    status: ready
    model: sonnet
    reports_to: master-orchestrator
    manages:
      - research-agent
      - planning-agent
      - architect-agent

  - name: dev-lead
    role: coordinator
    status: ready
    model: sonnet
    reports_to: master-orchestrator
    manages:
      - backend-agent
      - frontend-agent
      - fullstack-agent

  - name: qa-lead
    role: coordinator
    status: ready
    model: sonnet
    reports_to: master-orchestrator
    manages:
      - test-agent
      - review-agent
      - security-agent

  - name: devops-lead
    role: coordinator
    status: ready
    model: sonnet
    reports_to: master-orchestrator
    manages:
      - infra-agent
      - ci-agent
      - monitoring-agent

  # Planning Workers (L2)
  - name: research-agent
    role: worker
    status: ready
    model: sonnet
    reports_to: planning-lead

  - name: planning-agent
    role: worker
    status: ready
    model: sonnet
    reports_to: planning-lead

  - name: architect-agent
    role: worker
    status: ready
    model: opus
    reports_to: planning-lead

  # Dev Workers (L2)
  - name: backend-agent
    role: worker
    status: ready
    model: sonnet
    reports_to: dev-lead
    isolation: worktree

  - name: frontend-agent
    role: worker
    status: ready
    model: sonnet
    reports_to: dev-lead
    isolation: worktree

  - name: fullstack-agent
    role: worker
    status: ready
    model: sonnet
    reports_to: dev-lead
    isolation: worktree

  # QA Workers (L2)
  - name: test-agent
    role: worker
    status: ready
    model: sonnet
    reports_to: qa-lead

  - name: review-agent
    role: worker
    status: ready
    model: sonnet
    reports_to: qa-lead

  - name: security-agent
    role: worker
    status: ready
    model: sonnet
    reports_to: qa-lead

  # DevOps Workers (L2)
  - name: infra-agent
    role: worker
    status: ready
    model: sonnet
    reports_to: devops-lead

  - name: ci-agent
    role: worker
    status: ready
    model: haiku
    reports_to: devops-lead

  - name: monitoring-agent
    role: worker
    status: ready
    model: haiku
    reports_to: devops-lead
`;
}
