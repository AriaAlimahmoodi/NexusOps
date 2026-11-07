/**
 * GoToWebinar - Attendee Resource
 * Re-exports all operation types for this resource.
 */

import type { GoToWebinarV1AttendeeGetNode } from './operation_get';
import type { GoToWebinarV1AttendeeGetAllNode } from './operation_get_all';
import type { GoToWebinarV1AttendeeGetDetailsNode } from './operation_get_details';

export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_details';

export type GoToWebinarV1AttendeeNode =
  | GoToWebinarV1AttendeeGetNode
  | GoToWebinarV1AttendeeGetAllNode
  | GoToWebinarV1AttendeeGetDetailsNode
  ;