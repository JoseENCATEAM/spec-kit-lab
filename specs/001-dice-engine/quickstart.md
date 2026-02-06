# Quickstart Guide: Dice Rolling Engine

**Feature**: Dice Rolling Engine  
**Branch**: `001-dice-engine`  
**Date**: 2026-02-06

## Purpose

This guide provides step-by-step instructions for setting up the development environment, implementing the dice rolling engine, and verifying the implementation against specifications.

---

## Prerequisites

Before starting development, ensure you have:

- **Node.js 18+**: `node --version` (should be ≥18.0.0)
- **npm or yarn**: Package manager for dependencies
- **PostgreSQL 15+**: Database server (for future persistence; not required for MVP)
- **Git**: Version control
- **VS Code** (recommended): IDE with TypeScript support
- **Docker** (optional): For containerized development

---

## 1. Project Setup

### Clone and Setup

```bash
# Clone the repository (or ensure you're on the correct branch)
git checkout 001-dice-engine

# Navigate to project root
cd /path/to/project

# Install dependencies
npm install

# Setup Prisma (generates client, even though not used in MVP)
npx prisma generate

# Copy environment variables template
cp .env.example .env

# Edit .env (optional for MVP, required for future database features)
# DATABASE_URL="postgresql://user:password@localhost:5432/dicedb"
```

### Project Dependencies

Key packages that should be in `package.json`:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "express-validator": "^7.0.1",
    "@prisma/client": "^5.8.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "@types/jest": "^29.5.11",
    "@types/supertest": "^6.0.2",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2",
    "ts-jest": "^29.1.1",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "prisma": "^5.8.0",
    "nodemon": "^3.0.2",
    "eslint": "^8.56.0",
    "@typescript-eslint/parser": "^6.15.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0"
  }
}
```

---

## 2. Implementation Order

Follow the user story priorities (P1 → P2 → P3) for incremental development:

### Phase 1: Basic Dice Rolling (P1)

**Goal**: MVP - Parse and roll simple dice notation (e.g., `2d6`, `1d20+5`)

**Tasks** (see `tasks.md` for detailed breakdown):

1. Implement `DiceParser` with regex for simple notation
2. Implement `DiceRoller` with `crypto.randomInt`
3. Implement `DiceService` orchestration
4. Create `DiceController` for REST endpoint
5. Write unit tests for parser, roller, service
6. Write integration tests for API endpoint

**Test Command**:

```bash
npm test -- dice-parser.test.ts
npm test -- dice-roller.test.ts
npm test -- dice-service.test.ts
npm test -- dice-api.test.ts
```

**API Test** (manual verification):

```bash
# Start server
npm run dev

# Test basic roll
curl -X POST http://localhost:3000/api/dice/roll \
  -H "Content-Type: application/json" \
  -d '{"expression": "2d6"}'

# Expected: 200 OK with results array and total
```

---

### Phase 2: Complex Expression Parsing (P2)

**Goal**: Support compound expressions (e.g., `2d6+1d4+3`)

**Tasks**:

1. Extend `DiceParser` regex to handle multiple dice groups and modifiers
2. Update `DiceService` to process all groups
3. Update tests to cover compound expressions

**Test Command**:

```bash
npm test -- dice-parser.test.ts -t "compound"
```

**API Test**:

```bash
curl -X POST http://localhost:3000/api/dice/roll \
  -H "Content-Type: application/json" \
  -d '{"expression": "2d6+1d4+3"}'

# Expected: Multiple results array entries, correct total calculation
```

---

### Phase 3: Advantage/Disadvantage (P3)

**Goal**: Implement D&D 5e advantage/disadvantage mechanics

**Tasks**:

1. Add `advantageMode` parameter to service
2. Implement double-roll logic in `DiceRoller`
3. Implement higher/lower selection
4. Update tests for advantage/disadvantage scenarios

**Test Command**:

```bash
npm test -- dice-roller.test.ts -t "advantage"
npm test -- dice-roller.test.ts -t "disadvantage"
```

**API Test**:

```bash
curl -X POST http://localhost:3000/api/dice/roll \
  -H "Content-Type: application/json" \
  -d '{"expression": "1d20", "advantageMode": "advantage"}'

# Expected: Primary result + alternateRoll in response
```

---

## 3. Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test tests/unit/

# Run specific test file
npm test dice-parser.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode (re-run on file changes)
npm test -- --watch
```

### Integration Tests

```bash
# Run API integration tests
npm test tests/integration/

# Specific API test
npm test dice-api.test.ts
```

### Contract Tests

```bash
# Validate API responses match OpenAPI schema
npm test tests/contract/openapi-validation.test.ts
```

### Test Coverage Goals

- **Unit Tests**: 100% coverage for `lib/` (parser, roller)
- **Integration Tests**: Cover all user scenarios from spec.md
- **Contract Tests**: Validate all 200/400/500 responses

---

## 4. Development Workflow

### Start Development Server

```bash
# Development mode (auto-reload with nodemon)
npm run dev

# Production mode
npm start
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format code (optional: Prettier)
npm run format
```

### Building

```bash
# Compile TypeScript to JavaScript
npm run build

# Output in dist/ directory
```

---

## 5. API Testing

### Using curl

```bash
# Basic roll
curl -X POST http://localhost:3000/api/dice/roll \
  -H "Content-Type: application/json" \
  -d '{"expression": "2d6"}'

# With modifier
curl -X POST http://localhost:3000/api/dice/roll \
  -H "Content-Type: application/json" \
  -d '{"expression": "1d20+5"}'

# Compound expression
curl -X POST http://localhost:3000/api/dice/roll \
  -H "Content-Type: application/json" \
  -d '{"expression": "2d6+1d4+3"}'

# Advantage
curl -X POST http://localhost:3000/api/dice/roll \
  -H "Content-Type: application/json" \
  -d '{"expression": "1d20", "advantageMode": "advantage"}'

# Invalid notation (should return 400)
curl -X POST http://localhost:3000/api/dice/roll \
  -H "Content-Type: application/json" \
  -d '{"expression": "abc"}'
```

### Using Postman/Insomnia

Import OpenAPI spec from `specs/001-dice-engine/contracts/openapi.yaml` to generate request collection automatically.

### Using Swagger UI (optional)

```bash
# Install swagger-ui-express (optional dev dependency)
npm install --save-dev swagger-ui-express

# Add to app.ts:
# import swaggerUi from 'swagger-ui-express';
# import yaml from 'yamljs';
# const swaggerDocument = yaml.load('./specs/001-dice-engine/contracts/openapi.yaml');
# app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

# Access at http://localhost:3000/api-docs
```

---

## 6. Validation Checklist

Before marking feature complete, verify:

### Functional Requirements (from spec.md)

- [ ] **FR-001**: Parses NdX notation (N=1-1000, X=2-10000) ✓
- [ ] **FR-002**: Supports +/- modifiers ✓
- [ ] **FR-003**: Parses compound expressions ✓
- [ ] **FR-004**: Uses crypto.randomInt for RNG ✓
- [ ] **FR-005**: Returns individual rolls + total ✓
- [ ] **FR-006**: Advantage mode (roll twice, take higher) ✓
- [ ] **FR-007**: Disadvantage mode (roll twice, take lower) ✓
- [ ] **FR-008**: Validates input, returns descriptive errors ✓
- [ ] **FR-009**: Enforces limits (max 1000 dice, 10000 sides) ✓
- [ ] **FR-010**: Handles whitespace gracefully ✓
- [ ] **FR-011**: Case-insensitive (2d6 = 2D6) ✓
- [ ] **FR-012**: REST API endpoint ✓

### Success Criteria (from spec.md)

- [ ] **SC-001**: Parsing + rolling <50ms ✓
- [ ] **SC-002**: API response <200ms (p95) ✓
- [ ] **SC-003**: Uniform distribution (chi-squared test passes) ✓
- [ ] **SC-004**: All FR tests pass (100% success) ✓
- [ ] **SC-005**: Error messages are descriptive ✓
- [ ] **SC-006**: Advantage/disadvantage correct selection (100%) ✓
- [ ] **SC-007**: Handles max load (1000d10000) without crash ✓

### Constitution Compliance

- [ ] **RESTful Design**: POST /api/dice/roll, proper status codes ✓
- [ ] **Documentation**: OpenAPI 3.0.1 complete ✓
- [ ] **Testability**: Unit + integration + contract tests ✓
- [ ] **Simplicity**: No over-engineering ✓
- [ ] **Performance**: <200ms response time ✓

---

## 7. Common Issues & Solutions

### Issue: `crypto.randomInt` not found

**Solution**: Ensure Node.js version is 18+. `crypto.randomInt` was added in Node.js 14.10.0.

```bash
node --version  # Should be ≥18.0.0
```

### Issue: Prisma errors even though not using database

**Solution**: Run `npx prisma generate` to create Prisma client stub. This is required even if not connecting to database.

```bash
npx prisma generate
```

### Issue: Jest tests fail with TypeScript errors

**Solution**: Ensure `ts-jest` is configured in `jest.config.js`:

```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
};
```

### Issue: API returns 404 for `/api/dice/roll`

**Solution**: Verify route is registered in `app.ts`:

```typescript
import diceRouter from "./controllers/dice.controller";
app.use("/api/dice", diceRouter);
```

---

## 8. Next Steps

After completing all phases (P1 → P2 → P3):

1. **Generate Task Breakdown**: Run `/speckit.tasks` to create detailed task list
2. **Create Pull Request**: Merge feature branch to main
3. **Deploy**: Containerize with Docker, deploy to Azure
4. **Monitor**: Track performance metrics (response time, error rate)

---

## 9. Additional Resources

- **OpenAPI Spec**: `specs/001-dice-engine/contracts/openapi.yaml`
- **Data Model**: `specs/001-dice-engine/data-model.md`
- **Research**: `specs/001-dice-engine/research.md`
- **Implementation Plan**: `specs/001-dice-engine/plan.md`
- **Feature Spec**: `specs/001-dice-engine/spec.md`

---

**Questions or Issues?** Refer to `research.md` for technical decisions or consult project constitution (`.specify/memory/constitution.md`) for architectural guidance.
