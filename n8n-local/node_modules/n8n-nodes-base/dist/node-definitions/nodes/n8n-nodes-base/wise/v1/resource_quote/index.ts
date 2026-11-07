/**
 * Wise - Quote Resource
 * Re-exports all operation types for this resource.
 */

import type { WiseV1QuoteCreateNode } from './operation_create';
import type { WiseV1QuoteGetNode } from './operation_get';

export * from './operation_create';
export * from './operation_get';

export type WiseV1QuoteNode =
  | WiseV1QuoteCreateNode
  | WiseV1QuoteGetNode
  ;