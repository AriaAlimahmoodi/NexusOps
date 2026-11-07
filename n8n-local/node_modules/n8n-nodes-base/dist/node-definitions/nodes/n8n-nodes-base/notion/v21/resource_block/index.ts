/**
 * Notion - Block Resource
 * Re-exports all operation types for this resource.
 */

import type { NotionV21BlockAppendNode } from './operation_append';
import type { NotionV21BlockGetAllNode } from './operation_get_all';

export * from './operation_append';
export * from './operation_get_all';

export type NotionV21BlockNode =
  | NotionV21BlockAppendNode
  | NotionV21BlockGetAllNode
  ;