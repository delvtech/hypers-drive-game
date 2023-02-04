import { MAX_LIQUIDITY, MIN_LIQUIDITY } from "../GameStorage";
import { Game } from "../game";
import { scale } from "../utils";
import { Bar } from "./Bar";

export type TradeType = "SHORT" | "LONG";

export class Trades {
  private game: Game;
  // the y position of the last gap's center
  private gapYPos: number;

  constructor(game: Game) {
    this.game = game;
    this.gapYPos = game.k.height() / 2;
  }

  public add(amount: number, type: TradeType, deviation?: number) {
    const { k } = this.game;

    // derive a gap width from liquidity
    const gap = scale(
      this.game.storage.liquidity,
      MIN_LIQUIDITY,
      MAX_LIQUIDITY,
      this.game.settings.MIN_GAP,
      this.game.settings.MAX_GAP
    );

    // derive a gap movement from the amount
    const gapYPosMovement = scale(
      amount,
      0,
      this.game.storage.liquidity,
      0,
      deviation ?? (k.height() - gap - 20) / 2
    );

    if (type === "LONG") {
      this.gapYPos = Math.min(
        k.height() - 10 - gap / 2,
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
      k: k,
      settings: this.game.settings,
      position: "top",
      size: topBarHeight,
      color: barColor,
    });
    Bar({
      k: k,
      settings: this.game.settings,
      position: "bottom",
      size: Math.max(10, k.height() - topBarHeight - gap),
      color: barColor,
    });
  }
}
