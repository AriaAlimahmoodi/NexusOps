/**
 * Odoo - Note Resource
 * Re-exports all operation types for this resource.
 */

import type { OdooV1NoteCreateNode } from './operation_create';
import type { OdooV1NoteDeleteNode } from './operation_delete';
import type { OdooV1NoteGetNode } from './operation_get';
import type { OdooV1NoteGetAllNode } from './operation_get_all';
import type { OdooV1NoteUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type OdooV1NoteNode =
  | OdooV1NoteCreateNode
  | OdooV1NoteDeleteNode
  | OdooV1NoteGetNode
  | OdooV1NoteGetAllNode
  | OdooV1NoteUpdateNode
  ;