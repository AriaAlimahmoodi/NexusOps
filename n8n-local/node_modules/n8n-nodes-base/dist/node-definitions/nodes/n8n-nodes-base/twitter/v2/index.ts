/**
 * X (Formerly Twitter) Node - Version 2
 * Re-exports all discriminator combinations.
 */

import type { TwitterV2DirectMessageNode } from './resource_direct_message';
import type { TwitterV2ListNode } from './resource_list';
import type { TwitterV2TweetNode } from './resource_tweet';
import type { TwitterV2UserNode } from './resource_user';

export * from './resource_direct_message';
export * from './resource_list';
export * from './resource_tweet';
export * from './resource_user';

export type TwitterV2Node =
  | TwitterV2DirectMessageNode
  | TwitterV2ListNode
  | TwitterV2TweetNode
  | TwitterV2UserNode
  ;