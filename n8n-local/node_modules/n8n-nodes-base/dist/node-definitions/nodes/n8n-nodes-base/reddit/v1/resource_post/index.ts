/**
 * Reddit - Post Resource
 * Re-exports all operation types for this resource.
 */

import type { RedditV1PostCreateNode } from './operation_create';
import type { RedditV1PostDeleteNode } from './operation_delete';
import type { RedditV1PostGetNode } from './operation_get';
import type { RedditV1PostGetAllNode } from './operation_get_all';
import type { RedditV1PostSearchNode } from './operation_search';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_search';

export type RedditV1PostNode =
  | RedditV1PostCreateNode
  | RedditV1PostDeleteNode
  | RedditV1PostGetNode
  | RedditV1PostGetAllNode
  | RedditV1PostSearchNode
  ;