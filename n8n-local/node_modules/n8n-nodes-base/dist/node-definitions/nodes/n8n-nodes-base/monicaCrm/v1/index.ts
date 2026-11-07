/**
 * Monica CRM Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MonicaCrmV1ActivityNode } from './resource_activity';
import type { MonicaCrmV1CallNode } from './resource_call';
import type { MonicaCrmV1ContactNode } from './resource_contact';
import type { MonicaCrmV1ContactFieldNode } from './resource_contact_field';
import type { MonicaCrmV1ContactTagNode } from './resource_contact_tag';
import type { MonicaCrmV1ConversationNode } from './resource_conversation';
import type { MonicaCrmV1ConversationMessageNode } from './resource_conversation_message';
import type { MonicaCrmV1JournalEntryNode } from './resource_journal_entry';
import type { MonicaCrmV1NoteNode } from './resource_note';
import type { MonicaCrmV1ReminderNode } from './resource_reminder';
import type { MonicaCrmV1TagNode } from './resource_tag';
import type { MonicaCrmV1TaskNode } from './resource_task';

export * from './resource_activity';
export * from './resource_call';
export * from './resource_contact';
export * from './resource_contact_field';
export * from './resource_contact_tag';
export * from './resource_conversation';
export * from './resource_conversation_message';
export * from './resource_journal_entry';
export * from './resource_note';
export * from './resource_reminder';
export * from './resource_tag';
export * from './resource_task';

export type MonicaCrmV1Node =
  | MonicaCrmV1ActivityNode
  | MonicaCrmV1CallNode
  | MonicaCrmV1ContactNode
  | MonicaCrmV1ContactFieldNode
  | MonicaCrmV1ContactTagNode
  | MonicaCrmV1ConversationNode
  | MonicaCrmV1ConversationMessageNode
  | MonicaCrmV1JournalEntryNode
  | MonicaCrmV1NoteNode
  | MonicaCrmV1ReminderNode
  | MonicaCrmV1TagNode
  | MonicaCrmV1TaskNode
  ;