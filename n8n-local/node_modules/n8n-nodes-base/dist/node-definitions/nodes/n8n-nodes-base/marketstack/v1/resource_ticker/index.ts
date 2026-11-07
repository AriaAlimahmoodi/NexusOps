/**
 * Marketstack - Ticker Resource
 * Re-exports all operation types for this resource.
 */

import type { MarketstackV1TickerGetNode } from './operation_get';

export * from './operation_get';

export type MarketstackV1TickerNode = MarketstackV1TickerGetNode;