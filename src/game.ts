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
import { AudioManager } from "./AudioManager";

/**
 * Add default settings to a partial settings object
 */
function initSettings(settings?: Partial<Settings>): Settings {
  return {
    GRAVITY: 1750,
    JUMP_FORCE: 550,
    FALLING_VELOCITY: 600,
    SPEED: 5,
    FINAL_SPEED: 15,
    TIME_TO_HYPERDRIVE: 20,
    MIN_GAP: 180,
    MAX_GAP: 400,
    DEVIATION: 90,
    DEVIATION_COOLDOWN: 1,
    TIC_RATE: 0.7,
    EVENT_CHANCE: 100,
    ADD_TRADE_CHANCE: 50,
    ADD_LIQUIDITY_CHANCE: 25,
    REMOVE_LIQUIDITY_CHANCE: 25,
    ...settings,
  };
}

export const Z = {
  stars: 0,
  bars: 5,
  player: 10,
  hud: 15,
};

const SPEED_OF_LIGHT = 186_000; // mi/s
const WARP_SPEED = SPEED_OF_LIGHT * 2;

export function startGame(gameSettings?: Partial<Settings>) {
  // Create kaboom instance
  const k = kaboom({
    background: [20, 22, 30],
    // play music outside of focus
    backgroundAudio: true,
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
  const audioManger = new AudioManager(k);
  const events = new Events(settings);

  // Initiate reusable object classes outside the scenes
  const eventFeed = new EventFeed(k);
  const trades = new Trades(k, storage, settings);

  // Load fonts
  k.loadFont("M23", "/m23.TTF");
  k.loadFont("HardDrive", "/hard-drive.ttf");

  // Load sprites
  k.loadSprite("player", "/car-driving.png", {
    sliceX: 3,
    anims: {
      drive: {
        from: 0,
        to: 2,
        loop: true,
        speed: 48,
      },
    },
  });
  k.loadSprite("bird", "/bird.png");
  k.loadSprite("ryanGosling", "/ryan_gosling_drive_movie_ascii_art.png");

  // Scenes

  //////////////////////////////////////////////////////////////////////////////
  // START
  //////////////////////////////////////////////////////////////////////////////

  k.scene("start", () => {
    // Generate random stars
    for (let i = 0; i < 100; i++) {
      const star = k.add([
        "star",
        k.circle(randNum(1, 2)),
        k.pos(randNum(0, gameWidth), randNum(0, gameHeight)),
        k.anchor("left"),
        k.color(255, 255, 255),
        k.opacity(randNum(2, 6) / 10),
        k.offscreen({ destroy: true }),
        k.z(Z.stars),
        k.stay(),
      ]);
      star.onUpdate(() => {
        star.pos.x -= randNum(0.2, 1);
      });
    }
    k.loop(0.5, () => {
      const star = k.add([
        "star",
        k.circle(randNum(1, 2)),
        k.pos(gameWidth, randNum(0, gameHeight)),
        k.anchor("left"),
        k.color(255, 255, 255),
        k.opacity(randNum(2, 6) / 10),
        k.offscreen({ destroy: true }),
        k.z(Z.stars),
        k.stay(),
      ]);
      star.onUpdate(() => {
        star.pos.x -= randNum(0.2, 1);
      });
    });

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

    audioManger.startMusic("StartMusic", {
      loop: true,
      volume: 0.01,
    });

    // Event callback handlers
    k.onKeyPress("enter", () => {
      k.get("star").forEach((star) => {
        star.onUpdate(() => {
          star.pos.x -= randNum(1, settings.SPEED * 1.5);
        });
      });
      k.go("game");
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // GAME
  //////////////////////////////////////////////////////////////////////////////
  k.scene("game", () => {
    audioManger.stopMusic("StartMusic");

    // Reset storage to default state
    storage.reset();

    // Establish gravity
    k.setGravity(GRAVITY);

    // Reset and add the event feed
    eventFeed.clear();
    k.add(eventFeed.container);

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
    // engage hyperdrive and fly off screen at FTL speeds.
    const blastoff = k.add([
      "blastoff",
      k.rect(0, gameHeight),
      k.pos(gameWidth - 50, 0),
      k.anchor("topright"),
      k.area(),
    ]);

    // Generate random stars
    k.loop(0.08, () => {
      const star = k.add([
        "star",
        k.circle(randNum(1, 2)),
        k.pos(gameWidth, randNum(0, gameHeight)),
        k.anchor("left"),
        k.color(255, 255, 255),
        k.opacity(randNum(1, 5) / 10),
        k.offscreen({ destroy: true }),
        k.z(Z.stars),
        k.stay(),
      ]);
      star.onUpdate(() => {
        star.pos.x -= randNum(settings.SPEED * 1.2, settings.SPEED * 1.5);
      });
    });

    // Add the player and define it's starting x position
    const startingPlayerX = gameWidth / 5;
    const player = k.add([
      k.sprite("player"),
      k.pos(startingPlayerX, 80),
      k.anchor("center"),
      k.area(),
      k.body({
        // @ts-ignore
        maxVel: FALLING_VELOCITY,
      }),
      k.z(Z.player),
    ]);
    player.play("drive");

    // Set a base player speed that represents the speed at which the player is
    // moving through space. At the base speed, only the background actually
    // moves on the canvas.
    const basePlayerSpeed = 125; // mi/s

    // Establish a speed the player will reach before engaging hyperdrive.
    const finalPlayerSpeed = 2_777; // mph

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

    let accelerateTween: TweenController;

    // Jump control which increases the score and shows a "+fees" message.
    const jumpControl = k.onKeyPress("space", () => {
      // Make the player jump upward
      player.jump(JUMP_FORCE);

      // Tween the angle of the car
      accelerateTween?.cancel();
      accelerateTween = k.tween(
        0,
        -10,
        0.15,
        (angle) => {
          // @ts-ignore
          player.angle = angle;
        },
        k.easings.easeOutSine
      );
      k.wait(0.15, () => {
        accelerateTween?.cancel();
        accelerateTween = k.tween(
          -10,
          0,
          0.25,
          (angle) => {
            // @ts-ignore
            player.angle = angle;
          },
          k.easings.easeInOutSine
        );
      });

      k.play("JumpSound", {
        volume: 0.01,
      });

      const feesText = k.add([
        k.text("+Fees", {
          size: 24,
        }),
        k.pos(gameWidth - 100, 100),
        k.anchor("center"),
      ]);

      // increase score and update stat object
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
    let noTradeTickCountdown = DEVIATION_COOLDOWN;

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
            noTradeTickCountdown ? DEVIATION : undefined
          );
          eventFeed.add(
            `${type === "LONG" ? "Long" : "Short"} added: ${eventAmount}`
          );

          // reset the deviation cooldown
          noTradeTickCountdown = DEVIATION_COOLDOWN;
          return;

        case "ADD_LIQUIDITY":
          storage.addLiquidity(eventAmount);
          stats.update("LIQUIDITY", storage.liquidity);
          eventFeed.add(`+${eventAmount} liquidity`);
          noTradeTickCountdown = Math.max(0, noTradeTickCountdown - 1);
          return;

        case "REMOVE_LIQUIDITY":
          storage.removeLiquidity(eventAmount);
          stats.update("LIQUIDITY", storage.liquidity);
          eventFeed.add(`-${eventAmount} liquidity`);
          noTradeTickCountdown = Math.max(0, noTradeTickCountdown - 1);
      }
    });

    // Prep variables for tweening.
    const finalPlayerX = gameWidth + 100;
    let speedTween: TweenController;
    let speedStatTween: TweenController;
    let playerSpeedTween: TweenController;
    let currentPlayerSpeed = basePlayerSpeed;

    let isTweening = false;

    // Tween speeds
    function startTweening() {
      if (isTweening) {
        return;
      }
      isTweening = true;

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

      // Tween the SPEED setting to affect the movement of background objects.
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
      // });
    }

    // Start tweening immediately
    startTweening();

    // keep track of when blastoff starts
    let isBlastingOff = false;

    // Stop tweening when the player hits a bar.
    player.onCollide("bar", () => {
      if (isBlastingOff) {
        return;
      }
      playerSpeedTween.cancel();
      speedStatTween.cancel();
      speedTween.cancel();
      isTweening = false;
      settings.SPEED = SPEED;
      stats.update("SPEED", formatSpeed(basePlayerSpeed));
    });

    // Start tweening again after the player clears the bar.
    player.onCollideEnd("bar", () => {
      startTweening();
    });

    // End the game when the player hits an obstacle.
    player.onCollide("obstacle", () => {
      // Ignore the obstacles when blasting off
      if (isBlastingOff) {
        return;
      }
      k.go("gameover");
    });

    // Engage hyperdrive when the player hits the blastoff point.
    player.onCollide("blastoff", () => {
      isBlastingOff = true;

      k.play("HyperdriveSound", {
        volume: 0.1,
      });

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

      k.setGravity(0);

      // Set the top speed to FTL for hyperspace.
      storage.topSpeed = WARP_SPEED;
      // stats.update("SPEED", `${formatSpeed(WARP_SPEED)}!!!`);
      currentPlayerSpeed = WARP_SPEED;

      k.loop(0.01, () => {
        const warpLine = k.add([
          "warpLine",
          k.rect(randNum(0, 5), 10),
          k.pos(gameWidth, randNum(0, gameHeight)),
          k.anchor("left"),
          k.color(255, 255, 255),
          k.opacity(randNum(2, 6) / 10),
          k.offscreen({ destroy: true }),
          k.z(Z.stars),
        ]);
        warpLine.onUpdate(() => {
          warpLine.pos.x -= randNum(5, 10);
        });
      });

      // Tween the SPEED setting to make background objects speed up.
      k.tween(
        settings.SPEED,
        settings.SPEED * 10,
        1,
        (speed) => {
          settings.SPEED = speed;
        },
        k.easings.easeInCubic
      );

      // Make the player move back slightly before suddenly blasting off.
      k.tween(
        player.pos.x,
        player.pos.x - 1000,
        3,
        (x) => (player.pos.x = x),
        k.easings.easeInOutCubic
      );

      k.wait(4, () => {
        k.tween(
          player.pos.x,
          finalPlayerX + 1000,
          0.2,
          (x) => (player.pos.x = x),
          k.easings.easeInCubic
        );
      });

      // End the game
      k.wait(6, () => k.go("gameover"));
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

    const highScoreObj = k.add([
      k.text(`HIGH SCORE: ${localStorage.highScore}`, {
        size: 18,
      }),
      k.pos(gameWidth / 2, stats.bottomY() + 40),
      k.anchor("center"),
    ]);

    k.add([
      k.text("Press ESC to return to the start menu", {
        size: 20,
      }),
      k.pos(gameWidth / 2, highScoreObj.pos.y + 100),
      k.anchor("center"),
    ]);

    // Event callback handlers
    k.onKeyPress("enter", () => {
      k.go("game");
    });
    k.onKeyPress("escape", () => {
      k.go("start");
    });
  });

  k.go("start");

  focus();
}

function formatSpeed(speed: number) {
  return speed === WARP_SPEED ? `Warp Speed!` : `${commify(speed, 0)} mi/s`;
}
