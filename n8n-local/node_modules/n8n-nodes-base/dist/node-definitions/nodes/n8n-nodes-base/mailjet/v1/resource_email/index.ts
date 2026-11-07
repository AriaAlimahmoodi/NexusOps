/**
 * Mailjet - Email Resource
 * Re-exports all operation types for this resource.
 */

import type { MailjetV1EmailSendNode } from './operation_send';
import type { MailjetV1EmailSendTemplateNode } from './operation_send_template';

export * from './operation_send';
export * from './operation_send_template';

export type MailjetV1EmailNode =
  | MailjetV1EmailSendNode
  | MailjetV1EmailSendTemplateNode
  ;