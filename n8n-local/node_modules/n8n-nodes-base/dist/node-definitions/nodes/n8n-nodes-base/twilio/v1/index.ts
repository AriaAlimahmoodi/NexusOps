/**
 * Twilio Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { TwilioV1CallNode } from './resource_call';
import type { TwilioV1SmsNode } from './resource_sms';

export * from './resource_call';
export * from './resource_sms';

export type TwilioV1Node =
  | TwilioV1CallNode
  | TwilioV1SmsNode
  ;