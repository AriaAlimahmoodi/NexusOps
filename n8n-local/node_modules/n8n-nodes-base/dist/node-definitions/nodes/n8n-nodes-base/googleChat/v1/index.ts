/**
 * Google Chat Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { GoogleChatV1MemberNode } from './resource_member';
import type { GoogleChatV1MessageNode } from './resource_message';
import type { GoogleChatV1SpaceNode } from './resource_space';

export * from './resource_member';
export * from './resource_message';
export * from './resource_space';

export type GoogleChatV1Node =
  | GoogleChatV1MemberNode
  | GoogleChatV1MessageNode
  | GoogleChatV1SpaceNode
  ;