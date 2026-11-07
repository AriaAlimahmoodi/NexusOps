/**
 * X (Formerly Twitter) - Tweet Resource
 * Re-exports all operation types for this resource.
 */

import type { TwitterV2TweetCreateNode } from './operation_create';
import type { TwitterV2TweetDeleteNode } from './operation_delete';
import type { TwitterV2TweetLikeNode } from './operation_like';
import type { TwitterV2TweetRetweetNode } from './operation_retweet';
import type { TwitterV2TweetSearchNode } from './operation_search';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_like';
export * from './operation_retweet';
export * from './operation_search';

export type TwitterV2TweetNode =
  | TwitterV2TweetCreateNode
  | TwitterV2TweetDeleteNode
  | TwitterV2TweetLikeNode
  | TwitterV2TweetRetweetNode
  | TwitterV2TweetSearchNode
  ;