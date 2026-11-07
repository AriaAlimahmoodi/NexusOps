/**
 * Odoo - Custom Resource
 * Re-exports all operation types for this resource.
 */

import type { OdooV1CustomCreateNode } from './operation_create';
import type { OdooV1CustomDeleteNode } from './operation_delete';
import type { OdooV1CustomGetNode } from './operation_get';
import type { OdooV1CustomGetAllNode } from './operation_get_all';
import type { OdooV1CustomUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type OdooV1CustomNode =
  | OdooV1CustomCreateNode
  | OdooV1CustomDeleteNode
  | OdooV1CustomGetNode
  | OdooV1CustomGetAllNode
  | OdooV1CustomUpdateNode
  ;