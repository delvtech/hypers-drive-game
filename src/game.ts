import kaboom, { GameObj, TextComp } from "kaboom";
import { GameStorage, MAX_LIQUIDITY, MIN_LIQUIDITY } from "./GameStorage";
import { getRandomInt, randNum, scale } from "./utils";

/**
 * The minimum amount of space between the top and bottom bar
 */
const MIN_GAP = 150;

/**
 * The max amount of space between the top and bottom bar
 */
const MAX_GAP = 400;

/**
 * The max distance a gap can be from the gap before it.
 */
const DEVIATION = 100;

/**
 * The amount of ticks without new bars that the DEVIATION should be respected.
 * When this number of ticks have passed with no bars, the next gap can be
 * placed at any position, then the cooldown resets.
 */
const DEVIATION_COOLDOWN = 1;

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

    let lastTopBarHeight: number;
    let currentDeviationCooldown = DEVIATION_COOLDOWN;

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

          // decide the top bar height
          const topBarHeight = randNum(
            // if this isn't the first bar and the cooldown hasn't ended, then
            // make sure the bar is at least tall enough to not deviate too far
            // from the last bar. Otherwise the min height is 0.
            lastTopBarHeight && currentDeviationCooldown
              ? Math.max(0, lastTopBarHeight - DEVIATION)
              : 0,

            // if this isn't the first bar and the cooldown hasn't ended, then
            // make sure the bar is not so tall that it deviates too far from
            // the last bar. Other wise the max height is the game height minus
            // the gap.
            lastTopBarHeight && currentDeviationCooldown
              ? Math.min(height() - gap, lastTopBarHeight + DEVIATION)
              : height() - gap
          );

          // set the bar color to green by default
          let barColor = [0, 255, 0];

          // if the next gap is lower than the last or this is the first gap and
          // it's closer to the bottom than the top, then set the color to red.
          if (
            topBarHeight > lastTopBarHeight ||
            (!lastTopBarHeight && topBarHeight > height() / 2 - gap / 2)
          ) {
            barColor = [255, 0, 0];
          }

          // reset the lastTopBarHeight
          lastTopBarHeight = topBarHeight;

          // set the bottom bar height to the remaining space after the top bar
          // height and gap.
          const bottomBarHeight = height() - topBarHeight - gap;

          // add the bars to the game
          Bar("top", topBarHeight, barColor);
          Bar("bottom", bottomBarHeight, barColor);

          // reset the deviation cooldown
          currentDeviationCooldown = DEVIATION_COOLDOWN;
          return;

        case "ADD_LIQUIDITY":
          gameStorage.addLiquidity(newAmount);
          currentDeviationCooldown = Math.max(0, currentDeviationCooldown - 1);
          return;

        case "REMOVE_LIQUIDITY":
          currentDeviationCooldown = Math.max(0, currentDeviationCooldown - 1);
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
