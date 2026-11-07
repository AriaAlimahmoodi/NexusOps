/**
 * Elasticsearch - Index Resource
 * Re-exports all operation types for this resource.
 */

import type { ElasticsearchV1IndexCreateNode } from './operation_create';
import type { ElasticsearchV1IndexDeleteNode } from './operation_delete';
import type { ElasticsearchV1IndexGetNode } from './operation_get';
import type { ElasticsearchV1IndexGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type ElasticsearchV1IndexNode =
  | ElasticsearchV1IndexCreateNode
  | ElasticsearchV1IndexDeleteNode
  | ElasticsearchV1IndexGetNode
  | ElasticsearchV1IndexGetAllNode
  ;