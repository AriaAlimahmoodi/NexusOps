/**
 * Mandrill - Message Resource
 * Re-exports all operation types for this resource.
 */

import type { MandrillV1MessageSendHtmlNode } from './operation_send_html';
import type { MandrillV1MessageSendTemplateNode } from './operation_send_template';

export * from './operation_send_html';
export * from './operation_send_template';

export type MandrillV1MessageNode =
  | MandrillV1MessageSendHtmlNode
  | MandrillV1MessageSendTemplateNode
  ;