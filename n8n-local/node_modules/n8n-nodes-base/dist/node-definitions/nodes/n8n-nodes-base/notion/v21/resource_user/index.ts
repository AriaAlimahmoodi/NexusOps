/**
 * Notion - User Resource
 * Re-exports all operation types for this resource.
 */

import type { NotionV21UserGetNode } from './operation_get';
import type { NotionV21UserGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type NotionV21UserNode =
  | NotionV21UserGetNode
  | NotionV21UserGetAllNode
  ;