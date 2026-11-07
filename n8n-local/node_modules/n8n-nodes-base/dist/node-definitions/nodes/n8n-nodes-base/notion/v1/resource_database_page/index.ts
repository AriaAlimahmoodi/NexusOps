/**
 * Notion - DatabasePage Resource
 * Re-exports all operation types for this resource.
 */

import type { NotionV1DatabasePageCreateNode } from './operation_create';
import type { NotionV1DatabasePageGetNode } from './operation_get';
import type { NotionV1DatabasePageGetAllNode } from './operation_get_all';
import type { NotionV1DatabasePageUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type NotionV1DatabasePageNode =
  | NotionV1DatabasePageCreateNode
  | NotionV1DatabasePageGetNode
  | NotionV1DatabasePageGetAllNode
  | NotionV1DatabasePageUpdateNode
  ;