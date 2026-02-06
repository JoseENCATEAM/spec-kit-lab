export interface RollResult {
  notation: string;
  rolls: number[];
  subtotal: number;
}

export class RollResultModel implements RollResult {
  constructor(
    public notation: string,
    public rolls: number[],
    public subtotal: number,
  ) {}
}
