/**
 * Mailjet - Sms Resource
 * Re-exports all operation types for this resource.
 */

import type { MailjetV1SmsSendNode } from './operation_send';

export * from './operation_send';

export type MailjetV1SmsNode = MailjetV1SmsSendNode;