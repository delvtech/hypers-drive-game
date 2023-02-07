import { AnchorComp, GameObj, KaboomCtx, PosComp, ZComp } from "kaboom";
import { Z } from "../game";
import { Settings } from "../settings";

export interface EventFeedOptions {
  /**
   * The max number of events to show in the log at once.
   */
  max?: number;

  /**
   * how many seconds until events automatically disappear.
   */
  ttl?: number;
}

export class EventFeed {
  private k: KaboomCtx;
  private settings: Settings;
  private ttl: number;
  private max?: number;

  public container: GameObj<PosComp | AnchorComp | ZComp>;

  constructor(k: KaboomCtx, settings: Settings, options?: EventFeedOptions) {
    this.k = k;
    this.settings = settings;
    this.ttl = options?.ttl ?? 4;
    this.max = options?.max;

    this.container = k.add([
      k.pos(20 * settings.SCALE, k.height() - 20 * settings.SCALE),
      k.anchor("botleft"),
      k.z(Z.hud),
    ]);
  }

  public add(label: string) {
    const k = this.k;

    // remove the oldest event from the feed if it's maxed out.
    if (this.container.children.length === this.max) {
      k.destroy(this.container.children[0]);
    }

    // shift existing events up on the canvas to make room for the new one.
    for (const existingEvent of this.container.children) {
      existingEvent.pos.y -= 20 * this.settings.SCALE;
    }

    // add the new event
    const event = this.container.add([
      k.text(label, {
        size: 18 * this.settings.SCALE,
      }),
      k.pos(0, 0),
      k.anchor("botleft"),
    ]);

    // automatically destroy the event after ttl.
    k.wait(this.ttl, () => event.destroy());
  }

  public clear() {
    const k = this.k;

    while (this.container.children.length) {
      k.destroy(this.container.children[0]);
    }
  }
}
