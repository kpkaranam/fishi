export function getBrownfieldAnalysisSkill(): string {
  return `# Brownfield Analysis Skill

## Purpose
Analyze an existing codebase to understand its structure, conventions, and patterns before making changes.

## Process

### 1. Scan Directory Structure
- Map the top-level directory layout
- Identify the project type (monorepo, single package, microservices, etc.)
- Note key directories: source, tests, config, docs, scripts
- Identify framework patterns (Next.js app/, pages/; Rails app/models/; etc.)

### 2. Read Dependency Files
- Parse \`package.json\`, \`requirements.txt\`, \`Cargo.toml\`, \`go.mod\`, or equivalent
- List major dependencies and their versions
- Identify the build system and toolchain
- Note dev dependencies (linters, formatters, test frameworks)

### 3. Extract Code Conventions
- Check for configuration files: \`.eslintrc\`, \`.prettierrc\`, \`tsconfig.json\`, \`.editorconfig\`
- Identify naming conventions (camelCase, snake_case, PascalCase)
- Note file naming patterns (kebab-case.ts, PascalCase.tsx, etc.)
- Check import style (relative vs. aliases, barrel exports)
- Identify state management patterns
- Note error handling patterns

### 4. Map API Structure and Data Models
- List API routes/endpoints and their HTTP methods
- Identify data models / schemas / types
- Note ORM or database access patterns
- Map relationships between models
- Identify validation patterns

### 5. Check Test Coverage
- Locate test directories and files
- Identify testing frameworks in use
- Note test naming conventions
- Check for CI/CD test configuration
- Estimate coverage level (high/medium/low/none)

### 6. Identify Tech Debt
- Look for TODO/FIXME/HACK comments
- Check for outdated dependencies
- Note inconsistent patterns across the codebase
- Identify dead code or unused exports
- Check for security concerns (hardcoded secrets, missing input validation)

## Output
Save the complete analysis to \`.fishi/memory/brownfield-analysis.md\` with the following structure:

\`\`\`markdown
# Brownfield Analysis: <project-name>

## Overview
- Project type:
- Primary language:
- Framework:
- Build system:

## Directory Structure
<tree output>

## Dependencies
### Production
- ...
### Development
- ...

## Code Conventions
- Naming:
- File structure:
- Import style:
- Error handling:

## API Surface
| Endpoint | Method | Description |
|----------|--------|-------------|
| ...      | ...    | ...         |

## Data Models
- ...

## Test Coverage
- Framework:
- Coverage level:
- Conventions:

## Tech Debt
- ...

## Recommendations
- ...
\`\`\`
`;
}
