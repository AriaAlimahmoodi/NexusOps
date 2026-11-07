/**
 * PayPal Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { PayPalV1PayoutNode } from './resource_payout';
import type { PayPalV1PayoutItemNode } from './resource_payout_item';

export * from './resource_payout';
export * from './resource_payout_item';

export type PayPalV1Node =
  | PayPalV1PayoutNode
  | PayPalV1PayoutItemNode
  ;