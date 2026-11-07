/**
 * Mocean Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MoceanV1SmsNode } from './resource_sms';
import type { MoceanV1VoiceNode } from './resource_voice';

export * from './resource_sms';
export * from './resource_voice';

export type MoceanV1Node =
  | MoceanV1SmsNode
  | MoceanV1VoiceNode
  ;