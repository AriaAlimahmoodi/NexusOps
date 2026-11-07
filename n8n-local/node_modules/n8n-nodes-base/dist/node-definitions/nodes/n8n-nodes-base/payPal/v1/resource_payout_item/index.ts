/**
 * PayPal - PayoutItem Resource
 * Re-exports all operation types for this resource.
 */

import type { PayPalV1PayoutItemCancelNode } from './operation_cancel';
import type { PayPalV1PayoutItemGetNode } from './operation_get';

export * from './operation_cancel';
export * from './operation_get';

export type PayPalV1PayoutItemNode =
  | PayPalV1PayoutItemCancelNode
  | PayPalV1PayoutItemGetNode
  ;