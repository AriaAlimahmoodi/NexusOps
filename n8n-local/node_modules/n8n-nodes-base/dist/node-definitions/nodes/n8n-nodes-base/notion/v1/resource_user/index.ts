/**
 * Notion - User Resource
 * Re-exports all operation types for this resource.
 */

import type { NotionV1UserGetNode } from './operation_get';
import type { NotionV1UserGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type NotionV1UserNode =
  | NotionV1UserGetNode
  | NotionV1UserGetAllNode
  ;