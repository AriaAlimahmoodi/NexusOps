/**
 * Plivo - Sms Resource
 * Re-exports all operation types for this resource.
 */

import type { PlivoV1SmsSendNode } from './operation_send';

export * from './operation_send';

export type PlivoV1SmsNode = PlivoV1SmsSendNode;