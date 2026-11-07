/**
 * Pipedrive - Note Resource
 * Re-exports all operation types for this resource.
 */

import type { PipedriveV1NoteCreateNode } from './operation_create';
import type { PipedriveV1NoteDeleteNode } from './operation_delete';
import type { PipedriveV1NoteGetNode } from './operation_get';
import type { PipedriveV1NoteGetAllNode } from './operation_get_all';
import type { PipedriveV1NoteUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type PipedriveV1NoteNode =
  | PipedriveV1NoteCreateNode
  | PipedriveV1NoteDeleteNode
  | PipedriveV1NoteGetNode
  | PipedriveV1NoteGetAllNode
  | PipedriveV1NoteUpdateNode
  ;