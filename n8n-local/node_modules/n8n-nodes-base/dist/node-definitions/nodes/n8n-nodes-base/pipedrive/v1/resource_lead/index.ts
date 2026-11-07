/**
 * Pipedrive - Lead Resource
 * Re-exports all operation types for this resource.
 */

import type { PipedriveV1LeadCreateNode } from './operation_create';
import type { PipedriveV1LeadDeleteNode } from './operation_delete';
import type { PipedriveV1LeadGetNode } from './operation_get';
import type { PipedriveV1LeadGetAllNode } from './operation_get_all';
import type { PipedriveV1LeadUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type PipedriveV1LeadNode =
  | PipedriveV1LeadCreateNode
  | PipedriveV1LeadDeleteNode
  | PipedriveV1LeadGetNode
  | PipedriveV1LeadGetAllNode
  | PipedriveV1LeadUpdateNode
  ;