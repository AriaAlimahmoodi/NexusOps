/**
 * MongoDB Node - Version 1.1
 * Re-exports all discriminator combinations.
 */

import type { MongoDbV11SearchIndexesNode } from './resource_search_indexes';
import type { MongoDbV11DocumentNode } from './resource_document';

export * from './resource_search_indexes';
export * from './resource_document';

export type MongoDbV11Node =
  | MongoDbV11SearchIndexesNode
  | MongoDbV11DocumentNode
  ;