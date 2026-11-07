/**
 * Monday.com - BoardColumn Resource
 * Re-exports all operation types for this resource.
 */

import type { MondayComV1BoardColumnCreateNode } from './operation_create';
import type { MondayComV1BoardColumnGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_get_all';

export type MondayComV1BoardColumnNode =
  | MondayComV1BoardColumnCreateNode
  | MondayComV1BoardColumnGetAllNode
  ;