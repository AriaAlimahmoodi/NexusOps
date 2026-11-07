/**
 * Strapi - Entry Resource
 * Re-exports all operation types for this resource.
 */

import type { StrapiV1EntryCreateNode } from './operation_create';
import type { StrapiV1EntryDeleteNode } from './operation_delete';
import type { StrapiV1EntryGetNode } from './operation_get';
import type { StrapiV1EntryGetAllNode } from './operation_get_all';
import type { StrapiV1EntryUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type StrapiV1EntryNode =
  | StrapiV1EntryCreateNode
  | StrapiV1EntryDeleteNode
  | StrapiV1EntryGetNode
  | StrapiV1EntryGetAllNode
  | StrapiV1EntryUpdateNode
  ;