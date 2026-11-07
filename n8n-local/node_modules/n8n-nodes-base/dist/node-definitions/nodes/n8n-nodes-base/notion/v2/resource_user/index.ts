/**
 * Notion - User Resource
 * Re-exports all operation types for this resource.
 */

import type { NotionV2UserGetNode } from './operation_get';
import type { NotionV2UserGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type NotionV2UserNode =
  | NotionV2UserGetNode
  | NotionV2UserGetAllNode
  ;