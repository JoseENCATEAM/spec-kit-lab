// Type definitions for the dice rolling engine

export enum AdvantageMode {
  NONE = "none",
  ADVANTAGE = "advantage",
  DISADVANTAGE = "disadvantage",
}

export interface DiceGroup {
  count: number;
  sides: number;
}

export interface ValidationError {
  field: string;
  message: string;
}
