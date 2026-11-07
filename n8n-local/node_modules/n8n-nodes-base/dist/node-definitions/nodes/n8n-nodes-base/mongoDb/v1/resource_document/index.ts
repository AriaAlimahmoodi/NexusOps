/**
 * MongoDB - Document Resource
 * Re-exports all operation types for this resource.
 */

import type { MongoDbV1DocumentAggregateNode } from './operation_aggregate';
import type { MongoDbV1DocumentDeleteNode } from './operation_delete';
import type { MongoDbV1DocumentFindNode } from './operation_find';
import type { MongoDbV1DocumentFindOneAndReplaceNode } from './operation_find_one_and_replace';
import type { MongoDbV1DocumentFindOneAndUpdateNode } from './operation_find_one_and_update';
import type { MongoDbV1DocumentInsertNode } from './operation_insert';
import type { MongoDbV1DocumentUpdateNode } from './operation_update';

export * from './operation_aggregate';
export * from './operation_delete';
export * from './operation_find';
export * from './operation_find_one_and_replace';
export * from './operation_find_one_and_update';
export * from './operation_insert';
export * from './operation_update';

export type MongoDbV1DocumentNode =
  | MongoDbV1DocumentAggregateNode
  | MongoDbV1DocumentDeleteNode
  | MongoDbV1DocumentFindNode
  | MongoDbV1DocumentFindOneAndReplaceNode
  | MongoDbV1DocumentFindOneAndUpdateNode
  | MongoDbV1DocumentInsertNode
  | MongoDbV1DocumentUpdateNode
  ;