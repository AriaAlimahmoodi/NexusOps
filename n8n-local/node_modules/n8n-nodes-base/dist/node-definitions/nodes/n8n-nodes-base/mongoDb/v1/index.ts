/**
 * MongoDB Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MongoDbV1SearchIndexesNode } from './resource_search_indexes';
import type { MongoDbV1DocumentNode } from './resource_document';

export * from './resource_search_indexes';
export * from './resource_document';

export type MongoDbV1Node =
  | MongoDbV1SearchIndexesNode
  | MongoDbV1DocumentNode
  ;