/**
 * Help Scout Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { HelpScoutV1ConversationNode } from './resource_conversation';
import type { HelpScoutV1CustomerNode } from './resource_customer';
import type { HelpScoutV1MailboxNode } from './resource_mailbox';
import type { HelpScoutV1ThreadNode } from './resource_thread';

export * from './resource_conversation';
export * from './resource_customer';
export * from './resource_mailbox';
export * from './resource_thread';

export type HelpScoutV1Node =
  | HelpScoutV1ConversationNode
  | HelpScoutV1CustomerNode
  | HelpScoutV1MailboxNode
  | HelpScoutV1ThreadNode
  ;