import kaboom, { GameObj, TextComp, KaboomCtx, Color } from "kaboom";
import { PatchedBodyCompOpt } from "./@types";
import { GameStorage, MAX_LIQUIDITY, MIN_LIQUIDITY } from "./GameStorage";
import { commify, gcd, getRandomInt, randNum, scale } from "./utils";

// settings

/**
 * How much the character jumps when the space bar is pressed.
 */
const JUMP_FORCE = 500;

/**
 * The velocity at which the character falls.
 */
const FALLING_VELOCITY = 400;

/**
 * The speed at which the bars move horizontally.
 */
const BAR_SPEED = 3;

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

/**
 * The number of seconds between events.
 */
const TIC_RATE = 1;

/**
 * The % chance of an event happening on each tic.
 */
const EVENT_CHANCE = 100;

/**
 * The % chance that each event has of being a trade (bars added).
 */
const ADD_TRADE_CHANCE = 50;

/**
 * The % chance that each event has of being added liquidity (gaps get bigger).
 */
const ADD_LIQUIDITY_CHANCE = 25;

/**
 * The % chance that each event has of being removed liquidity (gaps get smaller).
 */
const REMOVE_LIQUIDITY_CHANCE = 25;

// game

export function startGame() {
  // Start game setup
  const k = kaboom({
    background: [20, 20, 20],
  });
  const origin = k.anchor;

  // Load classes
  let gameStorage = new GameStorage();

  // // Load fonts
  k.loadFont("M23", "/m23.TTF");
  k.loadFont("HardDrive", "/hard-drive.ttf");

  // Load sprites
  k.loadSprite("bird", "/bird.png");
  k.loadSprite("ryanGosling", "./ryan_gosling_drive_movie_ascii_art.png");

  // Stats
  type Stat = "LIQUIDITY" | "SCORE" | "VOLUME" | "LONGS" | "SHORTS" | "PNL";

  let stats: Record<Stat, GameObj> = {} as Record<Stat, GameObj>;

  function updateStat(stat: Stat, value: string | number) {
    if (stats[stat]) {
      stats[stat].text = `${stat}: ${
        typeof value === "number" ? commify(value) : value
      }`;
    }
  }

  // Components

  function Stats(stats: [Stat, string | number][]): Record<Stat, GameObj> {
    const statsByLabel: Record<Stat, GameObj> = {} as Record<
      Stat,
      GameObj<TextComp>
    >;
    stats.forEach(([label, value], i) => {
      statsByLabel[label] = k.add([
        k.text(
          `${label}: ${typeof value === "number" ? commify(value) : value}`,
          {
            size: 18,
          }
        ),
        k.pos(20, 20 * (i + 1)),
        origin("topleft"),
        k.z(10),
      ]);
    });
    return statsByLabel;
  }

  function Bar(
    position: "top" | "bottom",
    barHeight: number,
    barColor: number[]
  ) {
    const bar = k.add([
      "bar",
      k.body({ isSolid: true, isStatic: true } as PatchedBodyCompOpt),
      k.rect(100, barHeight),
      k.area(),
      origin(position === "top" ? "topleft" : "botleft"),
      k.pos(k.width(), position === "top" ? 0 : k.height()),
      k.color(...(barColor as [number, number, number])),
      handleout(k),
    ]);

    bar.onUpdate(() => {
      bar.pos.x -= BAR_SPEED;
    });
  }

  k.scene("start", () => {
    // k.setBackground(Color.fromHex("#000"));
    const title = k.add([
      k.text("HYPERS DRIVE", {
        font: "M23",
        size: 96,
      }),
      k.pos(k.width() / 2, 200),
      origin("center"),
    ]);

    const subTitle = title.add([
      k.text("Can you handle the quantum leap anon", {
        font: "HardDrive",
        size: 42,
      }),
      k.pos(0, 100),
      origin("center"),
    ]);

    subTitle.add([
      k.text("Press ENTER to start the game...", {
        font: "M23",
        size: 20,
      }),
      k.pos(0, 100),
      origin("center"),
    ]);

    k.add([
      k.sprite("ryanGosling"),
      k.scale(0.5, 0.5),
      k.pos(k.width() / 2, k.height() / 2 + 100),
      origin("center"),
      k.area(),
      k.body({
        isStatic: true,
      } as PatchedBodyCompOpt),
    ]);

    // Event callback handlers
    k.onKeyPress("enter", () => {
      gameStorage = new GameStorage();
      gameStorage.liquidity = MAX_LIQUIDITY;
      updateStat("SCORE", gameStorage.score);
      updateStat("LIQUIDITY", gameStorage.liquidity);
      k.go("game");
    });
  });

  // Scenes
  k.scene("game", () => {
    k.setGravity(1750);
    // boundaries
    k.add([
      "top",
      "obstacle",
      k.rect(k.width(), 4),
      k.pos(0, 0),
      origin("topleft"),
      k.area(),
      k.body({ isSolid: true, isStatic: true } as PatchedBodyCompOpt),
      k.color(255, 0, 0),
    ]);
    k.add([
      "bottom",
      "obstacle",
      k.rect(k.width(), 4),
      k.pos(0, k.height()),
      origin("botleft"),
      k.area(),
      k.body({ isSolid: true, isStatic: true } as PatchedBodyCompOpt),
      k.color(255, 0, 0),
    ]);
    k.add([
      "left",
      "obstacle",
      k.rect(4, k.height()),
      k.pos(0, 0),
      origin("topleft"),
      k.area(),
      k.body({ isSolid: true, isStatic: true } as PatchedBodyCompOpt),
      k.color(255, 0, 0),
    ]);

    const player = k.add([
      k.sprite("bird"),
      k.pos(k.width() / 3, 80),
      origin("center"),
      k.area(),
      k.body({
        // @ts-ignore
        maxVel: FALLING_VELOCITY,
      }),
    ]);

    player.onCollide("obstacle", () => {
      k.destroy(player);
      k.go("gameover");
    });

    stats = Stats([
      ["LIQUIDITY", gameStorage.liquidity],
      ["LONGS", gameStorage.longsVolume],
      ["SHORTS", gameStorage.shortsVolume],
      ["VOLUME", gameStorage.totalVolume],
      ["SCORE", gameStorage.score],
    ]);

    let lastTopBarHeight: number;
    let currentDeviationCooldown = DEVIATION_COOLDOWN;

    k.loop(TIC_RATE, () => {
      const event = generateGameEvent();
      const eventAmount = randNum(100, gameStorage.liquidity);

      switch (event) {
        case "ADD_TRADE":
          const gap = scale(
            gameStorage.liquidity,
            MIN_LIQUIDITY,
            MAX_LIQUIDITY,
            MIN_GAP,
            MAX_GAP
          );

          // decide the top bar height
          const topBarHeight = scale(
            eventAmount,
            100,
            gameStorage.liquidity,

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
              ? Math.min(k.height() - gap, lastTopBarHeight + DEVIATION)
              : k.height() - gap
          );

          // set the bottom bar height to the remaining space after the top bar
          // height and gap.
          const bottomBarHeight = k.height() - topBarHeight - gap;

          // if the next gap is lower than the last or this is the first gap and
          // it's closer to the bottom than the top, then consider this trade a
          // long.
          const isLong =
            topBarHeight > lastTopBarHeight ||
            (!lastTopBarHeight && topBarHeight > k.height() / 2 - gap / 2);

          // Make the bars red for longs and green for shorts
          const barColor = isLong ? [255, 0, 0] : [0, 255, 0];

          // add the bars to the game
          Bar("top", topBarHeight, barColor);
          Bar("bottom", bottomBarHeight, barColor);

          // update stats
          if (isLong) {
            gameStorage.addLong(eventAmount);
            updateStat("LONGS", gameStorage.longsVolume);
          } else {
            gameStorage.addShort(eventAmount);
            updateStat("SHORTS", gameStorage.shortsVolume);
          }
          updateStat("VOLUME", gameStorage.totalVolume);

          // reset the lastTopBarHeight
          lastTopBarHeight = topBarHeight;

          // reset the deviation cooldown
          currentDeviationCooldown = DEVIATION_COOLDOWN;
          return;

        case "ADD_LIQUIDITY":
          gameStorage.addLiquidity(eventAmount);
          updateStat("LIQUIDITY", gameStorage.liquidity);
          currentDeviationCooldown = Math.max(0, currentDeviationCooldown - 1);
          return;

        case "REMOVE_LIQUIDITY":
          gameStorage.removeLiquidity(eventAmount);
          updateStat("LIQUIDITY", gameStorage.liquidity);
          currentDeviationCooldown = Math.max(0, currentDeviationCooldown - 1);
      }
    });

    // Event callback handlers
    k.onKeyPress("x", () => k.go("gameover"));
    k.onKeyPress("space", () => player.jump(JUMP_FORCE));
    k.onKeyPress("space", () => {
      const feesText = k.add([
        k.text("+Fees", {
          size: 24,
        }),
        k.pos(k.width() - 100, 100),
        origin("center"),
      ]);
      gameStorage.score = gameStorage.score + 10;
      updateStat("SCORE", gameStorage.score);
      k.wait(0.5, () => {
        k.destroy(feesText);
      });
    });
  });

  k.scene("gameover", () => {
    k.add([k.text("Game over!"), k.pos(k.width() / 2, 50), origin("center")]);
    k.add([
      k.text("Press R to restart", {
        size: 20,
      }),
      k.pos(k.width() / 2, 250),
      origin("center"),
    ]);

    const statObjects = Object.values(stats);

    statObjects.forEach((stat, i) => {
      k.readd(stat);
      stat.pos.x = k.width() / 2;
      stat.pos.y = 270 + 20 * (i + 1);
      stat.origin = "center";
    });

    const highScore = localStorage.highScore || 0;
    if (gameStorage.score > highScore) {
      localStorage.highScore = gameStorage.score;
    }

    k.add([
      k.text(`HIGH SCORE: ${localStorage.highScore}`, {
        size: 18,
      }),
      k.pos(k.width() / 2, statObjects[statObjects.length - 1].pos.y + 40),
      origin("center"),
    ]);

    // Event callback handlers
    k.onKeyPress("r", () => {
      gameStorage = new GameStorage();
      gameStorage.liquidity = MAX_LIQUIDITY;
      updateStat("SCORE", gameStorage.score);
      updateStat("LIQUIDITY", gameStorage.liquidity);
      k.go("game");
    });
  });

  k.go("start");

  focus();
}

const eventGCD = gcd(
  ADD_TRADE_CHANCE,
  ADD_LIQUIDITY_CHANCE,
  REMOVE_LIQUIDITY_CHANCE
);

// Create a list of events where the count of each event is even to the events'
// chances.
const GameEvents = [
  ...Array(ADD_TRADE_CHANCE / eventGCD).fill("ADD_TRADE"),
  ...Array(ADD_LIQUIDITY_CHANCE / eventGCD).fill("ADD_LIQUIDITY"),
  ...Array(REMOVE_LIQUIDITY_CHANCE / eventGCD).fill("REMOVE_LIQUIDITY"),
] as const;

const generateGameEvent = () => {
  const hasEvent = Math.random() < EVENT_CHANCE / 100;
  if (!hasEvent) {
    console.log("NO EVENT");
    return;
  }
  const seed = getRandomInt(GameEvents.length);
  const event = GameEvents[seed];
  console.log(event);
  return event;
};

// delete when out of screen
function handleout(k: KaboomCtx) {
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
