/**
 * HighLevel - Contact Resource
 * Re-exports all operation types for this resource.
 */

import type { HighLevelV2ContactCreateNode } from './operation_create';
import type { HighLevelV2ContactDeleteNode } from './operation_delete';
import type { HighLevelV2ContactGetNode } from './operation_get';
import type { HighLevelV2ContactGetAllNode } from './operation_get_all';
import type { HighLevelV2ContactUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type HighLevelV2ContactNode =
  | HighLevelV2ContactCreateNode
  | HighLevelV2ContactDeleteNode
  | HighLevelV2ContactGetNode
  | HighLevelV2ContactGetAllNode
  | HighLevelV2ContactUpdateNode
  ;