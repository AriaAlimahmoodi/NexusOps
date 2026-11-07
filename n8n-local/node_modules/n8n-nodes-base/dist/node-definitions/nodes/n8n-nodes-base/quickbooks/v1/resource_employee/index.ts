/**
 * QuickBooks Online - Employee Resource
 * Re-exports all operation types for this resource.
 */

import type { QuickbooksV1EmployeeCreateNode } from './operation_create';
import type { QuickbooksV1EmployeeGetNode } from './operation_get';
import type { QuickbooksV1EmployeeGetAllNode } from './operation_get_all';
import type { QuickbooksV1EmployeeUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type QuickbooksV1EmployeeNode =
  | QuickbooksV1EmployeeCreateNode
  | QuickbooksV1EmployeeGetNode
  | QuickbooksV1EmployeeGetAllNode
  | QuickbooksV1EmployeeUpdateNode
  ;