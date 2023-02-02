import kaboom from "kaboom";

export function startGame() {
  // Start a kaboom game
  const k = kaboom();
  const origin = k.origin;

  k.loadSprite("bird", "/bird.png");

  // Components
  function Bar(topOrBottom: "top" | "bottom", barHeight: number) {
    const bar = add([
      "obstacle",
      rect(100, barHeight),
      area(),
      origin(topOrBottom === "top" ? "top" : "bot"),
      pos(width(), topOrBottom === "top" ? 0 : height()),
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
  let chance = function Short(amount) {
    const short = Bar("bottom", amount / liquidity);
  };

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
      sprite("bird"), // sprite() component makes it render as a sprite
      pos(120, 80), // pos() component gives it position, also enables movement
      rotate(0), // rotate() component gives it rotation
      origin("center"), // origin() component defines the pivot point (defaults to "topleft")
      area(),
      body({
        maxVel: 300,
      }),
    ]);

    player.onCollide("obstacle", () => {
      destroy(player);
      go("gameover");
    });

    loop(1, () => {
      const topBarHeight = randNum(100, height() / 2);
      Bar("top", topBarHeight);
      Bar("bottom", height() - topBarHeight - gap);
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
