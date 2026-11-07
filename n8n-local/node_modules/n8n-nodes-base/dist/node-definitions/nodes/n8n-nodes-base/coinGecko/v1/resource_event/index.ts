/**
 * CoinGecko - Event Resource
 * Re-exports all operation types for this resource.
 */

import type { CoinGeckoV1EventGetAllNode } from './operation_get_all';

export * from './operation_get_all';

export type CoinGeckoV1EventNode = CoinGeckoV1EventGetAllNode;