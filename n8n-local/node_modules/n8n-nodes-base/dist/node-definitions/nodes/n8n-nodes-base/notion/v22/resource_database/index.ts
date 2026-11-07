/**
 * Notion - Database Resource
 * Re-exports all operation types for this resource.
 */

import type { NotionV22DatabaseGetNode } from './operation_get';
import type { NotionV22DatabaseGetAllNode } from './operation_get_all';
import type { NotionV22DatabaseSearchNode } from './operation_search';

export * from './operation_get';
export * from './operation_get_all';
export * from './operation_search';

export type NotionV22DatabaseNode =
  | NotionV22DatabaseGetNode
  | NotionV22DatabaseGetAllNode
  | NotionV22DatabaseSearchNode
  ;