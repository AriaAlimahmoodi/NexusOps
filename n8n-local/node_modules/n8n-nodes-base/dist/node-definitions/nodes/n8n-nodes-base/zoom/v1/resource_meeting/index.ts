/**
 * Zoom - Meeting Resource
 * Re-exports all operation types for this resource.
 */

import type { ZoomV1MeetingCreateNode } from './operation_create';
import type { ZoomV1MeetingDeleteNode } from './operation_delete';
import type { ZoomV1MeetingGetNode } from './operation_get';
import type { ZoomV1MeetingGetAllNode } from './operation_get_all';
import type { ZoomV1MeetingUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type ZoomV1MeetingNode =
  | ZoomV1MeetingCreateNode
  | ZoomV1MeetingDeleteNode
  | ZoomV1MeetingGetNode
  | ZoomV1MeetingGetAllNode
  | ZoomV1MeetingUpdateNode
  ;