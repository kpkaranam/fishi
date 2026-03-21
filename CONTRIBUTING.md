# Contributing to FISHI

Thanks for your interest in contributing! FISHI is an autonomous multi-agent framework for Claude Code, and we welcome contributions of all kinds.

## Getting Started

### Prerequisites

- Node.js >= 18
- Git
- pnpm (recommended) or npm/yarn

### Setup

```bash
git clone https://github.com/kpkaranam/fishi.git
cd fishi
npm install
```

### Project Structure

```
packages/
  core/     # @qlucent/fishi-core — templates, generators, types
  cli/      # @qlucent/fishi — CLI commands
  plugin/   # Claude Code plugin
```

### Development

```bash
# Run tests
npm test

# Run specific package tests
npx vitest run packages/core/
npx vitest run packages/cli/

# Build
npm run build:core
npm run build:cli
```

## How to Contribute

### Reporting Bugs

- Check [existing issues](https://github.com/kpkaranam/fishi/issues) first
- Use the **Bug Report** template
- Include: steps to reproduce, expected vs actual behavior, environment details

### Suggesting Features

- Open a **Feature Request** issue
- Describe the use case and why it matters
- We prioritize features that align with FISHI's core mission: structured, safe, autonomous development

### Submitting Code

1. Fork the repo and create a branch: `git checkout -b feat/my-feature`
2. Write tests first (TDD is a core practice in FISHI)
3. Make your changes
4. Run the test suite: `npx vitest run`
5. Commit with a descriptive message: `git commit -m "feat: add my feature"`
6. Push and open a Pull Request

### Pull Request Guidelines

- One feature/fix per PR
- Include tests for new functionality
- All existing tests must pass
- Follow existing code patterns (zero external dependencies for core modules)
- Update documentation if adding new CLI commands or features

## Code Style

- TypeScript strict mode
- Zero external dependencies for generated scripts (Node.js built-ins only)
- Vitest for testing
- Conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`)

## Areas We Need Help

- Testing FISHI on real-world projects (brownfield and greenfield)
- Domain agent templates for new project types
- Pattern marketplace additions
- Security scanner rules
- Documentation and tutorials
- Translations

## Community

- [GitHub Issues](https://github.com/kpkaranam/fishi/issues) — bugs, features, discussions
- [GitHub Discussions](https://github.com/kpkaranam/fishi/discussions) — questions, ideas, showcase

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
