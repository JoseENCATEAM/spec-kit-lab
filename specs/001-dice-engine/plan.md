# Implementation Plan: Dice Rolling Engine

**Branch**: `001-dice-engine` | **Date**: 2026-02-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-dice-engine/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a REST API for dice rolling with standard tabletop RPG notation support (NdX, modifiers, compound expressions). Core functionality includes regex-based expression parsing, cryptographically secure random number generation, and advantage/disadvantage mechanics. The API is stateless, returns both individual die results and totals, and enforces resource limits (max 1000 dice, 10000 sides). Implementation uses TypeScript/Express.js with a layered architecture (controllers → services → business logic) for testability and maintainability.

## Technical Context

**Language/Version**: TypeScript (target ES2022) with Node.js 18+ runtime  
**Primary Dependencies**: Express.js 4.x (REST framework), Prisma 5.x (ORM), crypto (Node.js built-in for secure RNG), express-validator (input validation)  
**Storage**: PostgreSQL 15+ (via Prisma ORM) - used only if future features require persistence (current spec has no persistence requirement; dice rolls are ephemeral)  
**Testing**: Jest 29.x with ts-jest for TypeScript support; supertest for API integration tests  
**Target Platform**: Linux server (containerized with Docker), deployable to Azure App Service or Container Instances  
**Project Type**: Web application (backend API only; frontend is separate feature)  
**Performance Goals**: <50ms for parsing and rolling (SC-001), <200ms p95 for API response (SC-002), handle 100+ concurrent requests  
**Constraints**: <200ms p95 response time (constitution requirement), stateless operation (no session management), max 1000 dice and 10000 sides per expression (resource limits)  
**Scale/Scope**: Single REST endpoint (`POST /api/dice/roll`), 3 prioritized user stories (basic rolls → complex expressions → advantage/disadvantage), ~500-800 LOC

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with all five core principles from `.specify/memory/constitution.md`:

- [x] **RESTful Design**: Architecture follows REST constraints (POST /api/dice/roll with JSON request/response, stateless, proper 2xx/4xx status codes, resource-oriented design)
- [x] **Documentation Clarity**: All endpoints will be documented in OpenAPI 3.0.1 with complete schemas (DiceRollRequest, DiceRollResponse, ErrorResponse), error responses, and examples (Phase 1 deliverable: contracts/openapi.yaml)
- [x] **Testability**: Unit test strategy defined: Jest tests for DiceParser (regex parsing), DiceRoller (RNG, advantage/disadvantage), DiceService (end-to-end), and contract tests via supertest
- [x] **Simplicity**: Solution is straightforward: single endpoint, regex-based parser, layered architecture (controller → service → business logic), no over-engineering (Prisma included for future persistence but not used in MVP)
- [x] **Performance**: Design targets <50ms parsing/rolling, <200ms p95 API response; crypto.randomInt is fast enough for <1000 dice; performance will be validated with Jest benchmarks and load tests

**Violations**: None

## Project Structure

### Documentation (this feature)

```text
specs/001-dice-engine/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── openapi.yaml     # OpenAPI 3.0.1 specification for dice API
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── controllers/
│   └── dice.controller.ts        # Express route handlers for /api/dice/roll
├── services/
│   └── dice.service.ts            # Business logic orchestration (parse → roll → format)
├── models/
│   ├── dice-expression.model.ts   # DiceExpression entity (parsed notation)
│   ├── dice-roll.model.ts         # DiceRoll entity (completed roll with results)
│   └── roll-result.model.ts       # RollResult entity (single dice group results)
├── lib/
│   ├── dice-parser.ts             # Regex-based parser for dice notation
│   ├── dice-roller.ts             # Cryptographically secure RNG roller
│   └── validators.ts              # Input validation schemas (express-validator)
├── middleware/
│   ├── error-handler.ts           # Global error handling middleware
│   └── request-logger.ts          # Request/response logging
├── types/
│   └── index.ts                   # TypeScript type definitions and enums
├── app.ts                         # Express app setup (middleware, routes)
└── server.ts                      # Entry point (start HTTP server)

tests/
├── unit/
│   ├── dice-parser.test.ts        # Parser unit tests (regex, validation)
│   ├── dice-roller.test.ts        # Roller unit tests (RNG, advantage/disadvantage)
│   └── dice-service.test.ts       # Service unit tests (end-to-end business logic)
├── integration/
│   └── dice-api.test.ts           # API integration tests (supertest)
└── contract/
    └── openapi-validation.test.ts # Validate API responses match OpenAPI schema

prisma/
├── schema.prisma                  # Prisma schema (future persistence; not used in MVP)
└── migrations/                    # Database migrations (empty for MVP)

package.json                       # Dependencies: express, prisma, jest, supertest, etc.
tsconfig.json                      # TypeScript compiler config
jest.config.js                     # Jest test configuration
Dockerfile                         # Container image definition
.env.example                       # Environment variables template
```

**Structure Decision**: Web application (backend) architecture selected. The dice engine is implemented as a REST API with Express.js following the **Controller → Service → Business Logic** layered pattern:

- **Controllers** handle HTTP requests/responses and input validation
- **Services** orchestrate business logic (parse expression → roll dice → format results)
- **Lib** contains pure functions (parser, roller) for maximum testability
- **Models** define TypeScript entities matching spec requirements (DiceRoll, DiceExpression, RollResult)

Prisma ORM is included in the stack to support future persistence features (e.g., roll history, user preferences) but is **not used in the MVP** since dice rolls are stateless and ephemeral per spec requirements. This prepares the codebase for easy extension without violating the Simplicity principle (no premature implementation of unused features).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

_No violations identified. All five core principles are satisfied by the proposed design._
