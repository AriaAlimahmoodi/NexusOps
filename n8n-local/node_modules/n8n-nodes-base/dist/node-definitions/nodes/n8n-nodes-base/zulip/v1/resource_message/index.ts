/**
 * Zulip - Message Resource
 * Re-exports all operation types for this resource.
 */

import type { ZulipV1MessageDeleteNode } from './operation_delete';
import type { ZulipV1MessageGetNode } from './operation_get';
import type { ZulipV1MessageSendPrivateNode } from './operation_send_private';
import type { ZulipV1MessageSendStreamNode } from './operation_send_stream';
import type { ZulipV1MessageUpdateNode } from './operation_update';
import type { ZulipV1MessageUpdateFileNode } from './operation_update_file';

export * from './operation_delete';
export * from './operation_get';
export * from './operation_send_private';
export * from './operation_send_stream';
export * from './operation_update';
export * from './operation_update_file';

export type ZulipV1MessageNode =
  | ZulipV1MessageDeleteNode
  | ZulipV1MessageGetNode
  | ZulipV1MessageSendPrivateNode
  | ZulipV1MessageSendStreamNode
  | ZulipV1MessageUpdateNode
  | ZulipV1MessageUpdateFileNode
  ;