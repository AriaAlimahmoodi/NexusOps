/**
 * Notion - Page Resource
 * Re-exports all operation types for this resource.
 */

import type { NotionV1PageCreateNode } from './operation_create';
import type { NotionV1PageGetNode } from './operation_get';
import type { NotionV1PageSearchNode } from './operation_search';

export * from './operation_create';
export * from './operation_get';
export * from './operation_search';

export type NotionV1PageNode =
  | NotionV1PageCreateNode
  | NotionV1PageGetNode
  | NotionV1PageSearchNode
  ;