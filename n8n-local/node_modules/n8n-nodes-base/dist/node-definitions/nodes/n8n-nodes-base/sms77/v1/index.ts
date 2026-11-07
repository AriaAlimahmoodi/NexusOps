/**
 * seven Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { Sms77V1SmsNode } from './resource_sms';
import type { Sms77V1VoiceNode } from './resource_voice';

export * from './resource_sms';
export * from './resource_voice';

export type Sms77V1Node =
  | Sms77V1SmsNode
  | Sms77V1VoiceNode
  ;