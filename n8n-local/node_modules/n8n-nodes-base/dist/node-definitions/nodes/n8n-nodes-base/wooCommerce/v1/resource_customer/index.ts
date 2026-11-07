/**
 * WooCommerce - Customer Resource
 * Re-exports all operation types for this resource.
 */

import type { WooCommerceV1CustomerCreateNode } from './operation_create';
import type { WooCommerceV1CustomerDeleteNode } from './operation_delete';
import type { WooCommerceV1CustomerGetNode } from './operation_get';
import type { WooCommerceV1CustomerGetAllNode } from './operation_get_all';
import type { WooCommerceV1CustomerUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type WooCommerceV1CustomerNode =
  | WooCommerceV1CustomerCreateNode
  | WooCommerceV1CustomerDeleteNode
  | WooCommerceV1CustomerGetNode
  | WooCommerceV1CustomerGetAllNode
  | WooCommerceV1CustomerUpdateNode
  ;