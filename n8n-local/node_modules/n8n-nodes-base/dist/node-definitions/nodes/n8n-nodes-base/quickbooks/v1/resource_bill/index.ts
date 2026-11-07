/**
 * QuickBooks Online - Bill Resource
 * Re-exports all operation types for this resource.
 */

import type { QuickbooksV1BillCreateNode } from './operation_create';
import type { QuickbooksV1BillDeleteNode } from './operation_delete';
import type { QuickbooksV1BillGetNode } from './operation_get';
import type { QuickbooksV1BillGetAllNode } from './operation_get_all';
import type { QuickbooksV1BillUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type QuickbooksV1BillNode =
  | QuickbooksV1BillCreateNode
  | QuickbooksV1BillDeleteNode
  | QuickbooksV1BillGetNode
  | QuickbooksV1BillGetAllNode
  | QuickbooksV1BillUpdateNode
  ;