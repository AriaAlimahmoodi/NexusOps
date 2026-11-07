/**
 * Keap - Company Resource
 * Re-exports all operation types for this resource.
 */

import type { KeapV1CompanyCreateNode } from './operation_create';
import type { KeapV1CompanyGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_get_all';

export type KeapV1CompanyNode =
  | KeapV1CompanyCreateNode
  | KeapV1CompanyGetAllNode
  ;