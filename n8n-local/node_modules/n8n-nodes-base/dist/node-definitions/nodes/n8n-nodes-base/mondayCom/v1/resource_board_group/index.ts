/**
 * Monday.com - BoardGroup Resource
 * Re-exports all operation types for this resource.
 */

import type { MondayComV1BoardGroupCreateNode } from './operation_create';
import type { MondayComV1BoardGroupDeleteNode } from './operation_delete';
import type { MondayComV1BoardGroupGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get_all';

export type MondayComV1BoardGroupNode =
  | MondayComV1BoardGroupCreateNode
  | MondayComV1BoardGroupDeleteNode
  | MondayComV1BoardGroupGetAllNode
  ;