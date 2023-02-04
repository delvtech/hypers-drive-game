import { Settings } from "./settings";
import { gcd, getRandomInt } from "./utils";

export type Event = "ADD_TRADE" | "ADD_LIQUIDITY" | "REMOVE_LIQUIDITY";

export class Events {
  private events: Event[];
  private settings: Settings;

  constructor(settings: Settings) {
    this.settings = settings;
    const { ADD_TRADE_CHANCE, ADD_LIQUIDITY_CHANCE, REMOVE_LIQUIDITY_CHANCE } =
      settings;

    const eventGCD =
      gcd(ADD_TRADE_CHANCE, ADD_LIQUIDITY_CHANCE, REMOVE_LIQUIDITY_CHANCE) || 1;

    // Create a list of events where the count of each event in relation to the
    // count of all events is proportional to the events' chances.
    this.events = [
      ...Array(ADD_TRADE_CHANCE / eventGCD).fill("ADD_TRADE"),
      ...Array(ADD_LIQUIDITY_CHANCE / eventGCD).fill("ADD_LIQUIDITY"),
      ...Array(REMOVE_LIQUIDITY_CHANCE / eventGCD).fill("REMOVE_LIQUIDITY"),
    ];
  }

  public generateGameEvent(): Event | undefined {
    console.log(this.settings.EVENT_CHANCE);
    const hasEvent = Math.random() < this.settings.EVENT_CHANCE / 100;
    if (!hasEvent) {
      return undefined;
    }
    const seed = getRandomInt(this.events.length);
    const event = this.events[seed];
    return event;
  }
}
