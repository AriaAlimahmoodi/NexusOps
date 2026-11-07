/**
 * MongoDB - SearchIndexes Resource
 * Re-exports all operation types for this resource.
 */

import type { MongoDbV11SearchIndexesCreateSearchIndexNode } from './operation_create_search_index';
import type { MongoDbV11SearchIndexesDropSearchIndexNode } from './operation_drop_search_index';
import type { MongoDbV11SearchIndexesListSearchIndexesNode } from './operation_list_search_indexes';
import type { MongoDbV11SearchIndexesUpdateSearchIndexNode } from './operation_update_search_index';

export * from './operation_create_search_index';
export * from './operation_drop_search_index';
export * from './operation_list_search_indexes';
export * from './operation_update_search_index';

export type MongoDbV11SearchIndexesNode =
  | MongoDbV11SearchIndexesCreateSearchIndexNode
  | MongoDbV11SearchIndexesDropSearchIndexNode
  | MongoDbV11SearchIndexesListSearchIndexesNode
  | MongoDbV11SearchIndexesUpdateSearchIndexNode
  ;