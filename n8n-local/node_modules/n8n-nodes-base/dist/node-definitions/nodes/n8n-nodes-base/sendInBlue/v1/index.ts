/**
 * Brevo Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { SendInBlueV1ContactNode } from './resource_contact';
import type { SendInBlueV1AttributeNode } from './resource_attribute';
import type { SendInBlueV1EmailNode } from './resource_email';
import type { SendInBlueV1SenderNode } from './resource_sender';

export * from './resource_contact';
export * from './resource_attribute';
export * from './resource_email';
export * from './resource_sender';

export type SendInBlueV1Node =
  | SendInBlueV1ContactNode
  | SendInBlueV1AttributeNode
  | SendInBlueV1EmailNode
  | SendInBlueV1SenderNode
  ;