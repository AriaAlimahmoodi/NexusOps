/**
 * MongoDB - Document Resource
 * Re-exports all operation types for this resource.
 */

import type { MongoDbV11DocumentAggregateNode } from './operation_aggregate';
import type { MongoDbV11DocumentDeleteNode } from './operation_delete';
import type { MongoDbV11DocumentFindNode } from './operation_find';
import type { MongoDbV11DocumentFindOneAndReplaceNode } from './operation_find_one_and_replace';
import type { MongoDbV11DocumentFindOneAndUpdateNode } from './operation_find_one_and_update';
import type { MongoDbV11DocumentInsertNode } from './operation_insert';
import type { MongoDbV11DocumentUpdateNode } from './operation_update';

export * from './operation_aggregate';
export * from './operation_delete';
export * from './operation_find';
export * from './operation_find_one_and_replace';
export * from './operation_find_one_and_update';
export * from './operation_insert';
export * from './operation_update';

export type MongoDbV11DocumentNode =
  | MongoDbV11DocumentAggregateNode
  | MongoDbV11DocumentDeleteNode
  | MongoDbV11DocumentFindNode
  | MongoDbV11DocumentFindOneAndReplaceNode
  | MongoDbV11DocumentFindOneAndUpdateNode
  | MongoDbV11DocumentInsertNode
  | MongoDbV11DocumentUpdateNode
  ;