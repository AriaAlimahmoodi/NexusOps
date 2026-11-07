/**
 * Matrix Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MatrixV1AccountNode } from './resource_account';
import type { MatrixV1EventNode } from './resource_event';
import type { MatrixV1MediaNode } from './resource_media';
import type { MatrixV1MessageNode } from './resource_message';
import type { MatrixV1RoomNode } from './resource_room';
import type { MatrixV1RoomMemberNode } from './resource_room_member';

export * from './resource_account';
export * from './resource_event';
export * from './resource_media';
export * from './resource_message';
export * from './resource_room';
export * from './resource_room_member';

export type MatrixV1Node =
  | MatrixV1AccountNode
  | MatrixV1EventNode
  | MatrixV1MediaNode
  | MatrixV1MessageNode
  | MatrixV1RoomNode
  | MatrixV1RoomMemberNode
  ;