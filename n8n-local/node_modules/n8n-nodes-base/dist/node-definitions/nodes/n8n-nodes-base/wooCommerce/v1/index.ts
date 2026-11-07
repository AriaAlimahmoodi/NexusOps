/**
 * WooCommerce Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { WooCommerceV1CustomerNode } from './resource_customer';
import type { WooCommerceV1OrderNode } from './resource_order';
import type { WooCommerceV1ProductNode } from './resource_product';

export * from './resource_customer';
export * from './resource_order';
export * from './resource_product';

export type WooCommerceV1Node =
  | WooCommerceV1CustomerNode
  | WooCommerceV1OrderNode
  | WooCommerceV1ProductNode
  ;