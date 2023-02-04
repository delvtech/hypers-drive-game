import { Settings } from "./settings";
import { gcd, getRandomInt } from "./utils";

export type Event = "ADD_TRADE" | "ADD_LIQUIDITY" | "REMOVE_LIQUIDITY";

export class Events {
  private events: Event[];
  private eventChance: number;

  constructor({
    ADD_TRADE_CHANCE,
    ADD_LIQUIDITY_CHANCE,
    REMOVE_LIQUIDITY_CHANCE,
    EVENT_CHANCE,
  }: Settings) {
    this.eventChance = EVENT_CHANCE;

    const eventGCD = gcd(
      ADD_TRADE_CHANCE,
      ADD_LIQUIDITY_CHANCE,
      REMOVE_LIQUIDITY_CHANCE
    );

    // Create a list of events where the count of each event in relation to the
    // count of all events is proportional to the events' chances.
    this.events = [
      ...Array(ADD_TRADE_CHANCE / eventGCD).fill("ADD_TRADE"),
      ...Array(ADD_LIQUIDITY_CHANCE / eventGCD).fill("ADD_LIQUIDITY"),
      ...Array(REMOVE_LIQUIDITY_CHANCE / eventGCD).fill("REMOVE_LIQUIDITY"),
    ];
  }

  public generateGameEvent(): Event | undefined {
    const hasEvent = Math.random() < this.eventChance / 100;
    if (!hasEvent) {
      return undefined;
    }
    const seed = getRandomInt(this.events.length);
    const event = this.events[seed];
    return event;
  }
}
