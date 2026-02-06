import { AdvantageMode } from "../types";
import { RollResult } from "./roll-result.model";

export interface DiceRoll {
  expression: string;
  results: RollResult[];
  modifiers: number[];
  total: number;
  advantageMode: AdvantageMode;
  alternateRoll?: DiceRoll;
  timestamp: string;
}

export class DiceRollModel implements DiceRoll {
  constructor(
    public expression: string,
    public results: RollResult[],
    public modifiers: number[],
    public total: number,
    public advantageMode: AdvantageMode = AdvantageMode.NONE,
    public alternateRoll: DiceRoll | undefined = undefined,
    public timestamp: string = new Date().toISOString(),
  ) {}
}
