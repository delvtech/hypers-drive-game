import kaboom, { GameObj, TextComp } from "kaboom";
import { GameStorage, MAX_LIQUIDITY, MIN_LIQUIDITY } from "./GameStorage";
import { getRandomInt, randNum, scale } from "./utils";

const BASE_GAP = 200;
const DEVIATION = 100;

export function startGame() {
  // Start game setup
  const k = kaboom({
    background: [20, 20, 20],
  });
  const origin = k.origin;

  // Load classes
  let gameStorage = new GameStorage();

  // Load sprites
  k.loadSprite("bird", "/bird.png");

  let stats: Record<Stat, GameObj> = {} as Record<Stat, GameObj>;

  // Components
  function Bar(
    position: "top" | "bottom",
    barHeight: number,
    barColor: number[]
  ) {
    const bar = add([
      "bar",
      solid(),
      rect(100, barHeight),
      area(),
      origin(position === "top" ? "top" : "bot"),
      pos(width(), position === "top" ? 0 : height()),
      color(...(barColor as [number, number, number])),
      handleout(),
    ]);

    bar.onUpdate(() => {
      bar.pos.x -= 3;
    });
  }

  function Stats(stats: [Stat, string | number][]): Record<Stat, GameObj> {
    const statsByLabel: Record<Stat, GameObj> = {} as Record<
      Stat,
      GameObj<TextComp>
    >;
    stats.forEach(([label, value], i) => {
      statsByLabel[label] = add([
        text(`${label}: ${value}`, {
          size: 18,
        }),
        pos(20, 20 * (i + 1)),
        origin("topleft"),
        z(10),
      ]);
    });
    return statsByLabel;
  }

  function updatedState(stat: Stat, value: string | number) {
    stats[stat].text = `${stat}: ${value}`;
  }

  // Scenes
  scene("game", () => {
    // boundaries
    const top = add([
      "obstacle",
      "bottom",
      rect(width(), 1),
      pos(0, 0),
      origin("topleft"),
      area(),
      solid(),
    ]);
    const bottom = add([
      "obstacle",
      "bottom",
      rect(width(), 1),
      pos(0, height()),
      origin("botleft"),
      area(),
      solid(),
      color(255, 0, 0),
    ]);
    const left = add([
      "obstacle",
      "left",
      rect(0, height()),
      pos(0, 0),
      origin("topleft"),
      area(),
      solid(),
      color(255, 0, 0),
    ]);

    // add() assembles a game object from a list of components and add to game, returns the reference of the game object
    const player = add([
      sprite("bird"),
      pos(width() / 3, 80),
      origin("center"),
      area(),
      body({
        maxVel: 400,
      }),
    ]);

    player.onCollide("obstacle", () => {
      destroy(player);
      go("gameover");
    });

    const GameEvents = [
      "ADD_TRADE",
      "ADD_TRADE",
      "ADD_LIQUIDITY",
      "REMOVE_LIQUIDITY",
    ] as const;

    // let chance = 0.9;

    const generateGameEvent = () => {
      // const hasEvent = Math.random() < chance;
      // if (!hasEvent) {
      //   console.log(" no event");
      //   return;
      // }

      const seed = getRandomInt(GameEvents.length);
      const event = GameEvents[seed];
      if (event) {
        console.log(event);
        return event;
      }
    };

    stats = Stats([
      ["TOTAL LIQUIDITY", gameStorage.liquidity],
      ["SCORE", gameStorage.score],
    ]);

    let lastTopBar: number;
    let deviationCooldown = 3;

    loop(1, () => {
      const event = generateGameEvent();
      const newAmount = randNum(100, gameStorage.liquidity);

      switch (event) {
        case "ADD_TRADE":
          const gap = scale(
            gameStorage.liquidity,
            MIN_LIQUIDITY,
            MAX_LIQUIDITY,
            150,
            400
          );
          const topBarHeight = randNum(
            0,
            lastTopBar && deviationCooldown
              ? Math.min(height() - gap, lastTopBar + DEVIATION)
              : height() - gap
          );
          let color = [0, 255, 0];
          if (
            topBarHeight > lastTopBar ||
            (!lastTopBar && topBarHeight > height() / 2 - gap / 2)
          ) {
            color = [255, 0, 0];
          }
          lastTopBar = topBarHeight;
          const bottomBarHeight = height() - topBarHeight - gap;
          Bar("top", topBarHeight, color);
          Bar("bottom", bottomBarHeight, color);
          deviationCooldown = Math.min(0, deviationCooldown--);
          return;
        case "ADD_LIQUIDITY":
          gameStorage.addLiquidity(newAmount);
          return;
        case "REMOVE_LIQUIDITY":
          gameStorage.removeLiquidity(newAmount);
      }
    });

    // Event callback handlers
    onKeyPress("space", () => player.jump(500));
    onKeyPress("space", () => {
      const feesText = add([
        text("+Fees", {
          size: 24,
        }),
        pos(width() - 100, 100),
        k.origin("center"),
      ]);
      gameStorage.score = gameStorage.score + 10;
      updatedState("SCORE", gameStorage.score);
      updatedState("TOTAL LIQUIDITY", gameStorage.liquidity);
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

    Object.values(stats).forEach((stat, i) => {
      readd(stat);
      stat.pos.x = width() / 2;
      stat.pos.y = 270 + 20 * (i + 1);
      stat.origin = "center";
    });

    // Event callback handlers
    onKeyPress("space", () => {
      gameStorage = new GameStorage();
      updatedState("SCORE", gameStorage.score);
      updatedState("TOTAL LIQUIDITY", gameStorage.liquidity);
      go("game");
    });
  });

  go("game");

  focus();
}

type Stat = "TOTAL LIQUIDITY" | "SCORE" | "VOLUME" | "LONGS" | "SHORTS" | "PNL";

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
