/**
 * Elasticsearch Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { ElasticsearchV1DocumentNode } from './resource_document';
import type { ElasticsearchV1IndexNode } from './resource_index';

export * from './resource_document';
export * from './resource_index';

export type ElasticsearchV1Node =
  | ElasticsearchV1DocumentNode
  | ElasticsearchV1IndexNode
  ;