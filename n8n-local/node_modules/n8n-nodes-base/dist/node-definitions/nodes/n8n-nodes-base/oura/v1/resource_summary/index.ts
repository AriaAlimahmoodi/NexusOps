/**
 * Oura - Summary Resource
 * Re-exports all operation types for this resource.
 */

import type { OuraV1SummaryGetActivityNode } from './operation_get_activity';
import type { OuraV1SummaryGetReadinessNode } from './operation_get_readiness';
import type { OuraV1SummaryGetSleepNode } from './operation_get_sleep';

export * from './operation_get_activity';
export * from './operation_get_readiness';
export * from './operation_get_sleep';

export type OuraV1SummaryNode =
  | OuraV1SummaryGetActivityNode
  | OuraV1SummaryGetReadinessNode
  | OuraV1SummaryGetSleepNode
  ;