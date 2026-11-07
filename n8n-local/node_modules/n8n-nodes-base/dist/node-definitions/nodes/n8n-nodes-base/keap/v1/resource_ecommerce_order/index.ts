/**
 * Keap - EcommerceOrder Resource
 * Re-exports all operation types for this resource.
 */

import type { KeapV1EcommerceOrderCreateNode } from './operation_create';
import type { KeapV1EcommerceOrderDeleteNode } from './operation_delete';
import type { KeapV1EcommerceOrderGetNode } from './operation_get';
import type { KeapV1EcommerceOrderGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type KeapV1EcommerceOrderNode =
  | KeapV1EcommerceOrderCreateNode
  | KeapV1EcommerceOrderDeleteNode
  | KeapV1EcommerceOrderGetNode
  | KeapV1EcommerceOrderGetAllNode
  ;