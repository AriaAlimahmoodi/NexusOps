/**
 * WooCommerce - Product Resource
 * Re-exports all operation types for this resource.
 */

import type { WooCommerceV1ProductCreateNode } from './operation_create';
import type { WooCommerceV1ProductDeleteNode } from './operation_delete';
import type { WooCommerceV1ProductGetNode } from './operation_get';
import type { WooCommerceV1ProductGetAllNode } from './operation_get_all';
import type { WooCommerceV1ProductUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type WooCommerceV1ProductNode =
  | WooCommerceV1ProductCreateNode
  | WooCommerceV1ProductDeleteNode
  | WooCommerceV1ProductGetNode
  | WooCommerceV1ProductGetAllNode
  | WooCommerceV1ProductUpdateNode
  ;