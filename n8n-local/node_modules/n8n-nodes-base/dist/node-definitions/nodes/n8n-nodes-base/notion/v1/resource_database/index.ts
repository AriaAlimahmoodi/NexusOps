/**
 * Notion - Database Resource
 * Re-exports all operation types for this resource.
 */

import type { NotionV1DatabaseGetNode } from './operation_get';
import type { NotionV1DatabaseGetAllNode } from './operation_get_all';
import type { NotionV1DatabaseSearchNode } from './operation_search';

export * from './operation_get';
export * from './operation_get_all';
export * from './operation_search';

export type NotionV1DatabaseNode =
  | NotionV1DatabaseGetNode
  | NotionV1DatabaseGetAllNode
  | NotionV1DatabaseSearchNode
  ;