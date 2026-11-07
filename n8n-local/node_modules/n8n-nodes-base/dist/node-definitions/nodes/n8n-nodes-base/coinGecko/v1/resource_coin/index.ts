/**
 * CoinGecko - Coin Resource
 * Re-exports all operation types for this resource.
 */

import type { CoinGeckoV1CoinCandlestickNode } from './operation_candlestick';
import type { CoinGeckoV1CoinGetNode } from './operation_get';
import type { CoinGeckoV1CoinGetAllNode } from './operation_get_all';
import type { CoinGeckoV1CoinHistoryNode } from './operation_history';
import type { CoinGeckoV1CoinMarketNode } from './operation_market';
import type { CoinGeckoV1CoinMarketChartNode } from './operation_market_chart';
import type { CoinGeckoV1CoinPriceNode } from './operation_price';
import type { CoinGeckoV1CoinTickerNode } from './operation_ticker';

export * from './operation_candlestick';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_history';
export * from './operation_market';
export * from './operation_market_chart';
export * from './operation_price';
export * from './operation_ticker';

export type CoinGeckoV1CoinNode =
  | CoinGeckoV1CoinCandlestickNode
  | CoinGeckoV1CoinGetNode
  | CoinGeckoV1CoinGetAllNode
  | CoinGeckoV1CoinHistoryNode
  | CoinGeckoV1CoinMarketNode
  | CoinGeckoV1CoinMarketChartNode
  | CoinGeckoV1CoinPriceNode
  | CoinGeckoV1CoinTickerNode
  ;