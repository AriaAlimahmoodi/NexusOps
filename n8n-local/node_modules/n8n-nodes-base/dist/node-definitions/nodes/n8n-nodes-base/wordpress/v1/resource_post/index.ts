/**
 * Wordpress - Post Resource
 * Re-exports all operation types for this resource.
 */

import type { WordpressV1PostCreateNode } from './operation_create';
import type { WordpressV1PostGetNode } from './operation_get';
import type { WordpressV1PostGetAllNode } from './operation_get_all';
import type { WordpressV1PostUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type WordpressV1PostNode =
  | WordpressV1PostCreateNode
  | WordpressV1PostGetNode
  | WordpressV1PostGetAllNode
  | WordpressV1PostUpdateNode
  ;