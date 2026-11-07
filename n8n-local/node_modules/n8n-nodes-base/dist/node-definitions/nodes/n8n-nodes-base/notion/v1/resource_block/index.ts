/**
 * Notion - Block Resource
 * Re-exports all operation types for this resource.
 */

import type { NotionV1BlockAppendNode } from './operation_append';
import type { NotionV1BlockGetAllNode } from './operation_get_all';

export * from './operation_append';
export * from './operation_get_all';

export type NotionV1BlockNode =
  | NotionV1BlockAppendNode
  | NotionV1BlockGetAllNode
  ;