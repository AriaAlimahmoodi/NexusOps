/**
 * Google Calendar - Event Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleCalendarV11EventCreateNode } from './operation_create';
import type { GoogleCalendarV11EventDeleteNode } from './operation_delete';
import type { GoogleCalendarV11EventGetNode } from './operation_get';
import type { GoogleCalendarV11EventGetAllNode } from './operation_get_all';
import type { GoogleCalendarV11EventUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type GoogleCalendarV11EventNode =
  | GoogleCalendarV11EventCreateNode
  | GoogleCalendarV11EventDeleteNode
  | GoogleCalendarV11EventGetNode
  | GoogleCalendarV11EventGetAllNode
  | GoogleCalendarV11EventUpdateNode
  ;