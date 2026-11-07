/**
 * X (Formerly Twitter) Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { TwitterV1DirectMessageNode } from './resource_direct_message';
import type { TwitterV1TweetNode } from './resource_tweet';

export * from './resource_direct_message';
export * from './resource_tweet';

export type TwitterV1Node =
  | TwitterV1DirectMessageNode
  | TwitterV1TweetNode
  ;