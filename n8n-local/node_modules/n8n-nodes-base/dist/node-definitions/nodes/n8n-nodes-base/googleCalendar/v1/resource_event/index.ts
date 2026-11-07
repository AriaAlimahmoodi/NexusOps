/**
 * Google Calendar - Event Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleCalendarV1EventCreateNode } from './operation_create';
import type { GoogleCalendarV1EventDeleteNode } from './operation_delete';
import type { GoogleCalendarV1EventGetNode } from './operation_get';
import type { GoogleCalendarV1EventGetAllNode } from './operation_get_all';
import type { GoogleCalendarV1EventUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type GoogleCalendarV1EventNode =
  | GoogleCalendarV1EventCreateNode
  | GoogleCalendarV1EventDeleteNode
  | GoogleCalendarV1EventGetNode
  | GoogleCalendarV1EventGetAllNode
  | GoogleCalendarV1EventUpdateNode
  ;