/**
 * QuickBooks Online - Customer Resource
 * Re-exports all operation types for this resource.
 */

import type { QuickbooksV1CustomerCreateNode } from './operation_create';
import type { QuickbooksV1CustomerGetNode } from './operation_get';
import type { QuickbooksV1CustomerGetAllNode } from './operation_get_all';
import type { QuickbooksV1CustomerUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type QuickbooksV1CustomerNode =
  | QuickbooksV1CustomerCreateNode
  | QuickbooksV1CustomerGetNode
  | QuickbooksV1CustomerGetAllNode
  | QuickbooksV1CustomerUpdateNode
  ;