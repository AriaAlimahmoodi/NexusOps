/**
 * Elasticsearch - Document Resource
 * Re-exports all operation types for this resource.
 */

import type { ElasticsearchV1DocumentCreateNode } from './operation_create';
import type { ElasticsearchV1DocumentDeleteNode } from './operation_delete';
import type { ElasticsearchV1DocumentGetNode } from './operation_get';
import type { ElasticsearchV1DocumentGetAllNode } from './operation_get_all';
import type { ElasticsearchV1DocumentUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type ElasticsearchV1DocumentNode =
  | ElasticsearchV1DocumentCreateNode
  | ElasticsearchV1DocumentDeleteNode
  | ElasticsearchV1DocumentGetNode
  | ElasticsearchV1DocumentGetAllNode
  | ElasticsearchV1DocumentUpdateNode
  ;