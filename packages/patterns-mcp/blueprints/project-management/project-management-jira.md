---
id: project-management-jira
name: Jira
category: project-management
frameworks: ["Jira","jira-client","Atlassian API"]
dependencies: ["Jira","jira-client","Atlassian API"]
description: "Enterprise project management with Agile boards, sprints, and automation"
---

# Jira

**Category:** Project Management
**Tools:** Jira, jira-client, Atlassian API

### Setup
- Install: `pnpm add jira-client` or use Atlassian REST API directly
- Env vars: JIRA_HOST, JIRA_EMAIL, JIRA_API_TOKEN

### Architecture
- REST API: Create/update issues, manage sprints, query with JQL
- Webhooks: Issue created, updated, transitioned — POST to your endpoint
- Automation: Jira Automation rules for workflow triggers (on PR merge, auto-transition)
- Integration: Link commits/PRs to Jira issues via branch naming (PROJ-123)

### Key Patterns
- Smart commits: `git commit -m "PROJ-123 fix login bug #done"` auto-transitions issues
- Use JQL for complex queries: `project = PROJ AND sprint in openSprints()`
- Webhooks for syncing Jira state with your app (status dashboards, notifications)
- Custom fields for project-specific metadata

### Pitfalls
- API rate limits: 100 requests per 10 seconds per user — implement request queuing
- Jira Cloud API differs from Server/Data Center — verify endpoint compatibility
- API tokens are tied to user accounts — use service accounts for integrations
