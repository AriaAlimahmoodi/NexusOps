/**
 * Notion - Page Resource
 * Re-exports all operation types for this resource.
 */

import type { NotionV21PageCreateNode } from './operation_create';
import type { NotionV21PageGetNode } from './operation_get';
import type { NotionV21PageSearchNode } from './operation_search';

export * from './operation_create';
export * from './operation_get';
export * from './operation_search';

export type NotionV21PageNode =
  | NotionV21PageCreateNode
  | NotionV21PageGetNode
  | NotionV21PageSearchNode
  ;