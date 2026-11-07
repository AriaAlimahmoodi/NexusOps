/**
 * WhatsApp Business Cloud - Message Resource
 * Re-exports all operation types for this resource.
 */

import type { WhatsAppV11MessageSendNode } from './operation_send';
import type { WhatsAppV11MessageSendAndWaitNode } from './operation_send_and_wait';
import type { WhatsAppV11MessageSendTemplateNode } from './operation_send_template';

export * from './operation_send';
export * from './operation_send_and_wait';
export * from './operation_send_template';

export type WhatsAppV11MessageNode =
  | WhatsAppV11MessageSendNode
  | WhatsAppV11MessageSendAndWaitNode
  | WhatsAppV11MessageSendTemplateNode
  ;