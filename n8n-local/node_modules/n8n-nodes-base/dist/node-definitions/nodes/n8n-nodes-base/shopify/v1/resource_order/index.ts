/**
 * Shopify - Order Resource
 * Re-exports all operation types for this resource.
 */

import type { ShopifyV1OrderCreateNode } from './operation_create';
import type { ShopifyV1OrderDeleteNode } from './operation_delete';
import type { ShopifyV1OrderGetNode } from './operation_get';
import type { ShopifyV1OrderGetAllNode } from './operation_get_all';
import type { ShopifyV1OrderUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type ShopifyV1OrderNode =
  | ShopifyV1OrderCreateNode
  | ShopifyV1OrderDeleteNode
  | ShopifyV1OrderGetNode
  | ShopifyV1OrderGetAllNode
  | ShopifyV1OrderUpdateNode
  ;