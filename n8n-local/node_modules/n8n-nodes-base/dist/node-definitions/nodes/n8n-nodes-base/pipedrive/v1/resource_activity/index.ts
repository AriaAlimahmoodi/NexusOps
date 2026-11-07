/**
 * Pipedrive - Activity Resource
 * Re-exports all operation types for this resource.
 */

import type { PipedriveV1ActivityCreateNode } from './operation_create';
import type { PipedriveV1ActivityDeleteNode } from './operation_delete';
import type { PipedriveV1ActivityGetNode } from './operation_get';
import type { PipedriveV1ActivityGetAllNode } from './operation_get_all';
import type { PipedriveV1ActivityUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type PipedriveV1ActivityNode =
  | PipedriveV1ActivityCreateNode
  | PipedriveV1ActivityDeleteNode
  | PipedriveV1ActivityGetNode
  | PipedriveV1ActivityGetAllNode
  | PipedriveV1ActivityUpdateNode
  ;