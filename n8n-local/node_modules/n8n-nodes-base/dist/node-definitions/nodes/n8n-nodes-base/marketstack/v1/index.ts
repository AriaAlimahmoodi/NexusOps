/**
 * Marketstack Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MarketstackV1EndOfDayDataNode } from './resource_end_of_day_data';
import type { MarketstackV1ExchangeNode } from './resource_exchange';
import type { MarketstackV1TickerNode } from './resource_ticker';

export * from './resource_end_of_day_data';
export * from './resource_exchange';
export * from './resource_ticker';

export type MarketstackV1Node =
  | MarketstackV1EndOfDayDataNode
  | MarketstackV1ExchangeNode
  | MarketstackV1TickerNode
  ;