/**
 * Wise - ExchangeRate Resource
 * Re-exports all operation types for this resource.
 */

import type { WiseV1ExchangeRateGetNode } from './operation_get';

export * from './operation_get';

export type WiseV1ExchangeRateNode = WiseV1ExchangeRateGetNode;