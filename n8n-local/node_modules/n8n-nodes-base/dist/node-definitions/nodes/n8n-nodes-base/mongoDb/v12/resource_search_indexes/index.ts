/**
 * MongoDB - SearchIndexes Resource
 * Re-exports all operation types for this resource.
 */

import type { MongoDbV12SearchIndexesCreateSearchIndexNode } from './operation_create_search_index';
import type { MongoDbV12SearchIndexesDropSearchIndexNode } from './operation_drop_search_index';
import type { MongoDbV12SearchIndexesListSearchIndexesNode } from './operation_list_search_indexes';
import type { MongoDbV12SearchIndexesUpdateSearchIndexNode } from './operation_update_search_index';

export * from './operation_create_search_index';
export * from './operation_drop_search_index';
export * from './operation_list_search_indexes';
export * from './operation_update_search_index';

export type MongoDbV12SearchIndexesNode =
  | MongoDbV12SearchIndexesCreateSearchIndexNode
  | MongoDbV12SearchIndexesDropSearchIndexNode
  | MongoDbV12SearchIndexesListSearchIndexesNode
  | MongoDbV12SearchIndexesUpdateSearchIndexNode
  ;