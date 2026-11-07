/**
 * Matrix - RoomMember Resource
 * Re-exports all operation types for this resource.
 */

import type { MatrixV1RoomMemberGetAllNode } from './operation_get_all';

export * from './operation_get_all';

export type MatrixV1RoomMemberNode = MatrixV1RoomMemberGetAllNode;