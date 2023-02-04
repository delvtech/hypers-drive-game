export const MIN_LIQUIDITY = 50_000;
export const MAX_LIQUIDITY = 200_000;

export class GameStorage {
  public liquidity: number;
  public shortsVolume: number;
  public longsVolume: number;
  public totalVolume: number;
  public topSpeed: number;

  public score: number;

  constructor() {
    this.liquidity = 100_000;
    this.shortsVolume = 0;
    this.longsVolume = 0;
    this.totalVolume = 0;
    this.topSpeed = 0;
    this.score = 0;
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

  public addShort(amount: number) {
    this.shortsVolume += amount;
    this.totalVolume += amount;
  }

  public addLong(amount: number) {
    this.longsVolume += amount;
    this.totalVolume += amount;
  }

  public reset() {
    this.liquidity = 100_000;
    this.shortsVolume = 0;
    this.longsVolume = 0;
    this.totalVolume = 0;
    this.topSpeed = 0;
    this.score = 0;
  }
}
