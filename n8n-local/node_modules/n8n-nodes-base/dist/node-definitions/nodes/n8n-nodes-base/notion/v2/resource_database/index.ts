/**
 * Notion - Database Resource
 * Re-exports all operation types for this resource.
 */

import type { NotionV2DatabaseGetNode } from './operation_get';
import type { NotionV2DatabaseGetAllNode } from './operation_get_all';
import type { NotionV2DatabaseSearchNode } from './operation_search';

export * from './operation_get';
export * from './operation_get_all';
export * from './operation_search';

export type NotionV2DatabaseNode =
  | NotionV2DatabaseGetNode
  | NotionV2DatabaseGetAllNode
  | NotionV2DatabaseSearchNode
  ;