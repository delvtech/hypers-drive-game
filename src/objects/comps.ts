import { KaboomCtx } from "kaboom";
import { Settings } from "../settings";

// delete when out of screen
export function handleout(k: KaboomCtx) {
  return {
    id: "handleout",
    require: ["pos"],
    update() {
      const spos = this.screenPos();
      if (spos.x > k.width() + 20 || spos.y < 0 || spos.y > k.height()) {
        // triggers a custom event when out
        this.trigger("out");
      }
    },
  };
}

export function background({ SPEED }: Settings) {
  return {
    id: "background",
    require: ["pos"],
    update() {
      this.pos.x -= SPEED;
    },
  };
}
