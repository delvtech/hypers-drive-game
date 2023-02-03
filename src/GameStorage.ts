export class GameStorage {
  public liquidity: number;
  public shortsValue: number;
  public longsValue: number;

  public score: number = 0;

  private MIN_LIQ = 50_000;

  constructor() {
    this.liquidity = 100_000;
    this.shortsValue = 0;
    this.longsValue = 0;
  }

  public addLiquidity(amount: number) {
    this.liquidity = this.liquidity + amount;
  }

  public removeLiquidity(amount: number) {
    const value = this.liquidity - amount;
    if (value < 0) {
      return this.MIN_LIQ;
    }
    this.liquidity = this.liquidity - amount;
  }
}
