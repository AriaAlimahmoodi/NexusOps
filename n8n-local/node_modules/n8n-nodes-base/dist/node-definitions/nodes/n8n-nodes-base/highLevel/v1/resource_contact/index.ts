/**
 * HighLevel - Contact Resource
 * Re-exports all operation types for this resource.
 */

import type { HighLevelV1ContactCreateNode } from './operation_create';
import type { HighLevelV1ContactDeleteNode } from './operation_delete';
import type { HighLevelV1ContactGetNode } from './operation_get';
import type { HighLevelV1ContactGetAllNode } from './operation_get_all';
import type { HighLevelV1ContactLookupNode } from './operation_lookup';
import type { HighLevelV1ContactUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_lookup';
export * from './operation_update';

export type HighLevelV1ContactNode =
  | HighLevelV1ContactCreateNode
  | HighLevelV1ContactDeleteNode
  | HighLevelV1ContactGetNode
  | HighLevelV1ContactGetAllNode
  | HighLevelV1ContactLookupNode
  | HighLevelV1ContactUpdateNode
  ;