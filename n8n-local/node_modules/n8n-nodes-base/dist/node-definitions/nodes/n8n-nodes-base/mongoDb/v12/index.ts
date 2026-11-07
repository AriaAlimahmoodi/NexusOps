/**
 * MongoDB Node - Version 1.2
 * Re-exports all discriminator combinations.
 */

import type { MongoDbV12SearchIndexesNode } from './resource_search_indexes';
import type { MongoDbV12DocumentNode } from './resource_document';

export * from './resource_search_indexes';
export * from './resource_document';

export type MongoDbV12Node =
  | MongoDbV12SearchIndexesNode
  | MongoDbV12DocumentNode
  ;