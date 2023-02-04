export interface Settings {
  /**
   * The force with which the player will be pulled down.
   */
  GRAVITY: number;

  /**
   * How much the player jumps when the space bar is pressed.
   */
  JUMP_FORCE: number;

  /**
   * The velocity at which the player falls.
   */
  FALLING_VELOCITY: number;

  /**
   * The speed at which the items in the background move horizontally.
   */
  SPEED: number;

  /**
   * The minimum amount of space between the top and bottom bar
   */
  MIN_GAP: number;

  /**
   * The max amount of space between the top and bottom bar
   */
  MAX_GAP: number;

  /**
   * The max distance a gap can be from the gap before it.
   */
  DEVIATION: number;

  /**
   * The amount of ticks without new bars that the DEVIATION should be respected.
   * When this number of ticks have passed with no bars, the next gap can be
   * placed at any position, then the cooldown resets.
   */
  DEVIATION_COOLDOWN: number;

  /**
   * The number of seconds between events.
   */
  TIC_RATE: number;

  /**
   * The % chance of an event happening on each tic.
   */
  EVENT_CHANCE: number;

  /**
   * The % chance that each event has of being a trade (bars added).
   */
  ADD_TRADE_CHANCE: number;

  /**
   * The % chance that each event has of being added liquidity (gaps get bigger).
   */
  ADD_LIQUIDITY_CHANCE: number;

  /**
   * The % chance that each event has of being removed liquidity (gaps get smaller).
   */
  REMOVE_LIQUIDITY_CHANCE: number;
}
