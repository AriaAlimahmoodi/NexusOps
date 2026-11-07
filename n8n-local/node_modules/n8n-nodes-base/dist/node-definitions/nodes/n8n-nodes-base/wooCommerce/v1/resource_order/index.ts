/**
 * WooCommerce - Order Resource
 * Re-exports all operation types for this resource.
 */

import type { WooCommerceV1OrderCreateNode } from './operation_create';
import type { WooCommerceV1OrderDeleteNode } from './operation_delete';
import type { WooCommerceV1OrderGetNode } from './operation_get';
import type { WooCommerceV1OrderGetAllNode } from './operation_get_all';
import type { WooCommerceV1OrderUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type WooCommerceV1OrderNode =
  | WooCommerceV1OrderCreateNode
  | WooCommerceV1OrderDeleteNode
  | WooCommerceV1OrderGetNode
  | WooCommerceV1OrderGetAllNode
  | WooCommerceV1OrderUpdateNode
  ;