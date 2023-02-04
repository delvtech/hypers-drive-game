import kaboom, { TweenController } from "kaboom";
import { PatchedBodyCompOpt } from "./@types";
import { GameStorage } from "./GameStorage";
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
function initSettings(settings?: Partial<Settings>): Settings {
  return {
    GRAVITY: 1750,
    JUMP_FORCE: 600,
    FALLING_VELOCITY: 600,
    SPEED: 5,
    FINAL_SPEED: 15,
    TIME_TO_HYPERDRIVE: 20,
    MIN_GAP: 150,
    MAX_GAP: 400,
    DEVIATION: 90,
    DEVIATION_COOLDOWN: 1,
    TIC_RATE: .8,
    EVENT_CHANCE: 100,
    ADD_TRADE_CHANCE: 50,
    ADD_LIQUIDITY_CHANCE: 25,
    REMOVE_LIQUIDITY_CHANCE: 25,
    ...settings,
  };
}

const SPEED_OF_LIGHT = 671_000_000; // mph
const WARP_SPEED = SPEED_OF_LIGHT * 2;

export function startGame(gameSettings?: Partial<Settings>) {
  // Create kaboom instance
  const k = kaboom({
    background: [20, 20, 20],
  });

  // Calculate once and reuse
  const gameWidth = k.width();
  const gameHeight = k.height();

  // Add defaults to settings
  const settings = initSettings(gameSettings);
  const {
    GRAVITY,
    JUMP_FORCE,
    FALLING_VELOCITY,
    SPEED,
    FINAL_SPEED,
    TIME_TO_HYPERDRIVE,
    DEVIATION,
    DEVIATION_COOLDOWN,
    TIC_RATE,
  } = settings;

  // Initiate helper classes
  const storage = new GameStorage();
  const events = new Events(settings);

  // Initiate reusable object classes outside the scenes
  const eventFeed = new EventFeed(k);
  const trades = new Trades(k, storage, settings);

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
      k.pos(gameWidth / 2, 200),
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
      k.pos(gameWidth / 2, gameHeight / 2 + 100),
      k.anchor("center"),
      k.area(),
      k.body({
        isStatic: true,
      } as PatchedBodyCompOpt),
    ]);

    // Event callback handlers
    k.onKeyPress("enter", () => {
      k.go("game");
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // GAME
  //////////////////////////////////////////////////////////////////////////////
  k.scene("game", () => {
    // Reset storage to default state
    storage.reset();

    // Establish gravity
    k.setGravity(GRAVITY);

    // Reset and add the event feed
    k.add(eventFeed.container);
    eventFeed.clear();

    // Set a base player speed based on the SPEED setting. The player speed
    // represents the speed at which the player is moving through space. At the
    // base speed, only the background actually moves on the canvas.
    const basePlayerSpeed = SPEED * 100_000; // mph

    // Add a list of stats
    const stats = new Stats(
      k,
      [
        ["LIQUIDITY", storage.liquidity],
        ["LONGS", storage.longsVolume],
        ["SHORTS", storage.shortsVolume],
        ["VOLUME", storage.totalVolume],
        ["SCORE", storage.score],
        ["SPEED", commify(basePlayerSpeed)],
      ],
      {
        x: 20,
        y: 20,
      }
    );

    // Add boundaries. If the player hits a boundary, it's game over.
    k.add([
      "top",
      "obstacle",
      k.rect(gameWidth, 4),
      k.pos(0, 0),
      k.anchor("topleft"),
      k.area(),
      k.body({ isSolid: true, isStatic: true } as PatchedBodyCompOpt),
      k.color(255, 0, 0),
    ]);
    k.add([
      "bottom",
      "obstacle",
      k.rect(gameWidth, 4),
      k.pos(0, gameHeight),
      k.anchor("botleft"),
      k.area(),
      k.body({ isSolid: true, isStatic: true } as PatchedBodyCompOpt),
      k.color(255, 0, 0),
    ]);
    k.add([
      "left",
      "obstacle",
      k.rect(4, gameHeight),
      k.pos(0, 0),
      k.anchor("topleft"),
      k.area(),
      k.body({ isSolid: true, isStatic: true } as PatchedBodyCompOpt),
      k.color(255, 0, 0),
    ]);

    // Add the blastoff point. When the player reaches the blastoff point, they
    // engage hyperdrive and fly off screen at light speed.
    const blastoff = k.add([
      "blastoff",
      k.rect(0, gameHeight),
      k.pos(gameWidth - 50, 0),
      k.anchor("topright"),
      k.area(),
    ]);

    // Add the player and define it's starting x position
    const startingPlayerX = gameWidth / 5;
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

    // Jump control which increases the score and shows a "+fees" message.
    const jumpControl = k.onKeyPress("space", () => {
      player.jump(JUMP_FORCE);
      const feesText = k.add([
        k.text("+Fees", {
          size: 24,
        }),
        k.pos(gameWidth - 100, 100),
        k.anchor("center"),
      ]);
      storage.score = storage.score + 10;
      stats.update("SCORE", storage.score);
      k.wait(0.5, () => {
        k.destroy(feesText);
      });
    });

    // Update the speed every 200 ms.
    k.loop(0.2, () => {
      stats.update("SPEED", formatSpeed(currentPlayerSpeed));
    });

    // Track the number of ticks without a trade event.
    let ticksWithoutTrades = DEVIATION_COOLDOWN;

    // Event loop
    const eventController = k.loop(TIC_RATE, () => {
      const event = events.generateGameEvent();
      const eventAmount = randNum(100, storage.liquidity);

      switch (event) {
        case "ADD_TRADE":
          const type = Math.random() > 0.5 ? "LONG" : "SHORT";

          if (type === "LONG") {
            storage.addLong(eventAmount);
            stats.update("LONGS", storage.longsVolume);
          } else {
            storage.addShort(eventAmount);
            stats.update("SHORTS", storage.shortsVolume);
          }
          stats.update("VOLUME", storage.totalVolume);

          trades.add(
            eventAmount,
            type,
            ticksWithoutTrades ? DEVIATION : undefined
          );
          eventFeed.add(
            `${type === "LONG" ? "Long" : "Short"} added: ${eventAmount}`
          );

          // reset the deviation cooldown
          ticksWithoutTrades = DEVIATION_COOLDOWN;
          return;

        case "ADD_LIQUIDITY":
          storage.addLiquidity(eventAmount);
          stats.update("LIQUIDITY", storage.liquidity);
          eventFeed.add(`+${eventAmount} liquidity`);
          ticksWithoutTrades = Math.max(0, ticksWithoutTrades - 1);
          return;

        case "REMOVE_LIQUIDITY":
          storage.removeLiquidity(eventAmount);
          stats.update("LIQUIDITY", storage.liquidity);
          eventFeed.add(`-${eventAmount} liquidity`);
          ticksWithoutTrades = Math.max(0, ticksWithoutTrades - 1);
      }
    });

    // Prep variables for tweening.
    const finalPlayerX = gameWidth + 100;
    let speedTween: TweenController;
    let speedStatTween: TweenController;
    let playerSpeedTween: TweenController;
    let currentPlayerSpeed = basePlayerSpeed;

    // Tween speeds
    function startTweening() {
      // Derive the duration of the tween from the distance between the player's
      // current and final position. The closer the player is to the final
      // position, the less time it takes to speed up.
      const duration = scale(
        player.pos.x,
        startingPlayerX,
        finalPlayerX,
        TIME_TO_HYPERDRIVE,
        0
      );

      // Establish a speed the player will reach before engaging hyperdrive.
      const finalPlayerSpeed = 10_000_000; // mph

      // Tween the speed setting to affect the movement of background objects.
      speedTween = k.tween(
        SPEED,
        FINAL_SPEED,
        duration,
        (speed) => {
          settings.SPEED = speed;
        },
        k.easings.easeInCubic
      );

      // Tween the speed stat.
      speedStatTween = k.tween(
        basePlayerSpeed,
        finalPlayerSpeed,
        duration,
        (speed) => {
          currentPlayerSpeed = speed;
          storage.topSpeed = Math.max(speed, storage.topSpeed);
        },
        k.easings.easeInCubic
      );

      // Tween the player speed to affect the player's movement.
      playerSpeedTween = k.tween(
        player.pos.x,
        finalPlayerX,
        duration,
        (x) => {
          player.pos.x = x;
        },
        k.easings.easeInCubic
      );
    }

    // Start tweening immediately
    startTweening();

    // Stop tweening when the player hits a bar.
    player.onCollide("bar", () => {
      playerSpeedTween.cancel();
      speedStatTween.cancel();
      speedTween.cancel();
      stats.update("SPEED", formatSpeed(basePlayerSpeed));
    });

    // Start tweening again after the play clears the bar.
    player.onCollideEnd("bar", () => {
      startTweening();
    });

    // End the game when the player hits an obstacle.
    player.onCollide("obstacle", () => {
      k.go("gameover");
    });

    // Engage hyperdrive when the player hits the blastoff point.
    player.onCollide("blastoff", () => {
      // Stop tweening
      speedTween.cancel();
      playerSpeedTween.cancel();
      speedStatTween.cancel();

      // Stop the event loop
      eventController.cancel();

      // Destroy the blastoff point to allow the player to pass it.
      blastoff.destroy();

      // Stop any current animations the player is doing (e.g., jumping).
      player.stop();

      // Turn off the jump control.
      jumpControl.cancel();

      // Remove the player's gravity to keep it from falling after the jump
      // control is turned off.
      player.gravityScale = 0;

      // Set the top speed to FTL for hyperspace.
      storage.topSpeed = WARP_SPEED;

      // Make the player move back slightly before suddenly blasting off.
      playerSpeedTween = k.tween(
        player.pos.x,
        finalPlayerX + 100,
        0.4,
        (x) => (player.pos.x = x),
        BezierEasing(0.6, -1, 0.8, -0.3)
      );

      k.wait(0.2, () => {
        stats.update("SPEED", `${formatSpeed(WARP_SPEED)} mph`);
      });

      // End the game
      k.wait(1, () => k.go("gameover"));
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // GAME OVER, MAN
  //////////////////////////////////////////////////////////////////////////////
  k.scene("gameover", () => {
    k.add([k.text("Game over!"), k.pos(gameWidth / 2, 50), k.anchor("center")]);
    k.add([
      k.text("Press ENTER to restart", {
        size: 20,
      }),
      k.pos(gameWidth / 2, 250),
      k.anchor("center"),
    ]);

    const highScore = localStorage.highScore || 0;
    if (storage.score > highScore) {
      localStorage.highScore = storage.score;
    }

    const stats = new Stats(
      k,
      [
        ["VOLUME", storage.totalVolume],
        ["SCORE", storage.score],
        ["TOP SPEED", formatSpeed(storage.topSpeed)],
      ],
      {
        alignment: "center",
        x: gameWidth / 2,
        y: 270,
      }
    );

    k.add([
      k.text(`HIGH SCORE: ${localStorage.highScore}`, {
        size: 18,
      }),
      k.pos(gameWidth / 2, stats.bottomY() + 40),
      k.anchor("center"),
    ]);

    // Event callback handlers
    k.onKeyPress("enter", () => {
      k.go("game");
    });
  });

  k.go("start");

  focus();
}

function formatSpeed(speed: number) {
  return speed === WARP_SPEED ? `Warp Speed!` : `${commify(speed, 0)} mph`;
}
