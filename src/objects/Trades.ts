import { KaboomCtx } from "kaboom";
import { GameStorage, MAX_LIQUIDITY, MIN_LIQUIDITY } from "../GameStorage";
import { scale } from "../utils";
import { Bar } from "./Bar";
import { Settings } from "../settings";

export type TradeType = "SHORT" | "LONG";

export class Trades {
  private k: KaboomCtx;
  private storage: GameStorage;
  private settings: Settings;
  private gameHeight: number;
  // the y position of the last gap's center
  private gapYPos: number;

  constructor(k: KaboomCtx, storage: GameStorage, settings: Settings) {
    this.k = k;
    this.storage = storage;
    this.settings = settings;
    this.gameHeight = k.height();
    this.gapYPos = this.gameHeight / 2;
  }

  public add(amount: number, type: TradeType, deviation?: number) {
    const { k, storage, settings, gameHeight } = this;

    // derive a gap width from liquidity
    const gap = scale(
      storage.liquidity,
      MIN_LIQUIDITY,
      MAX_LIQUIDITY,
      settings.MIN_GAP,
      settings.MAX_GAP
    );

    // derive a gap movement from the amount
    const gapYPosMovement = scale(
      amount,
      0,
      storage.liquidity,
      0,
      deviation ?? (gameHeight - gap - 20) / 2
    );

    if (type === "LONG") {
      this.gapYPos = Math.min(
        gameHeight - 10 - gap / 2,
        this.gapYPos + gapYPosMovement
      );
    } else {
      this.gapYPos = Math.max(gap / 2 + 10, this.gapYPos - gapYPosMovement);
    }

    const topBarHeight = Math.max(10, this.gapYPos - gap / 2);

    // Make the bars red for longs and green for shorts
    const barColor = type === "LONG" ? [255, 0, 0] : [0, 255, 0];

    // add the bars to the game
    Bar({
      k,
      settings,
      position: "top",
      size: topBarHeight,
      color: barColor,
    });
    Bar({
      k,
      settings,
      position: "bottom",
      size: Math.max(10, gameHeight - topBarHeight - gap),
      color: barColor,
    });
  }
}
