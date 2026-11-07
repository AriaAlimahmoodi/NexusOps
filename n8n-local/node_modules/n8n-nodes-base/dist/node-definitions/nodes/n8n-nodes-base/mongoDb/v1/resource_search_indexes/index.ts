/**
 * MongoDB - SearchIndexes Resource
 * Re-exports all operation types for this resource.
 */

import type { MongoDbV1SearchIndexesCreateSearchIndexNode } from './operation_create_search_index';
import type { MongoDbV1SearchIndexesDropSearchIndexNode } from './operation_drop_search_index';
import type { MongoDbV1SearchIndexesListSearchIndexesNode } from './operation_list_search_indexes';
import type { MongoDbV1SearchIndexesUpdateSearchIndexNode } from './operation_update_search_index';

export * from './operation_create_search_index';
export * from './operation_drop_search_index';
export * from './operation_list_search_indexes';
export * from './operation_update_search_index';

export type MongoDbV1SearchIndexesNode =
  | MongoDbV1SearchIndexesCreateSearchIndexNode
  | MongoDbV1SearchIndexesDropSearchIndexNode
  | MongoDbV1SearchIndexesListSearchIndexesNode
  | MongoDbV1SearchIndexesUpdateSearchIndexNode
  ;