/**
 * Disqus - Forum Resource
 * Re-exports all operation types for this resource.
 */

import type { DisqusV1ForumGetNode } from './operation_get';
import type { DisqusV1ForumGetCategoriesNode } from './operation_get_categories';
import type { DisqusV1ForumGetPostsNode } from './operation_get_posts';
import type { DisqusV1ForumGetThreadsNode } from './operation_get_threads';

export * from './operation_get';
export * from './operation_get_categories';
export * from './operation_get_posts';
export * from './operation_get_threads';

export type DisqusV1ForumNode =
  | DisqusV1ForumGetNode
  | DisqusV1ForumGetCategoriesNode
  | DisqusV1ForumGetPostsNode
  | DisqusV1ForumGetThreadsNode
  ;