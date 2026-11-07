/**
 * Reddit Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { RedditV1PostNode } from './resource_post';
import type { RedditV1PostCommentNode } from './resource_post_comment';
import type { RedditV1ProfileNode } from './resource_profile';
import type { RedditV1SubredditNode } from './resource_subreddit';
import type { RedditV1UserNode } from './resource_user';

export * from './resource_post';
export * from './resource_post_comment';
export * from './resource_profile';
export * from './resource_subreddit';
export * from './resource_user';

export type RedditV1Node =
  | RedditV1PostNode
  | RedditV1PostCommentNode
  | RedditV1ProfileNode
  | RedditV1SubredditNode
  | RedditV1UserNode
  ;