/**
 * Metabase - Questions Resource
 * Re-exports all operation types for this resource.
 */

import type { MetabaseV1QuestionsGetNode } from './operation_get';
import type { MetabaseV1QuestionsGetAllNode } from './operation_get_all';
import type { MetabaseV1QuestionsResultDataNode } from './operation_result_data';

export * from './operation_get';
export * from './operation_get_all';
export * from './operation_result_data';

export type MetabaseV1QuestionsNode =
  | MetabaseV1QuestionsGetNode
  | MetabaseV1QuestionsGetAllNode
  | MetabaseV1QuestionsResultDataNode
  ;