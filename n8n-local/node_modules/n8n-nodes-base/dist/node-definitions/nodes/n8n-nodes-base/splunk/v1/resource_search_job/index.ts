/**
 * Splunk - SearchJob Resource
 * Re-exports all operation types for this resource.
 */

import type { SplunkV1SearchJobCreateNode } from './operation_create';
import type { SplunkV1SearchJobDeleteNode } from './operation_delete';
import type { SplunkV1SearchJobGetNode } from './operation_get';
import type { SplunkV1SearchJobGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type SplunkV1SearchJobNode =
  | SplunkV1SearchJobCreateNode
  | SplunkV1SearchJobDeleteNode
  | SplunkV1SearchJobGetNode
  | SplunkV1SearchJobGetAllNode
  ;