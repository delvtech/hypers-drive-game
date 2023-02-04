import kaboom, { KaboomCtx } from "kaboom";
import { PatchedBodyCompOpt } from "./@types";
import { GameStorage, MAX_LIQUIDITY } from "./GameStorage";
import { randNum } from "./utils";
import { Settings } from "./settings";
import { Stats } from "./objects/Stats";
import { Events } from "./Events";
import { EventFeed } from "./objects/EventFeed";
import { Trades } from "./objects/Trades";

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

export interface Game {
  k: KaboomCtx;
  settings: Settings;
  storage: GameStorage;
  events: Events;
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
      k.pos(k.width() / 2, 200),
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
      k.pos(k.width() / 2, k.height() / 2 + 100),
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
    // boundaries
    k.add([
      "top",
      "obstacle",
      k.rect(k.width(), 4),
      k.pos(0, 0),
      k.anchor("topleft"),
      k.area(),
      k.body({ isSolid: true, isStatic: true } as PatchedBodyCompOpt),
      k.color(255, 0, 0),
    ]);
    k.add([
      "bottom",
      "obstacle",
      k.rect(k.width(), 4),
      k.pos(0, k.height()),
      k.anchor("botleft"),
      k.area(),
      k.body({ isSolid: true, isStatic: true } as PatchedBodyCompOpt),
      k.color(255, 0, 0),
    ]);
    k.add([
      "left",
      "obstacle",
      k.rect(4, k.height()),
      k.pos(0, 0),
      k.anchor("topleft"),
      k.area(),
      k.body({ isSolid: true, isStatic: true } as PatchedBodyCompOpt),
      k.color(255, 0, 0),
    ]);
    k.add([
      "right",
      "obstacle",
      k.rect(4, k.height()),
      k.pos(k.width(), 0),
      k.anchor("topright"),
      k.area(),
      k.body({ isSolid: true, isStatic: true } as PatchedBodyCompOpt),
      k.color(0, 255, 0),
    ]);

    const stats = new Stats(
      k,
      [
        ["LIQUIDITY", game.storage.liquidity],
        ["LONGS", game.storage.longsVolume],
        ["SHORTS", game.storage.shortsVolume],
        ["VOLUME", game.storage.totalVolume],
        ["SCORE", game.storage.score],
      ],
      {
        x: 20,
        y: 20,
      }
    );

    k.add(eventFeed.container);

    const player = k.add([
      k.sprite("bird"),
      k.pos(k.width() / 3, 80),
      k.anchor("center"),
      k.area(),
      k.body({
        // @ts-ignore
        maxVel: FALLING_VELOCITY,
      }),
    ]);

    player.onCollide("obstacle", () => {
      k.go("gameover");
    });

    let playerSpeed = 0;
    player.onCollide("bar", () => {
      playerSpeed = 0;
    });

    player.onUpdate(() => {
      player.pos.x += playerSpeed;
    });

    let currentDeviationCooldown = DEVIATION_COOLDOWN;

    k.loop(TIC_RATE, () => {
      const event = game.events.generateGameEvent();
      const eventAmount = randNum(100, game.storage.liquidity);

      switch (event) {
        case "ADD_TRADE":
          // increase the players speed with every trade
          playerSpeed = Math.max(0.1, playerSpeed * 1.5);

          const type = Math.random() > 0.5 ? "LONG" : "SHORT";

          // update storage
          if (type === "LONG") {
            game.storage.addLong(eventAmount);
            stats.update("LONGS", game.storage.longsVolume);
          } else {
            game.storage.addShort(eventAmount);
            stats.update("SHORTS", game.storage.shortsVolume);
          }

          // update objects
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
        k.pos(k.width() - 100, 100),
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
    k.add([k.text("Game over!"), k.pos(k.width() / 2, 50), k.anchor("center")]);
    k.add([
      k.text("Press R to restart", {
        size: 20,
      }),
      k.pos(k.width() / 2, 250),
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
      ],
      {
        alignment: "center",
        x: k.width() / 2,
        y: 270,
      }
    );

    k.add([
      k.text(`HIGH SCORE: ${localStorage.highScore}`, {
        size: 18,
      }),
      k.pos(k.width() / 2, stats.bottomY() + 40),
      k.anchor("center"),
    ]);

    // Event callback handlers
    k.onKeyPress("r", () => {
      game.storage = new GameStorage();
      game.storage.liquidity = MAX_LIQUIDITY;
      k.go("game");
    });
  });

  k.go("start");

  focus();
}
