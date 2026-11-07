/**
 * Gmail Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { GmailV1DraftNode } from './resource_draft';
import type { GmailV1LabelNode } from './resource_label';
import type { GmailV1MessageNode } from './resource_message';
import type { GmailV1MessageLabelNode } from './resource_message_label';

export * from './resource_draft';
export * from './resource_label';
export * from './resource_message';
export * from './resource_message_label';

export type GmailV1Node =
  | GmailV1DraftNode
  | GmailV1LabelNode
  | GmailV1MessageNode
  | GmailV1MessageLabelNode
  ;