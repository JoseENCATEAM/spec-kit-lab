import { DiceExpressionModel } from "../models/dice-expression.model";
import { ValidationError, DiceGroup } from "../types";
import { ResourceLimitError } from "../middleware/error-handler";

const MAX_DICE = 1000;
const MAX_SIDES = 10000;

export class DiceParser {
  private static readonly DICE_PATTERN =
    /(?<count>\d+)d(?<sides>\d+)|(?<modifier>[+-]\d+)/gi;

  static parse(expression: string): DiceExpressionModel {
    const trimmed = expression.trim().toLowerCase();

    if (!trimmed) {
      return DiceExpressionModel.createInvalid(expression, [
        {
          field: "expression",
          message: "Expression cannot be empty",
        },
      ]);
    }

    const diceGroups: DiceGroup[] = [];
    const modifiers: number[] = [];
    const validationErrors: ValidationError[] = [];

    let match: RegExpExecArray | null;
    let hasValidTokens = false;

    // Reset lastIndex for global regex
    this.DICE_PATTERN.lastIndex = 0;

    while ((match = this.DICE_PATTERN.exec(trimmed)) !== null) {
      hasValidTokens = true;

      if (match.groups?.count && match.groups?.sides) {
        // Dice notation (e.g., 2d6)
        const count = parseInt(match.groups.count, 10);
        const sides = parseInt(match.groups.sides, 10);

        if (count <= 0) {
          validationErrors.push({
            field: "count",
            message: `Invalid dice count: ${count}. Must be positive.`,
          });
        }

        if (sides <= 0) {
          validationErrors.push({
            field: "sides",
            message: `Invalid die sides: ${sides}. Must be positive.`,
          });
        }

        if (count > MAX_DICE) {
          throw new ResourceLimitError(
            `Dice count exceeds maximum of ${MAX_DICE}`,
          );
        }

        if (sides > MAX_SIDES) {
          throw new ResourceLimitError(
            `Die sides exceed maximum of ${MAX_SIDES}`,
          );
        }

        if (count > 0 && sides > 0) {
          diceGroups.push({ count, sides });
        }
      } else if (match.groups?.modifier) {
        // Modifier (e.g., +3, -2)
        const modifier = parseInt(match.groups.modifier, 10);
        modifiers.push(modifier);
      }
    }

    if (!hasValidTokens) {
      return DiceExpressionModel.createInvalid(expression, [
        {
          field: "expression",
          message: "Invalid dice notation format",
        },
      ]);
    }

    if (diceGroups.length === 0) {
      validationErrors.push({
        field: "expression",
        message: "Expression must contain at least one dice group (e.g., 1d6)",
      });
    }

    const isValid = validationErrors.length === 0;

    if (!isValid) {
      return DiceExpressionModel.createInvalid(expression, validationErrors);
    }

    return new DiceExpressionModel(expression, diceGroups, modifiers, true, []);
  }
}
