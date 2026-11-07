/**
 * Microsoft Outlook - Message Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftOutlookV1MessageDeleteNode } from './operation_delete';
import type { MicrosoftOutlookV1MessageGetNode } from './operation_get';
import type { MicrosoftOutlookV1MessageGetAllNode } from './operation_get_all';
import type { MicrosoftOutlookV1MessageGetMimeNode } from './operation_get_mime';
import type { MicrosoftOutlookV1MessageMoveNode } from './operation_move';
import type { MicrosoftOutlookV1MessageReplyNode } from './operation_reply';
import type { MicrosoftOutlookV1MessageSendNode } from './operation_send';
import type { MicrosoftOutlookV1MessageUpdateNode } from './operation_update';

export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_mime';
export * from './operation_move';
export * from './operation_reply';
export * from './operation_send';
export * from './operation_update';

export type MicrosoftOutlookV1MessageNode =
  | MicrosoftOutlookV1MessageDeleteNode
  | MicrosoftOutlookV1MessageGetNode
  | MicrosoftOutlookV1MessageGetAllNode
  | MicrosoftOutlookV1MessageGetMimeNode
  | MicrosoftOutlookV1MessageMoveNode
  | MicrosoftOutlookV1MessageReplyNode
  | MicrosoftOutlookV1MessageSendNode
  | MicrosoftOutlookV1MessageUpdateNode
  ;