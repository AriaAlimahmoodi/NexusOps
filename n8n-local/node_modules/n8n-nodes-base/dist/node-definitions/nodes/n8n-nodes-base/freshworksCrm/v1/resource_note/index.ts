/**
 * Freshworks CRM - Note Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshworksCrmV1NoteCreateNode } from './operation_create';
import type { FreshworksCrmV1NoteDeleteNode } from './operation_delete';
import type { FreshworksCrmV1NoteUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_update';

export type FreshworksCrmV1NoteNode =
  | FreshworksCrmV1NoteCreateNode
  | FreshworksCrmV1NoteDeleteNode
  | FreshworksCrmV1NoteUpdateNode
  ;