/**
 * Microsoft Outlook - Message Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftOutlookV2MessageDeleteNode } from './operation_delete';
import type { MicrosoftOutlookV2MessageGetNode } from './operation_get';
import type { MicrosoftOutlookV2MessageGetAllNode } from './operation_get_all';
import type { MicrosoftOutlookV2MessageMoveNode } from './operation_move';
import type { MicrosoftOutlookV2MessageReplyNode } from './operation_reply';
import type { MicrosoftOutlookV2MessageSendNode } from './operation_send';
import type { MicrosoftOutlookV2MessageSendAndWaitNode } from './operation_send_and_wait';
import type { MicrosoftOutlookV2MessageUpdateNode } from './operation_update';

export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_move';
export * from './operation_reply';
export * from './operation_send';
export * from './operation_send_and_wait';
export * from './operation_update';

export type MicrosoftOutlookV2MessageNode =
  | MicrosoftOutlookV2MessageDeleteNode
  | MicrosoftOutlookV2MessageGetNode
  | MicrosoftOutlookV2MessageGetAllNode
  | MicrosoftOutlookV2MessageMoveNode
  | MicrosoftOutlookV2MessageReplyNode
  | MicrosoftOutlookV2MessageSendNode
  | MicrosoftOutlookV2MessageSendAndWaitNode
  | MicrosoftOutlookV2MessageUpdateNode
  ;