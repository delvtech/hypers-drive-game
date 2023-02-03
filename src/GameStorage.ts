export const MIN_LIQUIDITY = 50_000;
export const MAX_LIQUIDITY = 200_000;

export class GameStorage {
  public liquidity: number;
  public shortsValue: number;
  public longsValue: number;

  public score: number = 0;

  constructor() {
    this.liquidity = 100_000;
    this.shortsValue = 0;
    this.longsValue = 0;
  }

  public addLiquidity(amount: number) {
    const value = this.liquidity + amount;
    if (value > MAX_LIQUIDITY) {
      this.liquidity = MAX_LIQUIDITY;
    } else {
      this.liquidity = this.liquidity + amount;
    }
  }

  public removeLiquidity(amount: number) {
    const value = this.liquidity - amount;
    if (value < MIN_LIQUIDITY) {
      this.liquidity = MIN_LIQUIDITY;
    } else {
      this.liquidity = this.liquidity - amount;
    }
  }
}
