/**
 * Vonage - Sms Resource
 * Re-exports all operation types for this resource.
 */

import type { VonageV1SmsSendNode } from './operation_send';

export * from './operation_send';

export type VonageV1SmsNode = VonageV1SmsSendNode;