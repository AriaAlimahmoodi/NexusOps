/**
 * Notion - DatabasePage Resource
 * Re-exports all operation types for this resource.
 */

import type { NotionV21DatabasePageCreateNode } from './operation_create';
import type { NotionV21DatabasePageGetNode } from './operation_get';
import type { NotionV21DatabasePageGetAllNode } from './operation_get_all';
import type { NotionV21DatabasePageUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type NotionV21DatabasePageNode =
  | NotionV21DatabasePageCreateNode
  | NotionV21DatabasePageGetNode
  | NotionV21DatabasePageGetAllNode
  | NotionV21DatabasePageUpdateNode
  ;