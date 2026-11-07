/**
 * Notion - DatabasePage Resource
 * Re-exports all operation types for this resource.
 */

import type { NotionV22DatabasePageCreateNode } from './operation_create';
import type { NotionV22DatabasePageGetNode } from './operation_get';
import type { NotionV22DatabasePageGetAllNode } from './operation_get_all';
import type { NotionV22DatabasePageUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type NotionV22DatabasePageNode =
  | NotionV22DatabasePageCreateNode
  | NotionV22DatabasePageGetNode
  | NotionV22DatabasePageGetAllNode
  | NotionV22DatabasePageUpdateNode
  ;