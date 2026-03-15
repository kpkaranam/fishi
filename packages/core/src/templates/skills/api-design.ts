export function getApiDesignSkill(): string {
  return `# API Design Skill

## Purpose
Design and implement consistent, well-documented RESTful APIs.

## Principles

### RESTful Conventions
- Use nouns for resources, not verbs: \`/users\` not \`/getUsers\`
- Use plural resource names: \`/users\`, \`/orders\`, \`/products\`
- Nest related resources: \`/users/:id/orders\`
- Use HTTP methods correctly:
  - \`GET\` — read (safe, idempotent)
  - \`POST\` — create (not idempotent)
  - \`PUT\` — full replace (idempotent)
  - \`PATCH\` — partial update (idempotent)
  - \`DELETE\` — remove (idempotent)

### Consistent Naming
- Use kebab-case for URLs: \`/user-profiles\`
- Use camelCase for JSON fields: \`{ "firstName": "Jane" }\`
- Use consistent query parameter names: \`page\`, \`limit\`, \`sort\`, \`filter\`

## Request/Response Schemas

### Request Validation
- Validate all inputs at the API boundary
- Use schema validation (Zod, Joi, JSON Schema, etc.)
- Return clear validation error messages
- Sanitize inputs to prevent injection attacks

### Response Format
\`\`\`json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
\`\`\`

### Error Response Format
\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": [
      { "field": "email", "message": "Must be a valid email address" }
    ]
  }
}
\`\`\`

## Error Handling Patterns

### HTTP Status Codes
- \`200\` — Success
- \`201\` — Created
- \`204\` — No Content (successful delete)
- \`400\` — Bad Request (validation error)
- \`401\` — Unauthorized (missing/invalid auth)
- \`403\` — Forbidden (insufficient permissions)
- \`404\` — Not Found
- \`409\` — Conflict (duplicate resource)
- \`422\` — Unprocessable Entity (business logic error)
- \`429\` — Too Many Requests (rate limited)
- \`500\` — Internal Server Error

### Error Handling Rules
- Never expose internal errors to clients
- Log full error details server-side
- Return consistent error format for all endpoints
- Include correlation/request IDs for tracing

## API Versioning Strategy
- Use URL path versioning: \`/api/v1/users\`
- Support at most 2 versions simultaneously
- Deprecation process:
  1. Announce deprecation with timeline
  2. Add \`Deprecation\` header to responses
  3. Migrate consumers
  4. Remove old version

## OpenAPI Spec Generation
- Generate OpenAPI 3.0+ specification for all endpoints
- Include:
  - Endpoint descriptions
  - Request/response schemas
  - Authentication requirements
  - Example requests and responses
  - Error responses
- Keep spec in sync with implementation (generate from code or validate against it)
- Store spec at \`docs/api/openapi.yaml\`

## Checklist
- [ ] RESTful resource naming
- [ ] Input validation on all endpoints
- [ ] Consistent error response format
- [ ] Proper HTTP status codes
- [ ] Authentication and authorization
- [ ] Rate limiting
- [ ] Pagination for list endpoints
- [ ] OpenAPI spec generated
- [ ] API versioning strategy documented
`;
}
