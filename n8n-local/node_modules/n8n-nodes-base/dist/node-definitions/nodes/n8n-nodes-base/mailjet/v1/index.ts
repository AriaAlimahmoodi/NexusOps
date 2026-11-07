/**
 * Mailjet Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MailjetV1EmailNode } from './resource_email';
import type { MailjetV1SmsNode } from './resource_sms';

export * from './resource_email';
export * from './resource_sms';

export type MailjetV1Node =
  | MailjetV1EmailNode
  | MailjetV1SmsNode
  ;