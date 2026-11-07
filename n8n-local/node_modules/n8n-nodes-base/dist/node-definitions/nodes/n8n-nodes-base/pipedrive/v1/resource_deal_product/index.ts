/**
 * Pipedrive - DealProduct Resource
 * Re-exports all operation types for this resource.
 */

import type { PipedriveV1DealProductAddNode } from './operation_add';
import type { PipedriveV1DealProductGetAllNode } from './operation_get_all';
import type { PipedriveV1DealProductRemoveNode } from './operation_remove';
import type { PipedriveV1DealProductUpdateNode } from './operation_update';

export * from './operation_add';
export * from './operation_get_all';
export * from './operation_remove';
export * from './operation_update';

export type PipedriveV1DealProductNode =
  | PipedriveV1DealProductAddNode
  | PipedriveV1DealProductGetAllNode
  | PipedriveV1DealProductRemoveNode
  | PipedriveV1DealProductUpdateNode
  ;