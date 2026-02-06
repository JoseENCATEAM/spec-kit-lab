import { ValidationError, DiceGroup } from "../types";

export interface DiceExpression {
  original: string;
  diceGroups: DiceGroup[];
  modifiers: number[];
  isValid: boolean;
  validationErrors: ValidationError[];
}

export class DiceExpressionModel implements DiceExpression {
  constructor(
    public original: string,
    public diceGroups: DiceGroup[] = [],
    public modifiers: number[] = [],
    public isValid: boolean = true,
    public validationErrors: ValidationError[] = [],
  ) {}

  static createInvalid(
    original: string,
    errors: ValidationError[],
  ): DiceExpressionModel {
    return new DiceExpressionModel(original, [], [], false, errors);
  }
}
