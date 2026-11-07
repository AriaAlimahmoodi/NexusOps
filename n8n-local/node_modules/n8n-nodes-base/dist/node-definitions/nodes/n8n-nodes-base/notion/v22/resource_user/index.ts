/**
 * Notion - User Resource
 * Re-exports all operation types for this resource.
 */

import type { NotionV22UserGetNode } from './operation_get';
import type { NotionV22UserGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type NotionV22UserNode =
  | NotionV22UserGetNode
  | NotionV22UserGetAllNode
  ;