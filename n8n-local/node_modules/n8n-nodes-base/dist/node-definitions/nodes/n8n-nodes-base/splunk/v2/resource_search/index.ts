/**
 * Splunk - Search Resource
 * Re-exports all operation types for this resource.
 */

import type { SplunkV2SearchCreateNode } from './operation_create';
import type { SplunkV2SearchDeleteJobNode } from './operation_delete_job';
import type { SplunkV2SearchGetNode } from './operation_get';
import type { SplunkV2SearchGetAllNode } from './operation_get_all';
import type { SplunkV2SearchGetResultNode } from './operation_get_result';

export * from './operation_create';
export * from './operation_delete_job';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_result';

export type SplunkV2SearchNode =
  | SplunkV2SearchCreateNode
  | SplunkV2SearchDeleteJobNode
  | SplunkV2SearchGetNode
  | SplunkV2SearchGetAllNode
  | SplunkV2SearchGetResultNode
  ;