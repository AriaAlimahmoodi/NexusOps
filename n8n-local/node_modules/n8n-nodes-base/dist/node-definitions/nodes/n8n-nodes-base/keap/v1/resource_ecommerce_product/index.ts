/**
 * Keap - EcommerceProduct Resource
 * Re-exports all operation types for this resource.
 */

import type { KeapV1EcommerceProductCreateNode } from './operation_create';
import type { KeapV1EcommerceProductDeleteNode } from './operation_delete';
import type { KeapV1EcommerceProductGetNode } from './operation_get';
import type { KeapV1EcommerceProductGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type KeapV1EcommerceProductNode =
  | KeapV1EcommerceProductCreateNode
  | KeapV1EcommerceProductDeleteNode
  | KeapV1EcommerceProductGetNode
  | KeapV1EcommerceProductGetAllNode
  ;