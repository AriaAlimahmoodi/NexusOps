/**
 * Supabase - Row Resource
 * Re-exports all operation types for this resource.
 */

import type { SupabaseV1RowCreateNode } from './operation_create';
import type { SupabaseV1RowDeleteNode } from './operation_delete';
import type { SupabaseV1RowGetNode } from './operation_get';
import type { SupabaseV1RowGetAllNode } from './operation_get_all';
import type { SupabaseV1RowUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type SupabaseV1RowNode =
  | SupabaseV1RowCreateNode
  | SupabaseV1RowDeleteNode
  | SupabaseV1RowGetNode
  | SupabaseV1RowGetAllNode
  | SupabaseV1RowUpdateNode
  ;