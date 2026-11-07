/**
 * Notion - DatabasePage Resource
 * Re-exports all operation types for this resource.
 */

import type { NotionV2DatabasePageCreateNode } from './operation_create';
import type { NotionV2DatabasePageGetNode } from './operation_get';
import type { NotionV2DatabasePageGetAllNode } from './operation_get_all';
import type { NotionV2DatabasePageUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type NotionV2DatabasePageNode =
  | NotionV2DatabasePageCreateNode
  | NotionV2DatabasePageGetNode
  | NotionV2DatabasePageGetAllNode
  | NotionV2DatabasePageUpdateNode
  ;