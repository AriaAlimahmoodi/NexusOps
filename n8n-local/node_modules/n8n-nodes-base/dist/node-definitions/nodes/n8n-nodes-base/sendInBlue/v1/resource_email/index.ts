/**
 * Brevo - Email Resource
 * Re-exports all operation types for this resource.
 */

import type { SendInBlueV1EmailSendNode } from './operation_send';
import type { SendInBlueV1EmailSendTemplateNode } from './operation_send_template';

export * from './operation_send';
export * from './operation_send_template';

export type SendInBlueV1EmailNode =
  | SendInBlueV1EmailSendNode
  | SendInBlueV1EmailSendTemplateNode
  ;