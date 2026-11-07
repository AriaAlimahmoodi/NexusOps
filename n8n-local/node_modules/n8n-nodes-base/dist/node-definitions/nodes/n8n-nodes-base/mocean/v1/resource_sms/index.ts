/**
 * Mocean - Sms Resource
 * Re-exports all operation types for this resource.
 */

import type { MoceanV1SmsSendNode } from './operation_send';

export * from './operation_send';

export type MoceanV1SmsNode = MoceanV1SmsSendNode;