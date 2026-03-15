export function getTestingSkill(): string {
  return `# Testing Skill

## Purpose
Define and execute comprehensive testing strategies across all testing levels.

## Test Levels

### Unit Tests
- Test individual functions, methods, and classes in isolation
- Mock external dependencies (databases, APIs, file system)
- Fast execution — the full unit test suite should run in seconds
- Target: every public function should have at least one unit test

### Integration Tests
- Test interactions between components
- Use real dependencies where practical (test databases, in-memory stores)
- Test API endpoints end-to-end within the application
- Verify database queries, external service calls, and message flows

### End-to-End (E2E) Tests
- Test complete user workflows through the full stack
- Use browser automation (Playwright, Cypress) for web applications
- Keep E2E tests focused on critical paths — they are slow and brittle
- Run in a production-like environment

## Coverage Targets
- **Unit tests**: aim for 80%+ line coverage on business logic
- **Integration tests**: cover all API endpoints and key data flows
- **E2E tests**: cover critical user journeys (login, core features, payment)
- Coverage is a guide, not a goal — 100% coverage with bad tests is worthless

## Test Naming Conventions
Use descriptive names that document behavior:

\`\`\`
// Pattern: <unit>_<scenario>_<expected result>
// or: should <expected behavior> when <condition>

describe("UserService.createUser", () => {
  it("should create a user with valid input", () => { ... });
  it("should throw ValidationError when email is invalid", () => { ... });
  it("should throw ConflictError when email already exists", () => { ... });
});
\`\`\`

## Mock/Stub Guidelines

### When to Mock
- External APIs and services
- Database calls in unit tests
- File system operations
- Time-dependent behavior (use fake timers)
- Non-deterministic behavior (random, UUIDs)

### When NOT to Mock
- The code under test itself
- Simple utility functions
- Data structures and value objects
- In integration tests (use real dependencies)

### Mock Best Practices
- Prefer dependency injection over monkey-patching
- Verify mock interactions only when the interaction IS the behavior
- Reset mocks between tests to avoid state leakage
- Use factories for test data instead of hardcoding

## Test Structure
Follow the Arrange-Act-Assert pattern:

\`\`\`
it("should calculate total with tax", () => {
  // Arrange
  const cart = createCart([{ price: 100, quantity: 2 }]);
  const taxRate = 0.1;

  // Act
  const total = cart.calculateTotal(taxRate);

  // Assert
  expect(total).toBe(220);
});
\`\`\`

## Test Quality Rules
- Each test should test ONE thing
- Tests should be independent and runnable in any order
- No test should depend on another test's side effects
- Use descriptive assertion messages
- Avoid testing implementation details — test behavior
- Keep tests readable: prefer duplication over abstraction in tests

## Checklist
- [ ] Unit tests for all business logic
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical user flows
- [ ] Test data factories created
- [ ] Mocks are minimal and focused
- [ ] All tests pass in CI
- [ ] Coverage meets targets
`;
}
