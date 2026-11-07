/**
 * Notion - Page Resource
 * Re-exports all operation types for this resource.
 */

import type { NotionV22PageCreateNode } from './operation_create';
import type { NotionV22PageGetNode } from './operation_get';
import type { NotionV22PageSearchNode } from './operation_search';

export * from './operation_create';
export * from './operation_get';
export * from './operation_search';

export type NotionV22PageNode =
  | NotionV22PageCreateNode
  | NotionV22PageGetNode
  | NotionV22PageSearchNode
  ;