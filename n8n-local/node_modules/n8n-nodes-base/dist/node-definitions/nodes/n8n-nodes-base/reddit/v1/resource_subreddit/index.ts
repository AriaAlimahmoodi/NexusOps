/**
 * Reddit - Subreddit Resource
 * Re-exports all operation types for this resource.
 */

import type { RedditV1SubredditGetNode } from './operation_get';
import type { RedditV1SubredditGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type RedditV1SubredditNode =
  | RedditV1SubredditGetNode
  | RedditV1SubredditGetAllNode
  ;