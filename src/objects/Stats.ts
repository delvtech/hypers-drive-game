import {
  AnchorComp,
  GameObj,
  KaboomCtx,
  PosComp,
  TextComp,
  ZComp,
} from "kaboom";
import { commify } from "../utils";
import { Z } from "../game";

export type Stat<L extends string> = [L, string | number];

export interface StatsOptions {
  alignment?: "left" | "center" | "right";
  x?: number;
  y?: number;
}

export class Stats<L extends string = string> {
  public container: GameObj<PosComp | AnchorComp | ZComp>;
  private statsByLabel: Record<L, StatStorage>;

  constructor(k: KaboomCtx, stats: Stat<L>[], options?: StatsOptions) {
    let anchor: Parameters<typeof k.anchor>[0];

    switch (options?.alignment) {
      case "center":
        anchor = "top";
        break;

      case "right":
        anchor = "topright";
        break;

      case "left":
      default:
        anchor = "topleft";
    }

    this.container = k.add([
      k.pos(options?.x ?? 0, options?.y ?? 0),
      k.anchor(anchor),
      k.z(Z.hud),
    ]);

    this.statsByLabel = Object.fromEntries(
      stats.map(([label, value], i) => {
        return [
          label,
          {
            obj: this.container.add([
              k.text(formatStat(label, value), {
                size: 18,
              }),
              k.pos(0, 20 * i),
              k.anchor(anchor),
            ]),
            initialValue: value,
          },
        ];
      })
    ) as Record<L, StatStorage>;
  }

  public get objects(): StatObj[] {
    return this.container.children as StatObj[];
  }

  public update(label: L, newValue: string | number) {
    const statObj = this.statsByLabel[label]?.obj;
    if (statObj) {
      statObj.text = formatStat(label, newValue);
    }
  }

  public reset(label?: L) {
    if (label) {
      this.update(label, this.statsByLabel[label]?.initialValue);
    } else {
      for (const [label, stat] of Object.entries<StatStorage>(
        this.statsByLabel
      )) {
        this.update(label as L, stat.initialValue);
      }
    }
  }

  public bottomY() {
    const lastObject = this.objects[this.objects.length - 1];
    return this.container.pos.y + lastObject.pos.y + lastObject.height;
  }
}

type StatObj = GameObj<TextComp | PosComp | AnchorComp>;

interface StatStorage {
  obj: StatObj;
  initialValue: string | number;
}

function formatStat(label: string, value: string | number) {
  return `${label}: ${typeof value === "number" ? commify(value) : value}`;
}
