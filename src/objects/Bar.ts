import { KaboomCtx } from "kaboom";
import { background } from "./comps";
import { Settings } from "../settings";
import { Z } from "../game";

interface BarOptions {
  k: KaboomCtx;
  settings: Settings;
  position: "top" | "bottom";
  size: number;
  color: number[];
}

export function Bar({ k, settings, position, size, color }: BarOptions) {
  return k.add([
    "bar",
    // @ts-ignore
    k.body({ isSolid: true, isStatic: true }),
    k.rect(100, size),
    k.area(),
    k.anchor(position === "top" ? "topleft" : "botleft"),
    k.pos(k.width(), position === "top" ? 0 : k.height()),
    k.color(...(color as [number, number, number])),
    k.offscreen({ destroy: true }),
    k.z(Z.bars),
    background(settings),
  ]);
}
