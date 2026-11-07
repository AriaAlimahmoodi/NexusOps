/**
 * WhatsApp Business Cloud - Message Resource
 * Re-exports all operation types for this resource.
 */

import type { WhatsAppV1MessageSendNode } from './operation_send';
import type { WhatsAppV1MessageSendAndWaitNode } from './operation_send_and_wait';
import type { WhatsAppV1MessageSendTemplateNode } from './operation_send_template';

export * from './operation_send';
export * from './operation_send_and_wait';
export * from './operation_send_template';

export type WhatsAppV1MessageNode =
  | WhatsAppV1MessageSendNode
  | WhatsAppV1MessageSendAndWaitNode
  | WhatsAppV1MessageSendTemplateNode
  ;