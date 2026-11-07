/**
 * PayPal - Payout Resource
 * Re-exports all operation types for this resource.
 */

import type { PayPalV1PayoutCreateNode } from './operation_create';
import type { PayPalV1PayoutGetNode } from './operation_get';

export * from './operation_create';
export * from './operation_get';

export type PayPalV1PayoutNode =
  | PayPalV1PayoutCreateNode
  | PayPalV1PayoutGetNode
  ;