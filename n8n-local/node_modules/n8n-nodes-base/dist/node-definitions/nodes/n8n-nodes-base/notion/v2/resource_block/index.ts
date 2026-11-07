/**
 * Notion - Block Resource
 * Re-exports all operation types for this resource.
 */

import type { NotionV2BlockAppendNode } from './operation_append';
import type { NotionV2BlockGetAllNode } from './operation_get_all';

export * from './operation_append';
export * from './operation_get_all';

export type NotionV2BlockNode =
  | NotionV2BlockAppendNode
  | NotionV2BlockGetAllNode
  ;