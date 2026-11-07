/**
 * Matrix - Room Resource
 * Re-exports all operation types for this resource.
 */

import type { MatrixV1RoomCreateNode } from './operation_create';
import type { MatrixV1RoomInviteNode } from './operation_invite';
import type { MatrixV1RoomJoinNode } from './operation_join';
import type { MatrixV1RoomKickNode } from './operation_kick';
import type { MatrixV1RoomLeaveNode } from './operation_leave';

export * from './operation_create';
export * from './operation_invite';
export * from './operation_join';
export * from './operation_kick';
export * from './operation_leave';

export type MatrixV1RoomNode =
  | MatrixV1RoomCreateNode
  | MatrixV1RoomInviteNode
  | MatrixV1RoomJoinNode
  | MatrixV1RoomKickNode
  | MatrixV1RoomLeaveNode
  ;