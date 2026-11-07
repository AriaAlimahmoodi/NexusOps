/**
 * SendGrid Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { SendGridV1ContactNode } from './resource_contact';
import type { SendGridV1ListNode } from './resource_list';
import type { SendGridV1MailNode } from './resource_mail';

export * from './resource_contact';
export * from './resource_list';
export * from './resource_mail';

export type SendGridV1Node =
  | SendGridV1ContactNode
  | SendGridV1ListNode
  | SendGridV1MailNode
  ;