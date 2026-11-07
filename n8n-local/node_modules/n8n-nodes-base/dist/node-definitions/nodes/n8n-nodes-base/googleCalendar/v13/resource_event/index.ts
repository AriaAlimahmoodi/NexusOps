/**
 * Google Calendar - Event Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleCalendarV13EventCreateNode } from './operation_create';
import type { GoogleCalendarV13EventDeleteNode } from './operation_delete';
import type { GoogleCalendarV13EventGetNode } from './operation_get';
import type { GoogleCalendarV13EventGetAllNode } from './operation_get_all';
import type { GoogleCalendarV13EventUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type GoogleCalendarV13EventNode =
  | GoogleCalendarV13EventCreateNode
  | GoogleCalendarV13EventDeleteNode
  | GoogleCalendarV13EventGetNode
  | GoogleCalendarV13EventGetAllNode
  | GoogleCalendarV13EventUpdateNode
  ;