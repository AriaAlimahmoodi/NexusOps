/**
 * Notion - Page Resource
 * Re-exports all operation types for this resource.
 */

import type { NotionV2PageCreateNode } from './operation_create';
import type { NotionV2PageGetNode } from './operation_get';
import type { NotionV2PageSearchNode } from './operation_search';

export * from './operation_create';
export * from './operation_get';
export * from './operation_search';

export type NotionV2PageNode =
  | NotionV2PageCreateNode
  | NotionV2PageGetNode
  | NotionV2PageSearchNode
  ;