/**
 * Notion - Block Resource
 * Re-exports all operation types for this resource.
 */

import type { NotionV22BlockAppendNode } from './operation_append';
import type { NotionV22BlockGetAllNode } from './operation_get_all';

export * from './operation_append';
export * from './operation_get_all';

export type NotionV22BlockNode =
  | NotionV22BlockAppendNode
  | NotionV22BlockGetAllNode
  ;