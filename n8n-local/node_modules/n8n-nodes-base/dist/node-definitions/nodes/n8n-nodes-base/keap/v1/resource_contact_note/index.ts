/**
 * Keap - ContactNote Resource
 * Re-exports all operation types for this resource.
 */

import type { KeapV1ContactNoteCreateNode } from './operation_create';
import type { KeapV1ContactNoteDeleteNode } from './operation_delete';
import type { KeapV1ContactNoteGetNode } from './operation_get';
import type { KeapV1ContactNoteGetAllNode } from './operation_get_all';
import type { KeapV1ContactNoteUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type KeapV1ContactNoteNode =
  | KeapV1ContactNoteCreateNode
  | KeapV1ContactNoteDeleteNode
  | KeapV1ContactNoteGetNode
  | KeapV1ContactNoteGetAllNode
  | KeapV1ContactNoteUpdateNode
  ;