import kaboom from "kaboom";

export function startGame() {
  // Start a kaboom game
  const k = kaboom({
    background: [20, 20, 20],
  });
  const origin = k.origin;

  k.loadSprite("bird", "/bird.png");

  // Components
  function Bar(position: "top" | "bottom", barHeight: number) {
    const bar = add([
      "obstacle",
      rect(30, barHeight),
      area(),
      origin(position === "top" ? "top" : "bot"),
      pos(width(), position === "top" ? 0 : height()),
      position === "top" ? color(255, 0, 0) : color(0, 255, 0),
      handleout(),
    ]);

    bar.onUpdate(() => {
      bar.pos.x -= 2;
    });
  }

  function randNum(min, max) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  let liquidity = 100_000;
  const gap = 300;
  let chance = 0.75;

  // function Short() {
  //   const short = Bar("bottom", amount / liquidity);
  // }

  scene("game", () => {
    const bottom = add([
      "bottom",
      rect(width(), 1),
      pos(0, height()),
      origin("botleft"),
      area(),
      solid(),
      color(255, 0, 0),
    ]);
    // add() assembles a game object from a list of components and add to game, returns the reference of the game object
    const player = add([
      sprite("bird"),
      pos(120, 80),
      origin("center"),
      area(),
      body({
        maxVel: 300,
      }),
    ]);

    player.onCollide("obstacle", () => {
      destroy(player);
      go("gameover");
    });

    loop(2, () => {
      const hasEvent = Math.random() < chance;
      if (hasEvent) {
        Bar(Math.random() > 0.5 ? "top" : "bottom", randNum(100, height() / 2));
      }
    });

    onKeyPress("space", () => player.jump(400));
  });

  scene("gameover", () => {
    add([text("Game over!"), pos(width() / 2, 50), k.origin("center")]);
    add([
      text("Press space to restart", {
        size: 20,
      }),
      pos(width() / 2, 250),
      k.origin("center"),
    ]);

    onKeyPress("space", () => {
      go("game");
    });
  });

  go("game");
}

// delete when out of screen
function handleout() {
  return {
    id: "handleout",
    require: ["pos"],
    update() {
      const spos = this.screenPos();
      if (spos.x > width() + 20 || spos.y < 0 || spos.y > height()) {
        // triggers a custom event when out
        this.trigger("out");
      }
    },
  };
}
