/**
 * Notion - Database Resource
 * Re-exports all operation types for this resource.
 */

import type { NotionV21DatabaseGetNode } from './operation_get';
import type { NotionV21DatabaseGetAllNode } from './operation_get_all';
import type { NotionV21DatabaseSearchNode } from './operation_search';

export * from './operation_get';
export * from './operation_get_all';
export * from './operation_search';

export type NotionV21DatabaseNode =
  | NotionV21DatabaseGetNode
  | NotionV21DatabaseGetAllNode
  | NotionV21DatabaseSearchNode
  ;