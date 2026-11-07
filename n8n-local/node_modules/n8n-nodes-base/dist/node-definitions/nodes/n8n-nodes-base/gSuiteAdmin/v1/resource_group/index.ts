/**
 * Google Workspace Admin - Group Resource
 * Re-exports all operation types for this resource.
 */

import type { GSuiteAdminV1GroupCreateNode } from './operation_create';
import type { GSuiteAdminV1GroupDeleteNode } from './operation_delete';
import type { GSuiteAdminV1GroupGetNode } from './operation_get';
import type { GSuiteAdminV1GroupGetAllNode } from './operation_get_all';
import type { GSuiteAdminV1GroupUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type GSuiteAdminV1GroupNode =
  | GSuiteAdminV1GroupCreateNode
  | GSuiteAdminV1GroupDeleteNode
  | GSuiteAdminV1GroupGetNode
  | GSuiteAdminV1GroupGetAllNode
  | GSuiteAdminV1GroupUpdateNode
  ;