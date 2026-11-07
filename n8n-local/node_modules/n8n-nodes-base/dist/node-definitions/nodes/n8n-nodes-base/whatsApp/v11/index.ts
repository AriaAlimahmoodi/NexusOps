/**
 * WhatsApp Business Cloud Node - Version 1.1
 * Re-exports all discriminator combinations.
 */

import type { WhatsAppV11MessageNode } from './resource_message';
import type { WhatsAppV11MediaNode } from './resource_media';

export * from './resource_message';
export * from './resource_media';

export type WhatsAppV11Node =
  | WhatsAppV11MessageNode
  | WhatsAppV11MediaNode
  ;