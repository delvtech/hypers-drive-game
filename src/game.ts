import kaboom, { KaboomCtx, TweenController } from "kaboom";
import { PatchedBodyCompOpt } from "./@types";
import { GameStorage, MAX_LIQUIDITY } from "./GameStorage";
import { commify, randNum, scale } from "./utils";
import { Settings } from "./settings";
import { Stats } from "./objects/Stats";
import { Events } from "./Events";
import { EventFeed } from "./objects/EventFeed";
import { Trades } from "./objects/Trades";
import BezierEasing from "bezier-easing";

/**
 * Add default settings to a partial settings object
 */
function initSettings(settings?: Partial<Settings>) {
  return {
    GRAVITY: 1750,
    JUMP_FORCE: 600,
    FALLING_VELOCITY: 600,
    SPEED: 5,
    MIN_GAP: 150,
    MAX_GAP: 400,
    DEVIATION: 90,
    DEVIATION_COOLDOWN: 1,
    TIC_RATE: 1,
    EVENT_CHANCE: 100,
    ADD_TRADE_CHANCE: 50,
    ADD_LIQUIDITY_CHANCE: 25,
    REMOVE_LIQUIDITY_CHANCE: 25,
    ...settings,
  };
}

// mph
const SPEED_OF_LIGHT = 671_000_000;

export interface Game {
  k: KaboomCtx;
  settings: Settings;
  storage: GameStorage;
  events: Events;
  width: number;
  height: number;
}

export function startGame(settings?: Partial<Settings>) {
  // create kaboom instance
  const k = kaboom({
    background: [20, 20, 20],
  });

  // Add defaults to settings
  const settingsWithDefaults = initSettings(settings);
  const {
    GRAVITY,
    JUMP_FORCE,
    FALLING_VELOCITY,
    SPEED,
    DEVIATION,
    DEVIATION_COOLDOWN,
    TIC_RATE,
  } = settingsWithDefaults;

  // create a game object with all settings defined
  const game: Game = {
    k,
    settings: settingsWithDefaults,
    storage: new GameStorage(),
    events: new Events(settingsWithDefaults),
    width: k.width(),
    height: k.height(),
  };

  // initiate reusable object classes outside the scenes
  const eventFeed = new EventFeed(game);
  const trades = new Trades(game);

  // // Load fonts
  k.loadFont("M23", "/m23.TTF");
  k.loadFont("HardDrive", "/hard-drive.ttf");

  // Load sprites
  k.loadSprite("bird", "/bird.png");
  k.loadSprite("ryanGosling", "./ryan_gosling_drive_movie_ascii_art.png");

  // Scenes

  //////////////////////////////////////////////////////////////////////////////
  // START
  //////////////////////////////////////////////////////////////////////////////
  k.scene("start", () => {
    const title = k.add([
      k.text("HYPERS DRIVE", {
        font: "M23",
        size: 96,
      }),
      k.pos(game.width / 2, 200),
      k.anchor("center"),
    ]);

    const subTitle = title.add([
      k.text("Can you handle the quantum leap anon", {
        font: "HardDrive",
        size: 42,
      }),
      k.pos(0, 100),
      k.anchor("center"),
    ]);

    subTitle.add([
      k.text("Press ENTER to start the game...", {
        font: "M23",
        size: 20,
      }),
      k.pos(0, 100),
      k.anchor("center"),
    ]);

    k.add([
      k.sprite("ryanGosling"),
      k.scale(0.5, 0.5),
      k.pos(game.width / 2, game.height / 2 + 100),
      k.anchor("center"),
      k.area(),
      k.body({
        isStatic: true,
      } as PatchedBodyCompOpt),
    ]);

    // Event callback handlers
    k.onKeyPress("enter", () => {
      game.storage = new GameStorage();
      game.storage.liquidity = MAX_LIQUIDITY;
      k.go("game");
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // GAME
  //////////////////////////////////////////////////////////////////////////////
  k.scene("game", () => {
    k.setGravity(GRAVITY);

    k.add(eventFeed.container);

    const baseSpeed = SPEED * 100_000;

    const stats = new Stats(
      k,
      [
        ["LIQUIDITY", game.storage.liquidity],
        ["LONGS", game.storage.longsVolume],
        ["SHORTS", game.storage.shortsVolume],
        ["VOLUME", game.storage.totalVolume],
        ["SCORE", game.storage.score],
        ["SPEED", commify(baseSpeed)],
      ],
      {
        x: 20,
        y: 20,
      }
    );

    const startingPlayerX = game.width / 5;
    const player = k.add([
      k.sprite("bird"),
      k.pos(startingPlayerX, 80),
      k.anchor("center"),
      k.area(),
      k.body({
        // @ts-ignore
        maxVel: FALLING_VELOCITY,
      }),
    ]);

    // boundaries
    k.add([
      "top",
      "obstacle",
      k.rect(game.width, 4),
      k.pos(0, 0),
      k.anchor("topleft"),
      k.area(),
      k.body({ isSolid: true, isStatic: true } as PatchedBodyCompOpt),
      k.color(255, 0, 0),
    ]);
    k.add([
      "bottom",
      "obstacle",
      k.rect(game.width, 4),
      k.pos(0, game.height),
      k.anchor("botleft"),
      k.area(),
      k.body({ isSolid: true, isStatic: true } as PatchedBodyCompOpt),
      k.color(255, 0, 0),
    ]);
    k.add([
      "left",
      "obstacle",
      k.rect(4, game.height),
      k.pos(0, 0),
      k.anchor("topleft"),
      k.area(),
      k.body({ isSolid: true, isStatic: true } as PatchedBodyCompOpt),
      k.color(255, 0, 0),
    ]);
    k.add([
      "right-color",
      k.rect(4, game.height),
      k.pos(game.width, 0),
      k.anchor("topright"),
      k.color(0, 255, 0),
    ]);

    let speedStatTween: TweenController;
    let speedTween: TweenController;
    let currentSpeed = baseSpeed;
    const finalPlayerX = game.width + 100;

    function startTweening() {
      const duration = scale(
        player.pos.x,
        startingPlayerX,
        finalPlayerX,
        20,
        0
      );
      const finalSpeed = 10_000_000;

      speedStatTween = k.tween(
        baseSpeed,
        finalSpeed,
        duration,
        (speed) => {
          currentSpeed = speed;
          game.storage.topSpeed = Math.max(speed, game.storage.topSpeed);
        },
        k.easings.easeInCubic
      );

      speedTween = k.tween(
        player.pos.x,
        finalPlayerX,
        duration,
        (x) => {
          if (x >= game.width - game.width / 8) {
            game.storage.topSpeed = SPEED_OF_LIGHT;
            speedTween.cancel();
            speedTween = k.tween(
              player.pos.x,
              finalPlayerX,
              0.6,
              (x) => (player.pos.x = x),
              BezierEasing(0.6, -0.6, 1.0, -0.2)
            );
            speedStatTween.cancel();
            speedStatTween = k.tween(
              currentSpeed,
              SPEED_OF_LIGHT,
              0.6,
              (speed) => {
                stats.update("SPEED", `${commify(speed, 0)} mph`);
              },
              BezierEasing(0.6, 0, 1.0, 0)
            );
            k.wait(0.6, () => k.go("gameover"));
          }
          player.pos.x = x;
        },
        k.easings.easeInCubic
      );
    }

    startTweening();

    player.onCollide("bar", () => {
      speedTween.cancel();
      speedStatTween.cancel();
      stats.update("SPEED", commify(0));
    });
    player.onCollideEnd("bar", () => {
      startTweening();
    });

    player.onCollide("obstacle", () => {
      k.go("gameover");
    });

    let currentDeviationCooldown = DEVIATION_COOLDOWN;

    k.loop(0.2, () => {
      stats.update("SPEED", commify(currentSpeed, 0));
    });

    k.loop(TIC_RATE, () => {
      const event = game.events.generateGameEvent();
      const eventAmount = randNum(100, game.storage.liquidity);

      switch (event) {
        case "ADD_TRADE":
          const type = Math.random() > 0.5 ? "LONG" : "SHORT";

          if (type === "LONG") {
            game.storage.addLong(eventAmount);
            stats.update("LONGS", game.storage.longsVolume);
          } else {
            game.storage.addShort(eventAmount);
            stats.update("SHORTS", game.storage.shortsVolume);
          }
          stats.update("VOLUME", game.storage.totalVolume);

          trades.add(
            eventAmount,
            type,
            currentDeviationCooldown ? DEVIATION : undefined
          );
          eventFeed.add(
            `${type === "LONG" ? "Long" : "Short"} added: ${eventAmount}`
          );

          // reset the deviation cooldown
          currentDeviationCooldown = DEVIATION_COOLDOWN;
          return;

        case "ADD_LIQUIDITY":
          game.storage.addLiquidity(eventAmount);
          stats.update("LIQUIDITY", game.storage.liquidity);
          eventFeed.add(`+${eventAmount} liquidity`);
          currentDeviationCooldown = Math.max(0, currentDeviationCooldown - 1);
          return;

        case "REMOVE_LIQUIDITY":
          game.storage.removeLiquidity(eventAmount);
          stats.update("LIQUIDITY", game.storage.liquidity);
          eventFeed.add(`-${eventAmount} liquidity`);
          currentDeviationCooldown = Math.max(0, currentDeviationCooldown - 1);
      }
    });

    // Event callback handlers
    k.onKeyPress("space", () => player.jump(JUMP_FORCE));
    k.onKeyPress("space", () => {
      const feesText = k.add([
        k.text("+Fees", {
          size: 24,
        }),
        k.pos(game.width - 100, 100),
        k.anchor("center"),
      ]);
      game.storage.score = game.storage.score + 10;
      stats.update("SCORE", game.storage.score);
      k.wait(0.5, () => {
        k.destroy(feesText);
      });
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // GAME OVER, MAN
  //////////////////////////////////////////////////////////////////////////////
  k.scene("gameover", () => {
    k.add([
      k.text("Game over!"),
      k.pos(game.width / 2, 50),
      k.anchor("center"),
    ]);
    k.add([
      k.text("Press ENTER to restart", {
        size: 20,
      }),
      k.pos(game.width / 2, 250),
      k.anchor("center"),
    ]);

    const highScore = localStorage.highScore || 0;
    if (game.storage.score > highScore) {
      localStorage.highScore = game.storage.score;
    }

    const stats = new Stats(
      k,
      [
        ["VOLUME", game.storage.totalVolume],
        ["SCORE", game.storage.score],
        ["TOP SPEED", commify(game.storage.topSpeed, 0)],
      ],
      {
        alignment: "center",
        x: game.width / 2,
        y: 270,
      }
    );

    k.add([
      k.text(`HIGH SCORE: ${localStorage.highScore}`, {
        size: 18,
      }),
      k.pos(game.width / 2, stats.bottomY() + 40),
      k.anchor("center"),
    ]);

    // Event callback handlers
    k.onKeyPress("enter", () => {
      game.storage = new GameStorage();
      game.storage.liquidity = MAX_LIQUIDITY;
      k.go("game");
    });
  });

  k.go("start");

  focus();
}

function formatSpeed(speed: number, baseSpeed: number) {
  return `${commify(baseSpeed * 100_000 + speed * 1_000_000, 0)} mph`;
}
