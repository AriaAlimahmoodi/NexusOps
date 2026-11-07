/**
 * Pipedrive - Person Resource
 * Re-exports all operation types for this resource.
 */

import type { PipedriveV1PersonCreateNode } from './operation_create';
import type { PipedriveV1PersonDeleteNode } from './operation_delete';
import type { PipedriveV1PersonGetNode } from './operation_get';
import type { PipedriveV1PersonGetAllNode } from './operation_get_all';
import type { PipedriveV1PersonSearchNode } from './operation_search';
import type { PipedriveV1PersonUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_search';
export * from './operation_update';

export type PipedriveV1PersonNode =
  | PipedriveV1PersonCreateNode
  | PipedriveV1PersonDeleteNode
  | PipedriveV1PersonGetNode
  | PipedriveV1PersonGetAllNode
  | PipedriveV1PersonSearchNode
  | PipedriveV1PersonUpdateNode
  ;