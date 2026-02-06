---
description: "Task list for Dice Rolling Engine implementation"
---

# Tasks: Dice Rolling Engine

**Input**: Design documents from `/specs/001-dice-engine/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: According to the project constitution (`.specify/memory/constitution.md`), Testability is a core principle. All features MUST have unit tests. Tests should be written BEFORE implementation (test-first approach).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `src/`, `tests/` at repository root
- Paths shown below assume web application structure per plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project directory structure per plan.md (src/, tests/, prisma/)
- [ ] T002 Initialize Node.js project with package.json (TypeScript, Express, Jest, Prisma dependencies)
- [ ] T003 [P] Configure TypeScript compiler with tsconfig.json (target ES2022, strict mode)
- [ ] T004 [P] Configure Jest with jest.config.js (ts-jest preset, testMatch for .test.ts files)
- [ ] T005 [P] Configure ESLint with .eslintrc.js (@typescript-eslint rules)
- [ ] T006 [P] Create .env.example with environment variable templates
- [ ] T007 [P] Create Dockerfile for containerization
- [ ] T008 Setup Prisma with prisma/schema.prisma (PostgreSQL datasource, empty schema for future use)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T009 Create TypeScript type definitions in src/types/index.ts (AdvantageMode enum, base types)
- [ ] T010 [P] Create Express app setup in src/app.ts (middleware chain, JSON parsing, CORS if needed)
- [ ] T011 [P] Create HTTP server entry point in src/server.ts (port binding, graceful shutdown)
- [ ] T012 [P] Implement global error handler middleware in src/middleware/error-handler.ts
- [ ] T013 [P] Implement request logger middleware in src/middleware/request-logger.ts
- [ ] T014 Create TypeScript model interfaces in src/models/dice-expression.model.ts (DiceExpression, DiceGroup, Modifier)
- [ ] T015 [P] Create TypeScript model interfaces in src/models/roll-result.model.ts (RollResult)
- [ ] T016 [P] Create TypeScript model interfaces in src/models/dice-roll.model.ts (DiceRoll)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Basic Dice Rolling (Priority: P1) 🎯 MVP

**Goal**: Parse and roll simple dice notation (NdX, NdX+M) and return results via REST API

**Independent Test**: Submit "2d6" via API, verify 2 results (each 1-6), total is sum (2-12), multiple rolls produce different results

### Tests for User Story 1 (BEFORE implementation per constitution)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T017 [P] [US1] Contract test for POST /api/dice/roll endpoint in tests/contract/openapi-validation.test.ts (validate response matches OpenAPI schema)
- [ ] T018 [P] [US1] Unit test for DiceParser.parse() in tests/unit/dice-parser.test.ts (test cases: "2d6", "1d20+5", "3d8-2", invalid inputs)
- [ ] T019 [P] [US1] Unit test for DiceRoller.roll() in tests/unit/dice-roller.test.ts (mock crypto.randomInt, verify roll counts and ranges)
- [ ] T020 [P] [US1] Unit test for DiceService.rollDice() in tests/unit/dice-service.test.ts (end-to-end flow: parse → roll → format)
- [ ] T021 [P] [US1] Integration test for API endpoint in tests/integration/dice-api.test.ts (supertest: POST /api/dice/roll with "2d6")

### Implementation for User Story 1

- [ ] T022 [P] [US1] Implement DiceParser class in src/lib/dice-parser.ts (regex: /(?<count>\d+)d(?<sides>\d+)|(?<modifier>[+-]\d+)/gi, validation per FR-009)
- [ ] T023 [P] [US1] Implement DiceRoller class in src/lib/dice-roller.ts (use crypto.randomInt for secure RNG per FR-004)
- [ ] T024 [US1] Implement DiceService class in src/services/dice.service.ts (orchestrate: parse → validate → roll → format results, handle errors)
- [ ] T025 [US1] Implement input validation schemas in src/lib/validators.ts (express-validator: check expression format, length limits)
- [ ] T026 [US1] Implement DiceController with POST /api/dice/roll route in src/controllers/dice.controller.ts (Express router, call DiceService, handle responses)
- [ ] T027 [US1] Register dice routes in src/app.ts (app.use('/api/dice', diceRouter))
- [ ] T028 [US1] Add descriptive error messages for validation failures (FR-008: invalid notation, resource limits)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. API accepts "2d6", "1d20+5", "3d8-2" and returns correct results.

---

## Phase 4: User Story 2 - Complex Expression Parsing (Priority: P2)

**Goal**: Support compound expressions with multiple dice groups (e.g., "2d6+1d4+3")

**Independent Test**: Submit "2d6+1d4+3" via API, verify multiple result entries (2d6 and 1d4), each with individual rolls, modifiers applied, correct total

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T029 [P] [US2] Unit test for DiceParser with compound expressions in tests/unit/dice-parser.test.ts (test cases: "2d6+1d4+3", "1d20+2d6-4", "2d6 + 1d4" with spaces)
- [ ] T030 [P] [US2] Unit test for DiceService with multiple dice groups in tests/unit/dice-service.test.ts (verify each group rolled separately, totals aggregated)
- [ ] T031 [P] [US2] Integration test for compound expressions in tests/integration/dice-api.test.ts (POST with "2d6+1d4+3", verify response structure)

### Implementation for User Story 2

- [ ] T032 [P] [US2] Extend DiceParser.parse() to handle multiple dice groups in src/lib/dice-parser.ts (use String.matchAll() for all matches, support multiple NdX patterns)
- [ ] T033 [P] [US2] Extend DiceParser to handle multiple modifiers in src/lib/dice-parser.ts (parse all +/- tokens, accumulate in modifiers array)
- [ ] T034 [US2] Update DiceService to process all dice groups in src/services/dice.service.ts (iterate over diceGroups, call roller for each, aggregate results)
- [ ] T035 [US2] Update DiceService to apply all modifiers to final total in src/services/dice.service.ts (sum all modifiers with operators, add to dice totals)
- [ ] T036 [US2] Add whitespace handling in DiceParser in src/lib/dice-parser.ts (normalize input: trim(), replace /\s+/g with '', case-insensitive per FR-010, FR-011)

**Checkpoint**: At this point, User Stories 1 AND 2 both work independently. API handles both simple ("2d6") and compound ("2d6+1d4+3") expressions.

---

## Phase 5: User Story 3 - Advantage/Disadvantage Mechanics (Priority: P3)

**Goal**: Implement D&D 5e advantage/disadvantage (roll twice, take higher/lower)

**Independent Test**: Submit "1d20" with advantageMode="advantage", verify two roll results returned, higher selected as total, alternateRoll present in response

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T037 [P] [US3] Unit test for DiceRoller with advantage mode in tests/unit/dice-roller.test.ts (mock two roll sequences, verify higher selected)
- [ ] T038 [P] [US3] Unit test for DiceRoller with disadvantage mode in tests/unit/dice-roller.test.ts (mock two roll sequences, verify lower selected)
- [ ] T039 [P] [US3] Unit test for DiceService with advantage/disadvantage in tests/unit/dice-service.test.ts (verify alternateRoll populated, correct selection logic)
- [ ] T040 [P] [US3] Integration test for advantage mechanics in tests/integration/dice-api.test.ts (POST with advantageMode="advantage", verify response structure)
- [ ] T041 [P] [US3] Integration test for disadvantage mechanics in tests/integration/dice-api.test.ts (POST with advantageMode="disadvantage", verify response structure)

### Implementation for User Story 3

- [ ] T042 [P] [US3] Add advantageMode parameter to DiceService.rollDice() in src/services/dice.service.ts (accept 'none' | 'advantage' | 'disadvantage')
- [ ] T043 [US3] Implement double-roll logic in DiceService in src/services/dice.service.ts (if advantage/disadvantage: roll expression twice with different RNG seeds)
- [ ] T044 [US3] Implement higher/lower selection in DiceService in src/services/dice.service.ts (compare totals, select primary result, store alternate in alternateRoll field)
- [ ] T045 [US3] Update DiceController to accept advantageMode parameter in src/controllers/dice.controller.ts (add to request validation, pass to service)
- [ ] T046 [US3] Update input validators for advantageMode in src/lib/validators.ts (enum validation: must be 'none', 'advantage', or 'disadvantage', default to 'none')
- [ ] T047 [US3] Add tests for edge case: advantage on compound expressions in tests/unit/dice-service.test.ts (e.g., "2d6+1d4+3" with advantage rolls entire expression twice)

**Checkpoint**: All user stories are now independently functional. API supports simple rolls, compound expressions, and advantage/disadvantage mechanics.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T048 [P] Add health check endpoint GET /api/health in src/controllers/health.controller.ts (return {status: 'ok', timestamp})
- [ ] T049 [P] Add statistical distribution test in tests/unit/dice-roller.test.ts (chi-squared test: roll 10,000 d6, verify p-value > 0.01 per SC-003)
- [ ] T050 [P] Add performance benchmarks in tests/unit/dice-service.test.ts (measure parsing + rolling time, assert <50ms per SC-001)
- [ ] T051 [P] Add load test for max dice constraint in tests/integration/dice-api.test.ts (test 1000d10000 expression, verify no crash per SC-007)
- [ ] T052 [P] Document API with OpenAPI comments in src/controllers/dice.controller.ts (JSDoc annotations for auto-generated docs)
- [ ] T053 [P] Add integration test for all error scenarios in tests/integration/dice-api.test.ts (invalid notation, resource limits, verify 400 responses)
- [ ] T054 Run quickstart.md validation checklist (verify all FR-001 to FR-012 and SC-001 to SC-007)
- [ ] T055 Generate test coverage report (run `npm test -- --coverage`, verify 100% for src/lib/, >90% for src/services/)
- [ ] T056 [P] Update README.md with API usage examples and quickstart instructions
- [ ] T057 [P] Create API documentation site with Swagger UI (optional: serve /api-docs endpoint)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories ✅ **INDEPENDENT**
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Extends US1 parser but independently testable ✅ **INDEPENDENT**
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Reuses US1/US2 logic but independently testable ✅ **INDEPENDENT**

### Within Each User Story

- **Tests MUST be written FIRST** (per constitution principle III: Testability)
- Tests MUST fail initially (red phase of TDD)
- Implementation follows after tests are approved
- Tests MUST pass before story is considered complete (green phase)
- Within a story: Tests (parallel) → Implementation → Validation

### Parallel Opportunities

#### Phase 1: Setup (can run in parallel)

- T003 (tsconfig.json) + T004 (jest.config.js) + T005 (.eslintrc.js) + T006 (.env.example) + T007 (Dockerfile)

#### Phase 2: Foundational (can run in parallel after T009)

- T010 (app.ts) + T011 (server.ts) + T012 (error-handler) + T013 (request-logger)
- T015 (roll-result.model.ts) + T016 (dice-roll.model.ts) [after T014]

#### Phase 3: User Story 1 Tests (can run in parallel)

- T017 (contract test) + T018 (parser test) + T019 (roller test) + T020 (service test) + T021 (API test)

#### Phase 3: User Story 1 Implementation (can run in parallel after tests)

- T022 (dice-parser.ts) + T023 (dice-roller.ts) [these are independent]
- After T022, T023: T025 (validators.ts) [parallel with T024]

#### Phase 4: User Story 2 Tests (can run in parallel)

- T029 (parser test) + T030 (service test) + T031 (API test)

#### Phase 4: User Story 2 Implementation (can run in parallel)

- T032 (multi-group parsing) + T033 (multi-modifier parsing) [both extend dice-parser.ts]

#### Phase 5: User Story 3 Tests (can run in parallel)

- T037 + T038 + T039 + T040 + T041 (all test files are independent)

#### Phase 5: User Story 3 Implementation (can run in parallel after T042)

- T045 (controller update) + T046 (validator update) [parallel with T043, T044]

#### Phase 6: Polish (most tasks can run in parallel)

- T048 + T049 + T050 + T051 + T052 + T053 + T056 + T057

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (write tests FIRST):
Task T017: Contract test for POST /api/dice/roll in tests/contract/openapi-validation.test.ts
Task T018: Parser unit test in tests/unit/dice-parser.test.ts
Task T019: Roller unit test in tests/unit/dice-roller.test.ts
Task T020: Service unit test in tests/unit/dice-service.test.ts
Task T021: API integration test in tests/integration/dice-api.test.ts

# After tests written and failing, launch independent implementations together:
Task T022: Implement DiceParser in src/lib/dice-parser.ts
Task T023: Implement DiceRoller in src/lib/dice-roller.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T008)
2. Complete Phase 2: Foundational (T009-T016) - CRITICAL: blocks all stories
3. Complete Phase 3: User Story 1 (T017-T028)
4. **STOP and VALIDATE**: Run all US1 tests, verify all pass
5. Deploy/demo if ready (basic dice rolling works!)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo ✅ **MVP!**
3. Add User Story 2 → Test independently → Deploy/Demo ✅ **Compound expressions**
4. Add User Story 3 → Test independently → Deploy/Demo ✅ **Advantage/disadvantage**
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done (after T016):
   - **Developer A**: User Story 1 (T017-T028)
   - **Developer B**: User Story 2 (T029-T036) - can start writing tests while Dev A implements US1
   - **Developer C**: User Story 3 (T037-T047) - can start writing tests while Dev A/B implement
3. Stories complete and integrate independently

---

## Notes

- **[P] tasks** = different files, no dependencies, safe to parallelize
- **[Story] label** maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **TEST-FIRST**: Write tests (T017-T021) BEFORE implementation (T022-T028) per constitution
- Verify tests fail (red) before implementing
- Verify tests pass (green) after implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Task Count Summary

- **Total Tasks**: 57
- **Phase 1 (Setup)**: 8 tasks
- **Phase 2 (Foundational)**: 8 tasks (BLOCKS all user stories)
- **Phase 3 (User Story 1 - P1)**: 12 tasks (5 tests + 7 implementation)
- **Phase 4 (User Story 2 - P2)**: 8 tasks (3 tests + 5 implementation)
- **Phase 5 (User Story 3 - P3)**: 12 tasks (5 tests + 7 implementation)
- **Phase 6 (Polish)**: 10 tasks

**Parallel Opportunities**: ~35 tasks marked [P] can run in parallel within their phases

**MVP Scope** (Setup + Foundational + US1): 28 tasks → deliverable basic dice rolling API

**Full Feature Scope** (all 3 user stories + polish): 57 tasks → complete dice engine with all features
