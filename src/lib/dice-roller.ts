import { randomInt } from "crypto";
import { DiceGroup } from "../types";
import { RollResultModel } from "../models/roll-result.model";

export class DiceRoller {
  static rollDiceGroup(diceGroup: DiceGroup): RollResultModel {
    const { count, sides } = diceGroup;
    const rolls: number[] = [];

    for (let i = 0; i < count; i++) {
      // crypto.randomInt(min, max) returns [min, max)
      // We want [1, sides] inclusive
      const roll = randomInt(1, sides + 1);
      rolls.push(roll);
    }

    const subtotal = rolls.reduce((sum, roll) => sum + roll, 0);
    const notation = `${count}d${sides}`;

    return new RollResultModel(notation, rolls, subtotal);
  }

  static rollWithAdvantage(diceGroup: DiceGroup): {
    primary: RollResultModel;
    alternate: RollResultModel;
  } {
    const primary = this.rollDiceGroup(diceGroup);
    const alternate = this.rollDiceGroup(diceGroup);

    return { primary, alternate };
  }
}
