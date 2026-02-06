import { DiceParser } from "../lib/dice-parser";
import { DiceRoller } from "../lib/dice-roller";
import { DiceRollModel } from "../models/dice-roll.model";
import { AdvantageMode } from "../types";
import { ValidationError as AppValidationError } from "../middleware/error-handler";

export class DiceService {
  roll(
    expression: string,
    advantageMode: AdvantageMode = AdvantageMode.NONE,
  ): DiceRollModel {
    // Parse the expression
    const parsed = DiceParser.parse(expression);

    if (!parsed.isValid) {
      const errorMessages = parsed.validationErrors
        .map((e) => e.message)
        .join("; ");
      throw new AppValidationError(errorMessages);
    }

    // Handle advantage/disadvantage
    if (advantageMode !== AdvantageMode.NONE) {
      if (parsed.diceGroups.length !== 1) {
        throw new AppValidationError(
          "Advantage/disadvantage only supports single dice group (e.g., 1d20)",
        );
      }

      const diceGroup = parsed.diceGroups[0];
      const { primary, alternate } = DiceRoller.rollWithAdvantage(diceGroup);

      const primaryTotal =
        primary.subtotal + parsed.modifiers.reduce((sum, mod) => sum + mod, 0);
      const alternateTotal =
        alternate.subtotal +
        parsed.modifiers.reduce((sum, mod) => sum + mod, 0);

      let mainRoll: DiceRollModel;
      let altRoll: DiceRollModel;

      if (advantageMode === AdvantageMode.ADVANTAGE) {
        if (primaryTotal >= alternateTotal) {
          mainRoll = new DiceRollModel(
            expression,
            [primary],
            parsed.modifiers,
            primaryTotal,
            advantageMode,
          );
          altRoll = new DiceRollModel(
            expression,
            [alternate],
            parsed.modifiers,
            alternateTotal,
            advantageMode,
          );
        } else {
          mainRoll = new DiceRollModel(
            expression,
            [alternate],
            parsed.modifiers,
            alternateTotal,
            advantageMode,
          );
          altRoll = new DiceRollModel(
            expression,
            [primary],
            parsed.modifiers,
            primaryTotal,
            advantageMode,
          );
        }
      } else {
        // DISADVANTAGE
        if (primaryTotal <= alternateTotal) {
          mainRoll = new DiceRollModel(
            expression,
            [primary],
            parsed.modifiers,
            primaryTotal,
            advantageMode,
          );
          altRoll = new DiceRollModel(
            expression,
            [alternate],
            parsed.modifiers,
            alternateTotal,
            advantageMode,
          );
        } else {
          mainRoll = new DiceRollModel(
            expression,
            [alternate],
            parsed.modifiers,
            alternateTotal,
            advantageMode,
          );
          altRoll = new DiceRollModel(
            expression,
            [primary],
            parsed.modifiers,
            primaryTotal,
            advantageMode,
          );
        }
      }

      mainRoll.alternateRoll = altRoll;
      return mainRoll;
    }

    // Normal roll (no advantage/disadvantage)
    const results = parsed.diceGroups.map((diceGroup) =>
      DiceRoller.rollDiceGroup(diceGroup),
    );

    const total =
      results.reduce((sum, result) => sum + result.subtotal, 0) +
      parsed.modifiers.reduce((sum, mod) => sum + mod, 0);

    return new DiceRollModel(
      expression,
      results,
      parsed.modifiers,
      total,
      advantageMode,
    );
  }
}
