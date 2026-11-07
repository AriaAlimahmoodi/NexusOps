/**
 * Keap - ContactTag Resource
 * Re-exports all operation types for this resource.
 */

import type { KeapV1ContactTagCreateNode } from './operation_create';
import type { KeapV1ContactTagDeleteNode } from './operation_delete';
import type { KeapV1ContactTagGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get_all';

export type KeapV1ContactTagNode =
  | KeapV1ContactTagCreateNode
  | KeapV1ContactTagDeleteNode
  | KeapV1ContactTagGetAllNode
  ;