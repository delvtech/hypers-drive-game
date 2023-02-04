import { AnchorComp, GameObj, PosComp, ZComp } from "kaboom";
import { Game } from "../game";

export interface EventFeedOptions {
  /**
   * The max number of events to show in the log at once.
   */
  max: number;

  /**
   * how many seconds until events automatically disappear.
   */
  ttl: number;
}

export class EventFeed {
  private game: Game;
  private max = 5;

  public container: GameObj<PosComp | AnchorComp | ZComp>;

  constructor(game: Game, options?: EventFeedOptions) {
    const { k } = game;
    const { max = 5 } = options || {};

    this.game = game;
    this.max = max;

    this.container = k.add([
      k.pos(20, k.height() - 20),
      k.anchor("botleft"),
      k.z(10),
    ]);
  }

  public add(label: string) {
    const { k } = this.game;

    // remove the oldest event from the feed if it's maxed out.
    if (this.container.children.length === this.max) {
      k.destroy(this.container.children[0]);
    }

    // shift existing events up on the canvas to make room for the new one.
    for (const existingEvent of this.container.children) {
      existingEvent.pos.y -= 20;
    }

    // add the new event
    const event = this.container.add([
      k.text(label, {
        size: 18,
      }),
      k.pos(0, 0),
      k.anchor("botleft"),
    ]);

    // automatically destroy the event after 5 seconds.
    k.wait(5, () => k.destroy(event));
  }

  public clear() {
    const { k } = this.game;

    for (const event of this.container.children) {
      k.destroy(event);
    }
  }
}
