/**
 * Google Calendar - Event Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleCalendarV12EventCreateNode } from './operation_create';
import type { GoogleCalendarV12EventDeleteNode } from './operation_delete';
import type { GoogleCalendarV12EventGetNode } from './operation_get';
import type { GoogleCalendarV12EventGetAllNode } from './operation_get_all';
import type { GoogleCalendarV12EventUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type GoogleCalendarV12EventNode =
  | GoogleCalendarV12EventCreateNode
  | GoogleCalendarV12EventDeleteNode
  | GoogleCalendarV12EventGetNode
  | GoogleCalendarV12EventGetAllNode
  | GoogleCalendarV12EventUpdateNode
  ;