/**
 * Quick Base - Record Resource
 * Re-exports all operation types for this resource.
 */

import type { QuickbaseV1RecordCreateNode } from './operation_create';
import type { QuickbaseV1RecordDeleteNode } from './operation_delete';
import type { QuickbaseV1RecordGetAllNode } from './operation_get_all';
import type { QuickbaseV1RecordUpdateNode } from './operation_update';
import type { QuickbaseV1RecordUpsertNode } from './operation_upsert';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get_all';
export * from './operation_update';
export * from './operation_upsert';

export type QuickbaseV1RecordNode =
  | QuickbaseV1RecordCreateNode
  | QuickbaseV1RecordDeleteNode
  | QuickbaseV1RecordGetAllNode
  | QuickbaseV1RecordUpdateNode
  | QuickbaseV1RecordUpsertNode
  ;