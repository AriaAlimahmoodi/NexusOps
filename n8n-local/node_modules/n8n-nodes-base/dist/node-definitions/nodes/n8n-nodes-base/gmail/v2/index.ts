/**
 * Gmail Node - Version 2
 * Re-exports all discriminator combinations.
 */

import type { GmailV2MessageNode } from './resource_message';
import type { GmailV2LabelNode } from './resource_label';
import type { GmailV2DraftNode } from './resource_draft';
import type { GmailV2ThreadNode } from './resource_thread';

export * from './resource_message';
export * from './resource_label';
export * from './resource_draft';
export * from './resource_thread';

export type GmailV2Node =
  | GmailV2MessageNode
  | GmailV2LabelNode
  | GmailV2DraftNode
  | GmailV2ThreadNode
  ;