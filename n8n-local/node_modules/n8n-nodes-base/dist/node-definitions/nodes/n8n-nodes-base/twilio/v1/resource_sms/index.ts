/**
 * Twilio - Sms Resource
 * Re-exports all operation types for this resource.
 */

import type { TwilioV1SmsSendNode } from './operation_send';

export * from './operation_send';

export type TwilioV1SmsNode = TwilioV1SmsSendNode;