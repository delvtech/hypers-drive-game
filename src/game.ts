import kaboom from "kaboom";
import { GameStorage } from "./GameStorage";
import { getRandomInt, randNum, scale } from "./utils";

export function startGame() {
  // Start game setup
  const k = kaboom({
    background: [20, 20, 20],
  });
  const origin = k.origin;

  // Load classes
  const gameStorage = new GameStorage();

  // Load sprites
  k.loadSprite("bird", "/bird.png");

  // Components
  function Bar(position: "top" | "bottom", barHeight: number) {
    const bar = add([
      "obstacle",
      rect(100, barHeight),
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

  function Scorecard() {
    const scoreBody = add([
      rect(300, 200),
      pos(width() - 250, 0),
      fixed(),
      z(10),
    ]);
    const scoreHeader = add([
      text("Score", {
        size: 48,
      }),
      pos(scoreBody.pos.x, scoreBody.pos.y),
      fixed(),
      z(10),
    ]);
    const scoreText = add([
      text("0", {
        size: 36,
      }),
      pos(scoreBody.pos.x, scoreBody.pos.y + 50),
      fixed(),
      z(10),
    ]);

    return {
      scoreBody,
      scoreHeader,
      scoreText,
    };
  }

  // Scenes
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

    const GameEvents = [
      "ADD_SHORT",
      "ADD_LONG",
      "ADD_LIQUIDITY",
      "REMOVE_LIQUIDITY",
    ] as const;

    const generateGameEvent = () => {
      const seed = getRandomInt(GameEvents.length);
      const event = GameEvents[seed];
      if (event) {
        console.log(event);
        return event;
      } else {
        console.log(" no event");
      }
    };

    const { scoreText } = Scorecard();

    loop(1, () => {
      const event = generateGameEvent();
      const newAmount = randNum(100, gameStorage.liquidity);
      const barHeight = scale(
        newAmount,
        100,
        gameStorage.liquidity,
        0,
        height() / 2
      );

      switch (event) {
        case "ADD_LONG":
          Bar("top", barHeight);
          return;
        case "ADD_SHORT":
          Bar("bottom", barHeight);
          return;
        case "ADD_LIQUIDITY":
          gameStorage.addLiquidity(newAmount);
          return;
        case "REMOVE_LIQUIDITY":
          gameStorage.removeLiquidity(newAmount);
      }
    });

    // Event callback handlers
    onKeyPress("space", () => player.jump(400));
    onKeyPress("space", () => {
      const feesText = add([
        text("+Fees", {
          size: 24,
        }),
        pos(width() - 100, 100),
        k.origin("center"),
      ]);

      gameStorage.score = gameStorage.score + 10;
      scoreText.text = gameStorage.score.toString();
      wait(0.5, () => {
        destroy(feesText);
      });
    });
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

    // Event callback handlers
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
