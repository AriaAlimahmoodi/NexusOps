/**
 * Gmail Node - Version 2.2
 * Re-exports all discriminator combinations.
 */

import type { GmailV22MessageNode } from './resource_message';
import type { GmailV22LabelNode } from './resource_label';
import type { GmailV22DraftNode } from './resource_draft';
import type { GmailV22ThreadNode } from './resource_thread';

export * from './resource_message';
export * from './resource_label';
export * from './resource_draft';
export * from './resource_thread';

export type GmailV22Node =
  | GmailV22MessageNode
  | GmailV22LabelNode
  | GmailV22DraftNode
  | GmailV22ThreadNode
  ;