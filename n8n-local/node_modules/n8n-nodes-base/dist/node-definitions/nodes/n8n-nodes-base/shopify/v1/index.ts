/**
 * Shopify Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { ShopifyV1OrderNode } from './resource_order';
import type { ShopifyV1ProductNode } from './resource_product';

export * from './resource_order';
export * from './resource_product';

export type ShopifyV1Node =
  | ShopifyV1OrderNode
  | ShopifyV1ProductNode
  ;