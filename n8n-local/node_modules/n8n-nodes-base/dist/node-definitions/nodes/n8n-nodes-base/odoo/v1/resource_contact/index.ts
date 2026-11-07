/**
 * Odoo - Contact Resource
 * Re-exports all operation types for this resource.
 */

import type { OdooV1ContactCreateNode } from './operation_create';
import type { OdooV1ContactDeleteNode } from './operation_delete';
import type { OdooV1ContactGetNode } from './operation_get';
import type { OdooV1ContactGetAllNode } from './operation_get_all';
import type { OdooV1ContactUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type OdooV1ContactNode =
  | OdooV1ContactCreateNode
  | OdooV1ContactDeleteNode
  | OdooV1ContactGetNode
  | OdooV1ContactGetAllNode
  | OdooV1ContactUpdateNode
  ;