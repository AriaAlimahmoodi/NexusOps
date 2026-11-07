/**
 * MessageBird - Sms Resource
 * Re-exports all operation types for this resource.
 */

import type { MessageBirdV1SmsSendNode } from './operation_send';

export * from './operation_send';

export type MessageBirdV1SmsNode = MessageBirdV1SmsSendNode;