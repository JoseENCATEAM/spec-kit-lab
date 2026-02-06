# Data Model: Dice Rolling Engine

**Feature**: Dice Rolling Engine  
**Branch**: `001-dice-engine`  
**Date**: 2026-02-06

## Purpose

This document defines the data entities used in the dice rolling engine. These models represent the structure of data flowing through the system, from parsed dice expressions to completed roll results. All entities are designed to be serializable to JSON for API responses.

---

## Entity Definitions

### 1. DiceExpression

**Description**: Represents a parsed dice notation before rolling. This is the output of the parser component and input to the roller component.

**Purpose**: Encapsulates the structured representation of a dice expression after regex parsing, enabling validation and manipulation before rolling.

**Attributes**:

| Attribute          | Type          | Required | Description                                                                  |
| ------------------ | ------------- | -------- | ---------------------------------------------------------------------------- |
| `original`         | `string`      | Yes      | The original unparsed dice notation (e.g., "2d6+1d4+3")                      |
| `diceGroups`       | `DiceGroup[]` | Yes      | Array of parsed dice groups (e.g., [{count:2, sides:6}, {count:1, sides:4}]) |
| `modifiers`        | `Modifier[]`  | Yes      | Array of arithmetic modifiers (e.g., [{operator:'+', value:3}])              |
| `isValid`          | `boolean`     | Yes      | Whether the expression passed validation rules                               |
| `validationErrors` | `string[]`    | No       | Array of validation error messages (empty if valid)                          |

**TypeScript Definition**:

```typescript
interface DiceGroup {
  count: number; // Number of dice (1-1000 per FR-009)
  sides: number; // Number of sides per die (2-10000 per FR-009)
}

interface Modifier {
  operator: "+" | "-"; // Arithmetic operator
  value: number; // Modifier value (can be large, e.g., +999999)
}

interface DiceExpression {
  original: string;
  diceGroups: DiceGroup[];
  modifiers: Modifier[];
  isValid: boolean;
  validationErrors?: string[];
}
```

**Validation Rules**:

- Each `diceGroups[].count` MUST be between 1 and 1000 (FR-009)
- Each `diceGroups[].sides` MUST be between 2 and 10000 (FR-009)
- Total number of dice across all groups MUST NOT exceed 1000
- Expression MUST contain at least one dice group (e.g., "2d6")
- Modifiers are optional but must have valid operator and numeric value

**Example**:

```json
{
  "original": "2d6+1d4+3",
  "diceGroups": [
    { "count": 2, "sides": 6 },
    { "count": 1, "sides": 4 }
  ],
  "modifiers": [{ "operator": "+", "value": 3 }],
  "isValid": true
}
```

---

### 2. RollResult

**Description**: Represents the results from rolling a single dice group (e.g., "2d6" produces an array of 2 values).

**Purpose**: Provides detailed breakdown of individual die rolls within a dice group, enabling transparency and verification.

**Attributes**:

| Attribute  | Type       | Required | Description                                           |
| ---------- | ---------- | -------- | ----------------------------------------------------- |
| `notation` | `string`   | Yes      | The dice notation for this group (e.g., "2d6")        |
| `rolls`    | `number[]` | Yes      | Array of individual die values (e.g., [4, 5] for 2d6) |
| `subtotal` | `number`   | Yes      | Sum of all rolls in this group (e.g., 9 for [4,5])    |

**TypeScript Definition**:

```typescript
interface RollResult {
  notation: string; // e.g., "2d6", "1d20"
  rolls: number[]; // Individual die results
  subtotal: number; // Sum of rolls
}
```

**Invariants**:

- `rolls.length` MUST equal the dice count from the parsed expression
- Each value in `rolls` MUST be between 1 and the number of sides (inclusive)
- `subtotal` MUST equal the sum of all values in `rolls`

**Example**:

```json
{
  "notation": "2d6",
  "rolls": [4, 5],
  "subtotal": 9
}
```

---

### 3. DiceRoll

**Description**: Represents a completed dice roll operation, including all dice groups, modifiers, and the final total. This is the top-level response entity returned by the API.

**Purpose**: Encapsulates the complete result of a dice roll request, providing full transparency into how the total was calculated.

**Attributes**:

| Attribute       | Type            | Required | Description                                                         |
| --------------- | --------------- | -------- | ------------------------------------------------------------------- |
| `expression`    | `string`        | Yes      | The original dice expression (e.g., "2d6+1d4+3")                    |
| `results`       | `RollResult[]`  | Yes      | Array of results for each dice group                                |
| `modifiers`     | `Modifier[]`    | Yes      | Array of applied modifiers (from DiceExpression)                    |
| `total`         | `number`        | Yes      | Final calculated total (sum of all subtotals + modifiers)           |
| `advantageMode` | `AdvantageMode` | Yes      | Whether advantage/disadvantage was applied                          |
| `alternateRoll` | `DiceRoll`      | No       | If advantage/disadvantage, the alternate roll that was NOT selected |
| `timestamp`     | `string`        | Yes      | ISO 8601 timestamp of when roll was executed (for debugging)        |

**TypeScript Definition**:

```typescript
enum AdvantageMode {
  NONE = "none",
  ADVANTAGE = "advantage",
  DISADVANTAGE = "disadvantage",
}

interface DiceRoll {
  expression: string;
  results: RollResult[];
  modifiers: Modifier[];
  total: number;
  advantageMode: AdvantageMode;
  alternateRoll?: DiceRoll; // Only present if advantage/disadvantage
  timestamp: string; // ISO 8601 format
}
```

**Calculation Logic**:

```
total = (sum of all results[].subtotal) + (sum of all modifiers with operators applied)

Example: "2d6+1d4+3"
- results[0].subtotal = 9 (from [4,5])
- results[1].subtotal = 3 (from [3])
- modifiers[0] = +3
- total = 9 + 3 + 3 = 15
```

**Advantage/Disadvantage Behavior**:

- When `advantageMode` is `ADVANTAGE` or `DISADVANTAGE`, the system rolls the expression twice
- Both rolls are calculated independently with different random values
- The roll with the higher (advantage) or lower (disadvantage) total is selected as the primary result
- The non-selected roll is stored in `alternateRoll` for transparency
- Modifiers are applied AFTER selecting the roll (not before comparison)

**Example (Basic Roll)**:

```json
{
  "expression": "2d6+1d4+3",
  "results": [
    { "notation": "2d6", "rolls": [4, 5], "subtotal": 9 },
    { "notation": "1d4", "rolls": [3], "subtotal": 3 }
  ],
  "modifiers": [{ "operator": "+", "value": 3 }],
  "total": 15,
  "advantageMode": "none",
  "timestamp": "2026-02-06T12:34:56.789Z"
}
```

**Example (Advantage Roll)**:

```json
{
  "expression": "1d20",
  "results": [{ "notation": "1d20", "rolls": [15], "subtotal": 15 }],
  "modifiers": [],
  "total": 15,
  "advantageMode": "advantage",
  "alternateRoll": {
    "expression": "1d20",
    "results": [{ "notation": "1d20", "rolls": [8], "subtotal": 8 }],
    "modifiers": [],
    "total": 8,
    "advantageMode": "advantage",
    "timestamp": "2026-02-06T12:34:56.789Z"
  },
  "timestamp": "2026-02-06T12:34:56.789Z"
}
```

---

## Entity Relationships

```
DiceExpression (parser output)
    ↓
[DiceRoller processes expression]
    ↓
RollResult[] (one per dice group)
    ↓
DiceRoll (aggregated result with total)
```

**Flow**:

1. **Parse**: `string` → `DiceExpression` (validates notation)
2. **Roll**: `DiceExpression` → `RollResult[]` (executes rolls using crypto RNG)
3. **Aggregate**: `RollResult[] + Modifiers` → `DiceRoll` (calculates total)
4. **Return**: `DiceRoll` serialized to JSON for API response

---

## Persistence (Future)

**Current MVP**: All entities are **ephemeral** (computed per request, not stored).

**Future Enhancement**: If roll history is required, the `DiceRoll` entity can be persisted to PostgreSQL via Prisma:

```prisma
model RollHistory {
  id          String   @id @default(uuid())
  expression  String
  result      Json     // Store full DiceRoll as JSON
  userId      String?  // Optional: associate with user
  createdAt   DateTime @default(now())

  @@index([userId, createdAt])  // Query user's roll history
}
```

This allows future features (e.g., "show my last 10 rolls") without changing the core data model.

---

## Validation Summary

| Entity             | Key Validations                                           |
| ------------------ | --------------------------------------------------------- |
| **DiceExpression** | Dice count ≤ 1000, sides ≤ 10000, at least one dice group |
| **RollResult**     | Roll values within [1, sides], subtotal equals sum        |
| **DiceRoll**       | Total matches calculation, timestamp is valid ISO 8601    |

---

**Next Phase**: Generate OpenAPI contract in `contracts/openapi.yaml` defining request/response schemas based on these entities.
