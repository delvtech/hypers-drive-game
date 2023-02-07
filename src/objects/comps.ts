import { Settings } from "../settings";

export function background(settings: Settings) {
  return {
    id: "background",
    require: ["pos"],
    update() {
      this.pos.x -= settings.SPEED * settings.SCALE;
    },
  };
}
