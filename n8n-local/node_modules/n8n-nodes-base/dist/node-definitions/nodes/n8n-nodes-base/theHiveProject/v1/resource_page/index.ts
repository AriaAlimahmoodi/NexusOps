/**
 * TheHive 5 - Page Resource
 * Re-exports all operation types for this resource.
 */

import type { TheHiveProjectV1PageCreateNode } from './operation_create';
import type { TheHiveProjectV1PageDeletePageNode } from './operation_delete_page';
import type { TheHiveProjectV1PageSearchNode } from './operation_search';
import type { TheHiveProjectV1PageUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete_page';
export * from './operation_search';
export * from './operation_update';

export type TheHiveProjectV1PageNode =
  | TheHiveProjectV1PageCreateNode
  | TheHiveProjectV1PageDeletePageNode
  | TheHiveProjectV1PageSearchNode
  | TheHiveProjectV1PageUpdateNode
  ;