/**
 * Google Calendar Node - Version 1.1
 * Re-exports all discriminator combinations.
 */

import type { GoogleCalendarV11CalendarNode } from './resource_calendar';
import type { GoogleCalendarV11EventNode } from './resource_event';

export * from './resource_calendar';
export * from './resource_event';

export type GoogleCalendarV11Node =
  | GoogleCalendarV11CalendarNode
  | GoogleCalendarV11EventNode
  ;