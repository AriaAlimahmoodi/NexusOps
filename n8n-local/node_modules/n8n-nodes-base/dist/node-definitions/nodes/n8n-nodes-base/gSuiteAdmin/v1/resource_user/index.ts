/**
 * Google Workspace Admin - User Resource
 * Re-exports all operation types for this resource.
 */

import type { GSuiteAdminV1UserAddToGroupNode } from './operation_add_to_group';
import type { GSuiteAdminV1UserCreateNode } from './operation_create';
import type { GSuiteAdminV1UserDeleteNode } from './operation_delete';
import type { GSuiteAdminV1UserGetNode } from './operation_get';
import type { GSuiteAdminV1UserGetAllNode } from './operation_get_all';
import type { GSuiteAdminV1UserRemoveFromGroupNode } from './operation_remove_from_group';
import type { GSuiteAdminV1UserUpdateNode } from './operation_update';

export * from './operation_add_to_group';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_remove_from_group';
export * from './operation_update';

export type GSuiteAdminV1UserNode =
  | GSuiteAdminV1UserAddToGroupNode
  | GSuiteAdminV1UserCreateNode
  | GSuiteAdminV1UserDeleteNode
  | GSuiteAdminV1UserGetNode
  | GSuiteAdminV1UserGetAllNode
  | GSuiteAdminV1UserRemoveFromGroupNode
  | GSuiteAdminV1UserUpdateNode
  ;