/**
 * CoinGecko Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { CoinGeckoV1CoinNode } from './resource_coin';
import type { CoinGeckoV1EventNode } from './resource_event';

export * from './resource_coin';
export * from './resource_event';

export type CoinGeckoV1Node =
  | CoinGeckoV1CoinNode
  | CoinGeckoV1EventNode
  ;