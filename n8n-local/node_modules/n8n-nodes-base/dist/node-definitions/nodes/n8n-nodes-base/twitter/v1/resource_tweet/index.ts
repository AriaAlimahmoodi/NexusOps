/**
 * X (Formerly Twitter) - Tweet Resource
 * Re-exports all operation types for this resource.
 */

import type { TwitterV1TweetCreateNode } from './operation_create';
import type { TwitterV1TweetDeleteNode } from './operation_delete';
import type { TwitterV1TweetLikeNode } from './operation_like';
import type { TwitterV1TweetRetweetNode } from './operation_retweet';
import type { TwitterV1TweetSearchNode } from './operation_search';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_like';
export * from './operation_retweet';
export * from './operation_search';

export type TwitterV1TweetNode =
  | TwitterV1TweetCreateNode
  | TwitterV1TweetDeleteNode
  | TwitterV1TweetLikeNode
  | TwitterV1TweetRetweetNode
  | TwitterV1TweetSearchNode
  ;