/**
 * Shopify - Product Resource
 * Re-exports all operation types for this resource.
 */

import type { ShopifyV1ProductCreateNode } from './operation_create';
import type { ShopifyV1ProductDeleteNode } from './operation_delete';
import type { ShopifyV1ProductGetNode } from './operation_get';
import type { ShopifyV1ProductGetAllNode } from './operation_get_all';
import type { ShopifyV1ProductUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type ShopifyV1ProductNode =
  | ShopifyV1ProductCreateNode
  | ShopifyV1ProductDeleteNode
  | ShopifyV1ProductGetNode
  | ShopifyV1ProductGetAllNode
  | ShopifyV1ProductUpdateNode
  ;