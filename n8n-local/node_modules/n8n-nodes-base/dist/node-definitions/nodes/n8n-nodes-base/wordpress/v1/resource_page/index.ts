/**
 * Wordpress - Page Resource
 * Re-exports all operation types for this resource.
 */

import type { WordpressV1PageCreateNode } from './operation_create';
import type { WordpressV1PageGetNode } from './operation_get';
import type { WordpressV1PageGetAllNode } from './operation_get_all';
import type { WordpressV1PageUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type WordpressV1PageNode =
  | WordpressV1PageCreateNode
  | WordpressV1PageGetNode
  | WordpressV1PageGetAllNode
  | WordpressV1PageUpdateNode
  ;