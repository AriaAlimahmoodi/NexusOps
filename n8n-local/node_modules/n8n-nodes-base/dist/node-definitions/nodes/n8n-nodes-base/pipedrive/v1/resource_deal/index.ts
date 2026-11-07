/**
 * Pipedrive - Deal Resource
 * Re-exports all operation types for this resource.
 */

import type { PipedriveV1DealCreateNode } from './operation_create';
import type { PipedriveV1DealDeleteNode } from './operation_delete';
import type { PipedriveV1DealDuplicateNode } from './operation_duplicate';
import type { PipedriveV1DealGetNode } from './operation_get';
import type { PipedriveV1DealGetAllNode } from './operation_get_all';
import type { PipedriveV1DealSearchNode } from './operation_search';
import type { PipedriveV1DealUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_duplicate';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_search';
export * from './operation_update';

export type PipedriveV1DealNode =
  | PipedriveV1DealCreateNode
  | PipedriveV1DealDeleteNode
  | PipedriveV1DealDuplicateNode
  | PipedriveV1DealGetNode
  | PipedriveV1DealGetAllNode
  | PipedriveV1DealSearchNode
  | PipedriveV1DealUpdateNode
  ;