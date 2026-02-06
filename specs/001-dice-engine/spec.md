# Feature Specification: Dice Rolling Engine

**Feature Branch**: `001-dice-engine`  
**Created**: 2026-02-06  
**Status**: Draft  
**Input**: User description: "Build a dice rolling engine that supports: Standard dice notation (e.g., 2d6, 1d20+5, 3d8-2), Parsing expressions like 2d6+1d4+3, Return individual rolls and total, Support for advantage/disadvantage (roll twice, take higher/lower), Cryptographically secure random number generation"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Basic Dice Rolling (Priority: P1)

A game developer needs to roll dice using standard notation for core game mechanics like ability checks, damage rolls, and skill tests. The system must accept simple expressions like `2d6`, `1d20`, `3d8+2` and return both the individual die results and the total.

**Why this priority**: This is the minimum viable functionality—without basic dice rolling, nothing else works. It's the foundation for all other features and represents 80% of typical use cases in tabletop RPGs.

**Independent Test**: Can be fully tested by submitting dice notation strings via API and verifying that results are within valid ranges, totals are correct, and the same expression can be rolled multiple times with different results.

**Acceptance Scenarios**:

1. **Given** a dice expression "2d6", **When** the roll is executed, **Then** system returns 2 individual die results (each 1-6) and their sum (2-12)
2. **Given** a dice expression "1d20+5", **When** the roll is executed, **Then** system returns 1 die result (1-20) and total with modifier applied (6-25)
3. **Given** a dice expression "3d8-2", **When** the roll is executed, **Then** system returns 3 individual die results (each 1-8) and total with modifier subtracted (1-22)
4. **Given** an invalid expression "abc" or "2d", **When** parsing is attempted, **Then** system returns a clear validation error

---

### User Story 2 - Complex Expression Parsing (Priority: P2)

A game developer needs to combine multiple dice types in a single expression for complex mechanics like "fireball damage" (8d6) + "magic bonus" (1d4) + "static modifier" (+3). The system must parse and evaluate compound expressions like `2d6+1d4+3`.

**Why this priority**: Enables more sophisticated game mechanics without requiring multiple API calls. Common in advanced RPG scenarios but not essential for basic gameplay.

**Independent Test**: Can be tested by submitting multi-part expressions and verifying each component is rolled separately, totals are aggregated correctly, and the results break down each term.

**Acceptance Scenarios**:

1. **Given** expression "2d6+1d4+3", **When** rolled, **Then** system returns breakdown: 2d6 results (e.g., [4,5]=9), 1d4 results (e.g., [3]=3), modifier (+3), and total (15)
2. **Given** expression "1d20+2d6-4", **When** rolled, **Then** system correctly parses positive and negative modifiers and multiple dice groups
3. **Given** expression with spaces "2d6 + 1d4", **When** parsed, **Then** system handles whitespace gracefully

---

### User Story 3 - Advantage/Disadvantage Mechanics (Priority: P3)

A game developer implementing D&D 5th Edition rules needs advantage/disadvantage mechanics: roll the same dice expression twice and automatically take the higher (advantage) or lower (disadvantage) result.

**Why this priority**: Specific to certain game systems (D&D 5e, others). Adds polish and convenience but can be simulated with two separate API calls if needed.

**Independent Test**: Can be tested by rolling with advantage/disadvantage flags and verifying that two sets of rolls are returned and the correct result (higher/lower) is selected.

**Acceptance Scenarios**:

1. **Given** expression "1d20" with advantage=true, **When** rolled, **Then** system returns two d20 results (e.g., 8 and 15) and selects the higher (15) as the final result
2. **Given** expression "1d20+3" with disadvantage=true, **When** rolled, **Then** system rolls "1d20" twice, selects lower roll, then applies +3 modifier to that result
3. **Given** expression "2d6" with advantage=true, **When** rolled, **Then** system rolls "2d6" twice (e.g., [3,4]=7 and [5,2]=7) and selects higher total

---

### Edge Cases

- What happens when dice count or sides exceed reasonable limits (e.g., `10000d10000`)? System must enforce maximum constraints (e.g., max 1000 dice, max 10000 sides) and return validation error.
- How does system handle zero or negative dice counts (e.g., `0d6`, `-2d6`)? System must reject as invalid.
- What happens with dice with 0 or 1 sides (e.g., `2d0`, `5d1`)? System must handle 1-sided dice (always returns 1) and reject 0 or negative sides.
- How does system handle extremely large modifiers (e.g., `1d6+999999`)? System should apply modifiers without overflow errors (use appropriate integer types).
- What happens if advantage/disadvantage is applied to an already complex expression (e.g., `2d6+1d4+3` with advantage)? System rolls entire expression twice and compares totals.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST parse standard dice notation in the format `NdX` where N is the number of dice (1-1000) and X is the number of sides (2-10000)
- **FR-002**: System MUST support arithmetic modifiers (`+` and `-`) following dice expressions (e.g., `2d6+5`, `1d20-2`)
- **FR-003**: System MUST parse compound expressions containing multiple dice groups and modifiers (e.g., `2d6+1d4+3`)
- **FR-004**: System MUST use cryptographically secure random number generation for all die rolls to prevent predictability
- **FR-005**: System MUST return both individual die results and the calculated total for each roll
- **FR-006**: System MUST support advantage mode: roll expression twice and return the higher total
- **FR-007**: System MUST support disadvantage mode: roll expression twice and return the lower total
- **FR-008**: System MUST validate dice notation before rolling and return descriptive error messages for invalid input
- **FR-009**: System MUST enforce resource limits: maximum 1000 dice per expression, maximum 10000 sides per die
- **FR-010**: System MUST handle whitespace in expressions gracefully (ignore spaces between tokens)
- **FR-011**: System MUST treat dice notation as case-insensitive (accept both `2d6` and `2D6`)
- **FR-012**: System MUST provide a REST API endpoint for rolling dice that accepts notation as input and returns structured results

### Key Entities _(include if feature involves data)_

- **DiceRoll**: Represents a completed roll operation. Contains: original expression (string), parsed dice groups (array), individual results per die (array of arrays), modifiers applied (array), final total (integer), advantage/disadvantage mode (enum: none/advantage/disadvantage), timestamp (for logging/debugging).

- **DiceExpression**: Represents a parsed dice notation before rolling. Contains: dice groups (array of {count: N, sides: X}), modifiers (array of {operator: +/-, value: integer}), validation status (boolean), error messages (if validation failed).

- **RollResult**: Represents results from a single dice group. Contains: dice specification (NdX), individual die values (array of integers), subtotal (sum of dice before modifiers).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of valid standard dice notations (NdX, NdX+M, NdX-M) are successfully parsed and rolled within 50ms
- **SC-002**: API endpoint responds within 200ms for 95th percentile of requests (per constitution performance requirement)
- **SC-003**: Dice rolls produce statistically uniform distribution: chi-squared test on 10,000 d6 rolls shows p-value > 0.01 (no detectable bias)
- **SC-004**: All 12 functional requirements (FR-001 through FR-012) pass automated unit tests with 100% success rate
- **SC-005**: Invalid dice notation results in descriptive error messages that allow developers to correct input in one attempt (no ambiguous errors)
- **SC-006**: Advantage/disadvantage mechanics produce correct result selection (higher/lower) in 100% of test cases
- **SC-007**: System handles maximum load (1000 dice × 10000 sides expression) without crashes or errors

## Assumptions

### Design Assumptions

- **REST API**: The dice engine will be exposed as a RESTful API endpoint (POST /api/dice/roll) accepting JSON payloads with dice notation and optional advantage/disadvantage flags.
- **Stateless Operation**: Each dice roll is independent; no session state or roll history is maintained by default (users can log results client-side if needed).
- **Synchronous Processing**: Dice rolls are processed synchronously and return immediately (no queuing or async processing needed for this workload).
- **Single-Expression Scope**: Each API call processes one dice expression. Multiple different expressions require multiple API calls (simplifies parsing and error handling).

### Technical Assumptions

- **Random Number Generation**: Cryptographically secure RNG (e.g., crypto.getRandomValues in Node.js or RNGCryptoServiceProvider in C#) will be used despite performance trade-off because game integrity requires unpredictability.
- **Integer Arithmetic**: All dice results and totals use standard integers (32-bit or 64-bit) which are sufficient for reasonable dice constraints (1000d10000 max).
- **No Persistence**: Dice rolls are not stored in a database. The engine is a pure computation service.

### Business Assumptions

- **Target Users**: Game developers integrating dice mechanics into text adventure games, RPG platforms, or tabletop game simulators.
- **Usage Patterns**: Expected usage is moderate (hundreds of rolls per minute, not thousands per second), so optimizations for extreme throughput are not required initially.
- **Notation Standard**: Standard tabletop RPG notation (d20 System, D&D-style) is the target. Proprietary or niche notation variants are out of scope.

## Out of Scope

The following are explicitly NOT included in this feature:

- **Roll History**: No storage or retrieval of past rolls. Each roll is ephemeral.
- **User Accounts/Authentication**: Dice engine is publicly accessible or relies on API gateway authentication (not implemented here).
- **Advanced Notation**: Exploding dice, rerolls, keeping/dropping highest/lowest (e.g., 4d6 drop lowest) are not supported in MVP.
- **Dice Pools**: Systems like World of Darkness (count successes) or custom success/failure thresholds are not supported.
- **Statistical Analysis**: No built-in tools for analyzing roll probabilities or distributions (users can collect data externally).
- **Rate Limiting**: DoS protection and rate limiting are infrastructure concerns, not part of the dice engine itself.

---

**Next Steps**: Once this specification is approved, proceed to `/speckit.plan` to generate the implementation plan, research technical approaches, define API contracts (OpenAPI schema), and prepare for `/speckit.tasks` task breakdown.### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "Users can complete account creation in under 2 minutes"]
- **SC-002**: [Measurable metric, e.g., "System handles 1000 concurrent users without degradation"]
- **SC-003**: [User satisfaction metric, e.g., "90% of users successfully complete primary task on first attempt"]
- **SC-004**: [Business metric, e.g., "Reduce support tickets related to [X] by 50%"]
