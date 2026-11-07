/**
 * Gmail Node - Version 2.1
 * Re-exports all discriminator combinations.
 */

import type { GmailV21MessageNode } from './resource_message';
import type { GmailV21LabelNode } from './resource_label';
import type { GmailV21DraftNode } from './resource_draft';
import type { GmailV21ThreadNode } from './resource_thread';

export * from './resource_message';
export * from './resource_label';
export * from './resource_draft';
export * from './resource_thread';

export type GmailV21Node =
  | GmailV21MessageNode
  | GmailV21LabelNode
  | GmailV21DraftNode
  | GmailV21ThreadNode
  ;