/**
 * WhatsApp Business Cloud Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { WhatsAppV1MessageNode } from './resource_message';
import type { WhatsAppV1MediaNode } from './resource_media';

export * from './resource_message';
export * from './resource_media';

export type WhatsAppV1Node =
  | WhatsAppV1MessageNode
  | WhatsAppV1MediaNode
  ;