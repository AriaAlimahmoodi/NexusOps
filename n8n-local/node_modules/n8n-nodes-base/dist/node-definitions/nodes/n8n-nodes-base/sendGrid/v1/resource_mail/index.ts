/**
 * SendGrid - Mail Resource
 * Re-exports all operation types for this resource.
 */

import type { SendGridV1MailSendNode } from './operation_send';

export * from './operation_send';

export type SendGridV1MailNode = SendGridV1MailSendNode;