/**
 * MongoDB - Document Resource
 * Re-exports all operation types for this resource.
 */

import type { MongoDbV12DocumentAggregateNode } from './operation_aggregate';
import type { MongoDbV12DocumentDeleteNode } from './operation_delete';
import type { MongoDbV12DocumentFindNode } from './operation_find';
import type { MongoDbV12DocumentFindOneAndReplaceNode } from './operation_find_one_and_replace';
import type { MongoDbV12DocumentFindOneAndUpdateNode } from './operation_find_one_and_update';
import type { MongoDbV12DocumentInsertNode } from './operation_insert';
import type { MongoDbV12DocumentUpdateNode } from './operation_update';

export * from './operation_aggregate';
export * from './operation_delete';
export * from './operation_find';
export * from './operation_find_one_and_replace';
export * from './operation_find_one_and_update';
export * from './operation_insert';
export * from './operation_update';

export type MongoDbV12DocumentNode =
  | MongoDbV12DocumentAggregateNode
  | MongoDbV12DocumentDeleteNode
  | MongoDbV12DocumentFindNode
  | MongoDbV12DocumentFindOneAndReplaceNode
  | MongoDbV12DocumentFindOneAndUpdateNode
  | MongoDbV12DocumentInsertNode
  | MongoDbV12DocumentUpdateNode
  ;