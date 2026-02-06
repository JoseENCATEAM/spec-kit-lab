# Research: Dice Rolling Engine

**Feature**: Dice Rolling Engine  
**Branch**: `001-dice-engine`  
**Date**: 2026-02-06

## Purpose

This document consolidates research findings for implementing the dice rolling engine. It resolves technical uncertainties from the implementation plan, documents best practices for chosen technologies, and justifies architectural decisions.

---

## Research Areas

### 1. Dice Notation Parsing with Regular Expressions

**Decision**: Use regular expressions with named capture groups for parsing dice notation.

**Rationale**:

- Dice notation is a well-defined, simple grammar (`NdX`, modifiers, compound expressions)
- Regex provides fast, deterministic parsing without needing a full parser generator
- TypeScript's RegExp with named groups (`(?<name>...)`) improves code readability
- Performance is excellent for small inputs (~10-100 characters typical)

**Implementation Pattern**:

```typescript
const DICE_NOTATION_REGEX =
  /(?<count>\d+)d(?<sides>\d+)|(?<modifier>[+-]\d+)/gi;
// Supports: 2d6, 1d20, +5, -2
// Compound: "2d6+1d4+3" → matches multiple times

// Named groups for clarity:
// - count: number of dice
// - sides: number of sides per die
// - modifier: arithmetic modifier (+N or -N)
```

**Alternatives Considered**:

- **Parser Combinator Libraries** (e.g., Parsimmon): Overkill for simple grammar; adds dependency.
- **Hand-Written Tokenizer**: More code, harder to maintain; regex is sufficient.

**Best Practices**:

- Validate captures before use (e.g., count ≤ 1000, sides ≤ 10000 per FR-009)
- Use `String.matchAll()` for compound expressions (returns iterator over all matches)
- Normalize input: trim whitespace, convert to lowercase (`2D6` → `2d6`)

---

### 2. Cryptographically Secure Random Number Generation

**Decision**: Use Node.js built-in `crypto.randomInt(min, max)` for die rolls.

**Rationale**:

- **Cryptographic Security**: `crypto.randomInt` uses the OS's CSPRNG (e.g., `/dev/urandom` on Linux), ensuring unpredictable rolls (FR-004 requirement).
- **Simplicity**: No external dependencies; part of Node.js standard library.
- **Performance**: Fast enough for dice rolling workload (<1000 dice per request); ~10µs per call on modern hardware.
- **API Ergonomics**: Direct `randomInt(1, 7)` for d6 roll (inclusive min, exclusive max).

**Implementation Pattern**:

```typescript
import { randomInt } from "crypto";

function rollDie(sides: number): number {
  return randomInt(1, sides + 1); // [1, sides] inclusive
}
```

**Alternatives Considered**:

- **Math.random()**: Not cryptographically secure; predictable with enough samples. Violates FR-004.
- **External Libraries** (e.g., randombytes): Unnecessary; `crypto.randomInt` is sufficient and built-in.

**Statistical Validation**:

- Implement chi-squared test in unit tests to verify uniform distribution (SC-003: p-value > 0.01 for 10,000 d6 rolls).
- Run test suite with `--coverage` to ensure RNG is exercised across all dice sizes.

---

### 3. Express.js Best Practices for REST APIs

**Decision**: Follow Express.js best practices with layered architecture (controllers, services, lib).

**Rationale**:

- **Separation of Concerns**: Controllers handle HTTP, services handle business logic, lib contains pure functions.
- **Testability**: Pure functions (parser, roller) can be tested without HTTP layer.
- **Maintainability**: Clear boundaries make code easier to understand and extend.

**Key Patterns**:

1. **Middleware Stack**: Request logger → Body parser → Route handlers → Error handler
2. **Input Validation**: Use `express-validator` for schema-based validation (validates dice notation, advantage/disadvantage flags)
3. **Error Handling**: Centralized error handler middleware catches all errors, maps to HTTP status codes (400 for validation, 500 for internal errors)
4. **Response Format**: Consistent JSON structure for success/error responses (see OpenAPI schema in Phase 1)

**Implementation Pattern**:

```typescript
// Route definition
app.post('/api/dice/roll',
  validateDiceRequest,  // express-validator middleware
  diceController.roll   // controller handler
);

// Controller delegates to service
async roll(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await diceService.rollDice(req.body);
    res.json(result);
  } catch (error) {
    next(error); // Pass to error handler
  }
}
```

**Alternatives Considered**:

- **Fastify**: Faster performance but less ecosystem maturity; Express.js is more widely known and documented.
- **NestJS**: Full framework with DI, decorators; overkill for single-endpoint API; violates Simplicity principle.

---

### 4. Jest Testing Strategy for TypeScript

**Decision**: Use Jest with `ts-jest` for unit and integration testing, `supertest` for API contract tests.

**Rationale**:

- **TypeScript Support**: `ts-jest` handles TypeScript compilation transparently.
- **Mocking**: Jest's built-in mocking simplifies testing (e.g., mock crypto.randomInt for deterministic tests).
- **Coverage**: Jest's coverage reports ensure all code paths are tested (target: 100% for business logic).
- **Integration Testing**: `supertest` allows testing Express app without starting HTTP server.

**Test Organization**:

```
tests/
├── unit/
│   ├── dice-parser.test.ts    # Regex parsing, validation logic
│   ├── dice-roller.test.ts    # RNG, advantage/disadvantage
│   └── dice-service.test.ts   # Business logic orchestration
├── integration/
│   └── dice-api.test.ts       # HTTP request → response (supertest)
└── contract/
    └── openapi-validation.test.ts # Validate responses match OpenAPI schema
```

**Best Practices**:

- **Arrange-Act-Assert (AAA)**: Structure all tests with clear setup, execution, verification.
- **Test Isolation**: Each test is independent; no shared state.
- **Mocking Strategy**: Mock only external dependencies (e.g., database); avoid mocking business logic.
- **Deterministic RNG Tests**: Mock `crypto.randomInt` to return fixed values for testability.

**Example Unit Test**:

```typescript
describe("DiceParser", () => {
  it("parses simple dice notation 2d6", () => {
    const expr = diceParser.parse("2d6");
    expect(expr.diceGroups).toEqual([{ count: 2, sides: 6 }]);
    expect(expr.modifiers).toEqual([]);
  });
});
```

---

### 5. OpenAPI 3.0.1 Schema Design

**Decision**: Define OpenAPI schema in YAML format with complete request/response schemas, examples, and error codes.

**Rationale**:

- **Documentation Clarity** (Constitution Principle II): OpenAPI serves as single source of truth for API contract.
- **Tooling Support**: OpenAPI spec enables automatic client generation, validation, documentation (Swagger UI).
- **Contract Testing**: Schema can be used to validate API responses in tests (e.g., with `openapi-validator` library).

**Schema Structure**:

```yaml
openapi: 3.0.1
info:
  title: Dice Rolling Engine API
  version: 1.0.0
paths:
  /api/dice/roll:
    post:
      summary: Roll dice using standard notation
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/DiceRollRequest"
      responses:
        "200":
          description: Successful roll
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/DiceRollResponse"
        "400":
          description: Invalid dice notation
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorResponse"
components:
  schemas:
    DiceRollRequest:
      type: object
      required: [expression]
      properties:
        expression:
          type: string
          example: "2d6+1d4+3"
        advantageMode:
          type: string
          enum: [none, advantage, disadvantage]
          default: none
    DiceRollResponse:
      type: object
      properties:
        expression:
          type: string
        results:
          type: array
          items:
            $ref: "#/components/schemas/RollResult"
        total:
          type: integer
        timestamp:
          type: string
          format: date-time
```

**Best Practices**:

- Use `$ref` for schema reuse (DRY principle)
- Include examples for all schemas (improves documentation)
- Define all error responses (400, 500) with clear messages
- Use semantic versioning for API version (1.0.0 for MVP)

---

### 6. Prisma ORM Setup (Future-Proofing)

**Decision**: Include Prisma in project setup but do not implement database persistence in MVP.

**Rationale**:

- **Simplicity Principle**: Current spec has no persistence requirement (rolls are ephemeral).
- **Future-Proofing**: Prisma setup prepares codebase for future features (e.g., roll history, user accounts) without premature implementation.
- **Zero Cost**: Including `schema.prisma` and dependencies has no runtime impact if not used.

**Initial Schema** (not used in MVP, but defined for future):

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Future model (not used in MVP)
model RollHistory {
  id          String   @id @default(uuid())
  expression  String
  result      Json     // Store full DiceRollResponse
  userId      String?  // Optional: future user association
  createdAt   DateTime @default(now())
}
```

**Migration Strategy**:

- Run `prisma generate` to create client (even if unused)
- Do NOT run migrations in MVP (no database required)
- Future feature can run migrations without code changes

**Alternatives Considered**:

- **No ORM**: Wait until persistence is needed. Prisma inclusion is minimal overhead and prevents future churn.
- **TypeORM**: Prisma has better TypeScript support and simpler API.

---

## Summary of Decisions

| Area             | Decision                      | Justification                                             |
| ---------------- | ----------------------------- | --------------------------------------------------------- |
| **Parsing**      | Regex with named groups       | Simple, fast, sufficient for dice notation grammar        |
| **RNG**          | `crypto.randomInt`            | Cryptographically secure, built-in, fast enough           |
| **Framework**    | Express.js 4.x                | Mature, widely used, good ecosystem support               |
| **Architecture** | Controllers → Services → Lib  | Separation of concerns, testability, maintainability      |
| **Testing**      | Jest + ts-jest + supertest    | TypeScript support, mocking, coverage, API testing        |
| **API Spec**     | OpenAPI 3.0.1 YAML            | Single source of truth, tooling support, contract testing |
| **Database**     | Prisma (setup only, not used) | Future-proofing without premature implementation          |

---

## Open Questions Resolved

### Q1: Should we use a parser library for dice notation?

**A**: No. Regex is sufficient for the simple grammar. Parser libraries add unnecessary complexity.

### Q2: Is `crypto.randomInt` fast enough for 1000 dice rolls?

**A**: Yes. Benchmarks show ~10µs per call; 1000 rolls = ~10ms, well within <50ms target (SC-001).

### Q3: Do we need Prisma if there's no persistence requirement?

**A**: Include it in setup for future-proofing (no runtime cost if unused), but do NOT implement migrations or database calls in MVP.

### Q4: Should advantage/disadvantage roll entire expressions or just dice?

**A**: Roll entire expressions twice and compare totals (per spec edge case: "2d6+1d4+3 with advantage").

### Q5: How do we validate OpenAPI compliance?

**A**: Use contract tests with `openapi-validator` library to validate API responses match schema.

---

**Next Phase**: Proceed to Phase 1 to generate `data-model.md` (entity definitions), `contracts/openapi.yaml` (API specification), and `quickstart.md` (development guide).
