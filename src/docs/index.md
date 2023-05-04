# Hyperdrive

Hyperdrive is the next research leap from the Element team on variable and fixed rate primitives. _No preset expiration dates, no fragmented liquidity, and no LP rollovers, aka everlasting liquidity._

## A New Way To Trade Rates

The hyperdrive AMM introduces a market sentiment indicator (MSI) for DeFi interest rates. Almost all DeFi interest rates are constantly changing ([sometimes by the block](https://github.com/delvtech/robrox/pull/6)). In order to gauge market sentiment, a balanced system of longs and shorts must exist between fixed and variable rates, in order to capture the wisdom of the crowd. Hyperdrive provides this. The fixed rate represented in Hyperdrive is the market sentiment indicator.

Hyperdrive lets users short or long the sentiment indicator. If a user thinks the sentiment indicator is too high, they'll go long because they like the fixed rate. If they think it is too low, they go short because they like the variable rate. Which side are you on?

|        ![](https://i.imgur.com/Bz1Ug6R.png)        |
| :------------------------------------------------: |
| **Economists, they've made total fools out of us** |

## Overview

In the sections below, we describe what Hyperdrive brings to the DeFi space:

1. [Terms on Demand](#1-terms-on-demand)
2. Consolidated and Everlasting liquidity
3. Longs and Shorts to Determine Market Sentiment
4. Trading Strategies
   - LPs Benefit From Volatility Harvesting
   - Interest Rate Arbitrage
   - Fixed Rate Rorrow
   - Multiplied Variable Rate Exposure
   - Spread Borrow

### 1. Terms On Demand

Hyperdrive removes the concept of preset start and end dates. Rates are traded for a fixed period of time, known as the [term](<https://en.wikipedia.org/wiki/Bond_(finance)#The_term_of_the_bond>). When a user chooses to trade on variable or fixed rates, the user starts their term, e.g. 6 months, on demand.

The fixed rate in these terms is the market sentiment indicator reflecting the market's expected average variable rates over the term length on an underlying yield source, like stEth.

Previously, a user would be forced to pick a variable or fixed rate market with a term set to a specific maturity date. This trends towards suboptimal LP fees and UX. For example, users likely do not have a lot of demand to trade on terms that have only 1 week remaining, because gains are lower. LPs tend to be incentivized to be in new terms, since fees are higher.

### 2. Consolidated and Everlasting Liquidity

Previously, 6 month terms were deployed in a staggered manner. These staggered deployments lead to fragmented liquidity and required LPs to actively manage their position, rolling over their capital between different terms.

In Hyperdrive, terms are created on demand using the liquidity from a single pool. As a result, liquidity provision is no longer tied to a specific term. When a user provides liquidity, they do so for all future terms created from the pool. Their liquidity has no expiration. It is everlasting. The LP continues to collect fees on each trade as well as variable interest on unallocated capital, for as long as they wish.

### 3. Longs and Shorts to Determine Market Sentiment

The Hyperdrive AMM gives users the ability to open both long and short positions on the market sentiment indicator, aka fixed rate.

- When a user believes market sentiment is **too high**, they prefer to **long** the fixed rate. They believe the fixed rate is **higher** than their expectation of the variable rate for the term. This drives the fixed rate down.
- When a user believes market sentiment is **too low**, they prefer to **short** the fixed rate. They believe the fixed rate is **lower** than their expectation of the variable rate for the term. This drives the fixed rate up.

Since Hyperdrive facilitates both longs and shorts, it fully captures market sentiment, letting the fixed rate reflect the market's beliefs.

Hyperdrive's approach doesn't require the use of funding rates or liquidation engines to remain solvent through volatile market conditions. Instead, all of the accounting and mathematics required to keep the system safe are baked into the AMM itself.

This creates a symmetrical market where users can drive the rates up and down as market sentiment changes, just like a game of flappy bird.

![Flappy Bird](https://i.imgur.com/W9QVOam.png)

### 4. Trading Strategies

#### A. LPs Benefit From Volatility Harvesting

> Every user trade is met with an equal and opposite LP trade
>
> - Sir Isaac Newton

For every trade that happens on the AMM, the LP takes on the other side. This means the LP will generally hold a position that is opposite to the market sentiment. Whether the market is right or wrong, all trades pay fees to the LP holders.

Rates volatility attracts more trading, more fees, and more delusional activity from traders.

No matter the volatility, at the end of a term, the average variable rate for that term is a single number. Any trading that moves the fixed rate away from this number represents an inaccurate market prediction, which the LP takes the other side of, thereby profiting.

#### B. Interest Rate Arbitrage

Hyperdrive's long/short mechanism allows for arbitrageurs to reap the benefit of volatile changes in interest rates.

|                                                                                                       LOG(DSR_RATE)                                                                                                        |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                                                            ![](https://i.imgur.com/rCmFheb.png)                                                                                            |
| `chifra state --call "0x197E90f9FAD81970bA7976f33CbD77088E5D7cf7 \| dsr()(uint)" --file blocks.txt --no_header \| awk '$5 ~ /^[1-9]/ { printf "%.0f,%f\n", $1, ((($5 / 10^27 )^(60*60*24*365)-1) * 100)}' > dsr_rates.txt` |
|                                                                       `jp < /code/trueblocks-sdk/python/dsr_rates_log.txt -input csv -xy '[*][1,3]'`                                                                       |

As can be seen in this graph generated by [trueblocks](https://trueblocks.io/), MakerDAO's DSR follows a stepwise function. As the Stability Fee is changed, this allows for traders to quickly arbitrage the market sentiment to converge on the new rate.

#### C. Fixed Rate Borrow

On lending protocols, borrowers pay a variable rate to lenders, representing a significant source of uncertainty in DeFi trading strategies. The trader suffers from having to pay a higher funding cost when rates rise.

To manage this risk, they can open a short position on Hyperdrive, which inherently gives them exposure to the variable rate for a fixed cost.

Users historically have a significantly higher threshold on the borrow rate they are willing to pay if they can secure a fixed vs. variable position. This is seen on the AAVE fixed rate market. This creates a larger spread between fixed and variable rates, introducing arbitrage opportunities.

#### D. Multiplied Variable Rate Exposure

Hyperdrive allows users to get as much variable exposure as they want by letting them borrow additional capital from the AMM at the current fixed rate and use it to open a short position.

By opening a short position, the user is buying the variable yield from the market's deployed assets. Users can buy interest on a higher amount of capital than they provide. There are no liquidations, they just provide a maximum loss to ensure protocol safety. Unlike every other market, a Hyperdrive short does not face the possibility of unlimited loss.

Because this position earns multiplied variable interest, it provides a stabilizing force encouraging the fixed rate to converge upon changes in the variable rate, otherwise Interest Rate Arbitrage exists.

#### E. Spread Borrow

Hyperdrive users can get multiplied fixed rate exposure and profit from the spread between an asset's borrow rate and the current market sentiment or fixed rate.

Long positions on Hyperdrive have a guaranteed fixed rate, which makes them powerful collateral assets, as they allow high loan-to-value borrowing.

If a lending platform like MakerDAO charges a 1% rate to borrow DAI against this collateral and market sentiment on Hyperdrive reflects a 3% rate, users can profit from this spread by opening a long position on Hyperdrive, collateralizing this position, borrowing DAI against it, and repeating this process recursively until the rates converge.

## Technical Teaser

| ![](https://i.imgur.com/aphOgTj.png) |
| :----------------------------------: |
|       _Shut up and Hyperdrive_       |

Hyperdrive is a natural extension of the concepts introduced in the first iteration of the [Element Protocol](https://paper.element.fi/) which implemented a customised version of the constant power sum curve invariant from the foundational [YieldSpace](https://yield.is/YieldSpace.pdf) paper. Optimised for fixed rate trading, this curve's main benefit is curvature that adjusts with the passage of time.

Changing curvature of trading curves can be dangerous for protocol safety, as evidenced by the [Curve hack](https://medium.com/@peter_4205/curve-vulnerability-report-a1d7630140ec). Similar attacks are possible in a multi-curvature multi-term universe. The Hyperdrive solution does away with multiple curves, instead reflecting the passage of time in each position, an approach we're deeming "flat + curve". Each position is the sum of matured and unmatured portions.
