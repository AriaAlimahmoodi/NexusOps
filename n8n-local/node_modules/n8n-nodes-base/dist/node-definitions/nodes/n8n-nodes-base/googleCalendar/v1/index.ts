/**
 * Google Calendar Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { GoogleCalendarV1CalendarNode } from './resource_calendar';
import type { GoogleCalendarV1EventNode } from './resource_event';

export * from './resource_calendar';
export * from './resource_event';

export type GoogleCalendarV1Node =
  | GoogleCalendarV1CalendarNode
  | GoogleCalendarV1EventNode
  ;